import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from './payment.service';
import {
  validateDiscount,
  applyDiscount,
} from '../common/constants/discounts.constants';

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  discountCode?: string;
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
}

// Type for Prisma interactive transaction client
type TransactionClient = Parameters<
  Parameters<PrismaService['$transaction']>[0]
>[0];

/**
 * Safely parse statusHistory - handles both string and object inputs
 * SQLite stores JSON as string, but Prisma might return it as object in some cases
 */
function parseStatusHistory(statusHistory: unknown): StatusHistoryEntry[] {
  if (typeof statusHistory === 'string') {
    try {
      return JSON.parse(statusHistory);
    } catch {
      return [];
    }
  }
  if (Array.isArray(statusHistory)) {
    return statusHistory as StatusHistoryEntry[];
  }
  return [];
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async createOrder(buyerId: string, input: CreateOrderInput) {
    this.logger.log(`Creating order for buyer ${buyerId}`);

    // Validate input
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Use an interactive Prisma transaction to ensure atomicity
    // If ANY step fails, ALL changes are rolled back (including inventory deduction)
    try {
      const finalOrder = await this.prisma.$transaction(
        async (tx) => {
          // ═══════════════════════════════════════════════════════════════════════
          // STEP 1: ORDER CREATION
          // ═══════════════════════════════════════════════════════════════════════
          const { order, orderItems } = await this.step1_createOrder(
            tx,
            buyerId,
            input,
          );
          this.logger.log(
            `Step 1 Complete: Order ${order.orderNumber} created`,
          );

          // ═══════════════════════════════════════════════════════════════════════
          // STEP 2: INVENTORY VALIDATION
          // ═══════════════════════════════════════════════════════════════════════
          await this.step2_validateInventory(tx, orderItems);
          this.logger.log(`Step 2 Complete: Inventory validated and reserved`);

          // ═══════════════════════════════════════════════════════════════════════
          // STEP 3: PRICE & DISCOUNT VALIDATION
          // ═══════════════════════════════════════════════════════════════════════
          const pricing = await this.step3_validatePricing(
            tx,
            order.id,
            input.discountCode,
          );
          this.logger.log(
            `Step 3 Complete: Pricing validated, total: ${pricing.total}`,
          );

          // ═══════════════════════════════════════════════════════════════════════
          // STEP 4: PAYMENT AUTHORIZATION
          // ═══════════════════════════════════════════════════════════════════════
          await this.step4_authorizePayment(
            tx,
            order.id,
            pricing.total,
            pricing.currency,
          );
          this.logger.log(`Step 4 Complete: Payment authorized`);

          // ═══════════════════════════════════════════════════════════════════════
          // STEP 5: ORDER CONFIRMATION
          // ═══════════════════════════════════════════════════════════════════════
          await this.step5_confirmOrder(tx, order.id);
          this.logger.log(`Step 5 Complete: Order confirmed`);

          // ═══════════════════════════════════════════════════════════════════════
          // STEP 6: INVENTORY DEDUCTION
          // ═══════════════════════════════════════════════════════════════════════
          await this.step6_deductInventory(tx, orderItems);
          this.logger.log(`Step 6 Complete: Inventory deducted`);

          // ═══════════════════════════════════════════════════════════════════════
          // STEP 7: FULFILLMENT TRIGGER
          // ═══════════════════════════════════════════════════════════════════════
          const fulfilledOrder = await this.step7_fulfillOrder(tx, order.id);
          this.logger.log(
            `Step 7 Complete: Order ${order.orderNumber} fulfilled`,
          );

          return fulfilledOrder;
        },
        {
          // Transaction options: timeout after 30 seconds
          timeout: 30000,
        },
      );

      return finalOrder;
    } catch (error) {
      // Transaction automatically rolled back - inventory is NOT deducted
      this.logger.error(`Order creation failed: ${error.message}`);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: ORDER CREATION
  // ═══════════════════════════════════════════════════════════════════════════
  private async step1_createOrder(
    tx: TransactionClient,
    buyerId: string,
    input: CreateOrderInput,
  ) {
    // Generate order number: ORD-YYYYMMDDHHMMSS-XXXX
    const orderNumber = this.generateOrderNumber();

    // Fetch all products and validate they exist
    const products = await this.fetchProducts(tx, input.items);

    // Calculate line totals
    const orderItemsData = input.items.map((item) => {
      const product = products.get(item.productId)!;
      const lineTotal = product.resalePrice! * item.quantity;

      return {
        productId: item.productId,
        productTitle: product.title,
        productBrand: product.brand,
        unitPrice: product.resalePrice!,
        quantity: item.quantity,
        lineTotal,
      };
    });

    // Calculate subtotal
    const subtotal = orderItemsData.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    // Get currency from first product
    const currency = products.values().next().value?.currency || 'ZAR';

    // Create order with items
    const order = await tx.order.create({
      data: {
        orderNumber,
        buyerId,
        subtotal,
        total: subtotal, // Will be updated in step 3 with discounts
        currency,
        status: 'PENDING',
        statusHistory: JSON.stringify([
          {
            status: 'PENDING',
            timestamp: new Date().toISOString(),
            note: 'Order created',
          },
        ] as StatusHistoryEntry[]),
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return { order, orderItems: order.items };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: INVENTORY VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  private async step2_validateInventory(
    tx: TransactionClient,
    orderItems: { productId: string; quantity: number }[],
  ) {
    for (const item of orderItems) {
      const product = await tx.inventoryItem.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product not found: ${item.productId}`);
      }

      if (product.status !== 'LISTED') {
        throw new BadRequestException(
          `Product "${product.title}" is not available for purchase`,
        );
      }

      if (product.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.title}". Available: ${product.quantity}, Requested: ${item.quantity}`,
        );
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: PRICE & DISCOUNT VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  private async step3_validatePricing(
    tx: TransactionClient,
    orderId: string,
    discountCode?: string,
  ) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Apply discount if provided
    const pricing = applyDiscount(order.subtotal, discountCode);

    // If discount code was provided but invalid, log it
    if (discountCode && !pricing.discountCode) {
      const validation = validateDiscount(discountCode, order.subtotal);
      this.logger.warn(`Discount code invalid: ${validation.error}`);
    }

    // Update order with pricing
    await tx.order.update({
      where: { id: orderId },
      data: {
        discountCode: pricing.discountCode,
        discountAmount: pricing.discountAmount,
        total: pricing.total,
      },
    });

    return {
      subtotal: order.subtotal,
      discountCode: pricing.discountCode,
      discountAmount: pricing.discountAmount,
      total: pricing.total,
      currency: order.currency,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: PAYMENT AUTHORIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  private async step4_authorizePayment(
    tx: TransactionClient,
    orderId: string,
    amount: number,
    currency: string,
  ) {
    const paymentResponse = await this.paymentService.authorizePayment({
      orderId,
      amount,
      currency,
    });

    if (!paymentResponse.success) {
      throw new BadRequestException(
        `Payment authorization failed: ${paymentResponse.message}`,
      );
    }

    // Store payment authorization
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentAuthId: paymentResponse.authorizationId,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: ORDER CONFIRMATION
  // ═══════════════════════════════════════════════════════════════════════════

  private async step5_confirmOrder(tx: TransactionClient, orderId: string) {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: INVENTORY DEDUCTION
  // ═══════════════════════════════════════════════════════════════════════════

  private async step6_deductInventory(
    tx: TransactionClient,
    orderItems: { productId: string; quantity: number }[],
  ) {
    for (const item of orderItems) {
      await tx.inventoryItem.update({
        where: { id: item.productId },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7: FULFILLMENT TRIGGER
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Step 7: Mark order as fulfilled
   *
   * WHAT HAPPENS:
   *   - Update status to FULFILLED
   *   - Set fulfillment timestamp
   *   - In real system: trigger shipping process
   */
  private async step7_fulfillOrder(tx: TransactionClient, orderId: string) {
    // Get current order to update status history
    const currentOrder = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!currentOrder) {
      throw new NotFoundException('Order not found');
    }

    // Parse and update status history
    const history = parseStatusHistory(currentOrder.statusHistory);
    history.push({
      status: 'FULFILLED',
      timestamp: new Date().toISOString(),
      note: 'Order fulfilled and ready for delivery',
    });

    // Update order with fulfilled status
    const order = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'FULFILLED',
        fulfilledAt: new Date(),
        statusHistory: JSON.stringify(history),
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                brand: true,
                category: true,
                condition: true,
              },
            },
          },
        },
      },
    });

    return {
      ...order,
      statusHistory: history,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  async findAll(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      ...order,
      statusHistory: parseStatusHistory(order.statusHistory),
      itemCount: order.items.length,
    }));
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        buyerId: userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                brand: true,
                category: true,
                condition: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      ...order,
      statusHistory: parseStatusHistory(order.statusHistory),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private generateOrderNumber(): string {
    const now = new Date();
    const datePart = now
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
  }

  private async fetchProducts(tx: TransactionClient, items: OrderItemInput[]) {
    const productIds = items.map((i) => i.productId);

    const products = await tx.inventoryItem.findMany({
      where: {
        id: { in: productIds },
        status: 'LISTED',
      },
    });

    // Create a map for easy lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate all products exist
    for (const item of items) {
      if (!productMap.has(item.productId)) {
        throw new NotFoundException(
          `Product not found or not available: ${item.productId}`,
        );
      }

      const product = productMap.get(item.productId)!;
      if (!product.resalePrice) {
        throw new BadRequestException(
          `Product "${product.title}" does not have a price`,
        );
      }
    }

    return productMap;
  }
}
