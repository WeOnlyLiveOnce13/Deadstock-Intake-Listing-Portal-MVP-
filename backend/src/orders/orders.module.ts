import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaymentService } from './payment.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],

  controllers: [OrdersController],

  providers: [OrdersService, PaymentService],

  exports: [OrdersService],
})
export class OrdersModule {}
