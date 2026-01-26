import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service.js';
import { calculateResalePrice } from '../common/constants/pricing.constants.js';
import {
  type InventoryRowParsed,
  type InventoryCreateInput,
  type InventoryUpdateInput,
} from './dto/inventory.schema.js';
import {
  validateRows,
  validateHeaders,
  isEmptyRow,
} from './helpers/csv-validation.js';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: InventoryCreateInput) {
    const existing = await this.prisma.inventoryItem.findUnique({
      where: {
        userId_merchantId_sku: {
          userId,
          merchantId: data.merchant_id,
          sku: data.sku,
        },
      },
    });
    if (existing)
      throw new ConflictException(
        `Item ${data.merchant_id}:${data.sku} already exists`,
      );

    const resalePrice = calculateResalePrice(
      data.original_price,
      data.condition,
      data.category,
    );

    return this.prisma.inventoryItem.create({
      data: {
        userId,
        merchantId: data.merchant_id,
        sku: data.sku,
        title: data.title,
        brand: data.brand ?? null,
        category: data.category,
        condition: data.condition.toUpperCase().replace('_', '_') as
          | 'NEW'
          | 'LIKE_NEW'
          | 'GOOD'
          | 'FAIR',
        originalPrice: data.original_price,
        resalePrice,
        currency: data.currency,
        quantity: data.quantity,
      },
    });
  }

  async findAll(userId: string, statuses?: string[]) {
    return this.prisma.inventoryItem.findMany({
      where: {
        userId,
        ...(statuses?.length && {
          status: { in: statuses as ('DRAFT' | 'PRICED' | 'LISTED')[] },
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async update(userId: string, id: string, data: InventoryUpdateInput) {
    await this.findOne(userId, id); // Throws if not found
    return this.prisma.inventoryItem.update({
      where: { id },
      data: this.mapUpdateData(data),
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.inventoryItem.delete({ where: { id } });
  }

  async bulkUpload(userId: string, csvBuffer: Buffer) {
    // Parse CSV
    const content = csvBuffer.toString('utf-8');
    const records: Record<string, string>[] = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    // Validate headers
    if (records.length === 0)
      return { success: false, error: 'CSV file is empty' };
    const headers = Object.keys(records[0]);
    const headerCheck = validateHeaders(headers);
    if (!headerCheck.isValid) {
      return {
        success: false,
        error: `Missing headers: ${headerCheck.missing.join(', ')}`,
      };
    }

    // Filter empty rows and validate
    const nonEmptyRows = records.filter((row) => !isEmptyRow(row));
    const validation = validateRows(nonEmptyRows);

    // Check for existing items in DB
    const existingItems = await this.prisma.inventoryItem.findMany({
      where: { userId },
      select: { merchantId: true, sku: true },
    });
    const existingKeys = new Set(
      existingItems.map((i) => `${i.merchantId}:${i.sku}`),
    );

    // Separate valid rows into new vs duplicate
    const toInsert: InventoryRowParsed[] = [];
    const dbDuplicates: { rowNumber: number; errors: string[] }[] = [];

    for (const row of validation.validRows) {
      const key = `${row.data.merchant_id}:${row.data.sku}`;
      if (existingKeys.has(key)) {
        dbDuplicates.push({
          rowNumber: row.rowNumber,
          errors: [`Already exists in database: ${key}`],
        });
      } else {
        toInsert.push(row.data);
      }
    }

    // Insert valid items
    let inserted = 0;
    if (toInsert.length > 0) {
      const createData = toInsert.map((row) => ({
        userId,
        merchantId: row.merchant_id,
        sku: row.sku,
        title: row.title,
        brand: row.brand,
        category: row.category,
        condition: row.condition.toUpperCase().replace('_', '_') as
          | 'NEW'
          | 'LIKE_NEW'
          | 'GOOD'
          | 'FAIR',
        originalPrice: row.original_price,
        resalePrice: calculateResalePrice(
          row.original_price,
          row.condition,
          row.category,
        ),
        currency: row.currency,
        quantity: row.quantity,
      }));
      const result = await this.prisma.inventoryItem.createMany({
        data: createData,
      });
      inserted = result.count;
    }

    return {
      success: true,
      summary: {
        total: nonEmptyRows.length,
        inserted,
        invalid: validation.invalidRows.length,
        duplicatesInFile: validation.duplicateRows.length,
        duplicatesInDb: dbDuplicates.length,
      },
      errors: {
        invalid: validation.invalidRows,
        duplicatesInFile: validation.duplicateRows,
        duplicatesInDb: dbDuplicates,
      },
    };
  }

  private mapUpdateData(data: InventoryUpdateInput) {
    const mapped: Record<string, unknown> = {};
    if (data.merchant_id) mapped.merchantId = data.merchant_id;
    if (data.sku) mapped.sku = data.sku;
    if (data.title) mapped.title = data.title;
    if (data.brand !== undefined) mapped.brand = data.brand;
    if (data.category) mapped.category = data.category;
    if (data.condition) mapped.condition = data.condition.toUpperCase();
    if (data.original_price) mapped.originalPrice = data.original_price;
    if (data.resale_price !== undefined) mapped.resalePrice = data.resale_price;
    if (data.currency) mapped.currency = data.currency;
    if (data.quantity) mapped.quantity = data.quantity;
    return mapped;
  }

  // Pricing: auto-calculate resale price for single item
  async autoPrice(userId: string, id: string) {
    const item = await this.findOne(userId, id);
    const resalePrice = calculateResalePrice(
      item.originalPrice,
      item.condition.toLowerCase(),
      item.category,
    );
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { resalePrice, status: 'PRICED' },
    });
  }

  // Pricing: auto-calculate resale price for multiple items
  async autoPriceBulk(userId: string, ids: string[]) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { id: { in: ids }, userId },
    });

    const updates = items.map((item) => {
      const resalePrice = calculateResalePrice(
        item.originalPrice,
        item.condition.toLowerCase(),
        item.category,
      );
      return this.prisma.inventoryItem.update({
        where: { id: item.id },
        data: { resalePrice, status: 'PRICED' },
      });
    });

    const updatedItems = await Promise.all(updates);
    return {
      success: true,
      data: { processed: updatedItems.length, items: updatedItems },
    };
  }

  // Pricing: manual override
  async setPrice(userId: string, id: string, resalePrice: number) {
    await this.findOne(userId, id);
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { resalePrice, status: 'PRICED' },
    });
  }

  // Listing: mark single item as listed
  async listItem(userId: string, id: string) {
    const item = await this.findOne(userId, id);
    if (item.status === 'DRAFT') {
      throw new ConflictException('Item must be priced before listing');
    }
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { status: 'LISTED' },
    });
  }

  // Listing: mark multiple items as listed
  async listBulk(userId: string, ids: string[]) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { id: { in: ids }, userId },
    });

    const notPriced = items.filter((i) => i.status === 'DRAFT');
    if (notPriced.length > 0) {
      return {
        success: false,
        error: `${notPriced.length} items not priced`,
        notPricedIds: notPriced.map((i) => i.id),
      };
    }

    await this.prisma.inventoryItem.updateMany({
      where: { id: { in: ids }, userId },
      data: { status: 'LISTED' },
    });

    // Fetch the updated items to return
    const updatedItems = await this.prisma.inventoryItem.findMany({
      where: { id: { in: ids }, userId },
    });

    return {
      success: true,
      data: { processed: updatedItems.length, items: updatedItems },
    };
  }
}
