import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        status: 'LISTED',
        quantity: { gt: 0 },
        ...(category && { category }),
      },
      select: {
        id: true,
        title: true,
        brand: true,
        category: true,
        condition: true,
        resalePrice: true,
        currency: true,
        quantity: true,
        status: true,
        createdAt: true,
      },
      // Newest products first
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.inventoryItem.findFirst({
      where: {
        id,
        status: 'LISTED',
        quantity: { gt: 0 },
      },
      select: {
        id: true,
        title: true,
        brand: true,
        category: true,
        condition: true,
        originalPrice: true,
        resalePrice: true,
        currency: true,
        quantity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If product doesn't exist or isn't available, throw 404
    if (!product) {
      throw new NotFoundException('Product not found or not available');
    }

    return product;
  }

  async getCategories(): Promise<string[]> {
    const products = await this.prisma.inventoryItem.findMany({
      where: {
        status: 'LISTED',
        quantity: { gt: 0 },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return products.map((p) => p.category);
  }
}
