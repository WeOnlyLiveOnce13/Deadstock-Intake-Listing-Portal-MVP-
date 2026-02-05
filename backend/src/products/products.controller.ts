import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query('category') category?: string) {
    const products = await this.productsService.findAll(category);
    return { success: true, data: products };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.productsService.getCategories();
    return { success: true, data: categories };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return { success: true, data: product };
  }
}
