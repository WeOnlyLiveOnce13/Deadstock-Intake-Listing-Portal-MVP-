import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import * as ordersService_1 from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: ordersService_1.OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('sub') userId: string,
    @Body() body: ordersService_1.CreateOrderInput,
  ) {
    const order = await this.ordersService.createOrder(userId, body);
    return {
      success: true,
      message: 'Order successfully placed!',
      data: order,
    };
  }

  @Get()
  async findAll(@CurrentUser('sub') userId: string) {
    const orders = await this.ordersService.findAll(userId);
    return {
      success: true,
      data: orders,
    };
  }

  @Get(':id')
  async findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    const order = await this.ordersService.findOne(userId, id);
    return {
      success: true,
      data: order,
    };
  }
}
