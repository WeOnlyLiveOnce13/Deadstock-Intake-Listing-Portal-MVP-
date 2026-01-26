import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  inventoryCreateSchema,
  inventoryUpdateSchema,
  bulkIdsSchema,
  setPriceSchema,
  type InventoryCreateInput,
  type InventoryUpdateInput,
  type BulkIdsInput,
  type SetPriceInput,
} from './dto/inventory.schema.js';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  async create(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(inventoryCreateSchema))
    body: InventoryCreateInput,
  ) {
    const item = await this.inventoryService.create(userId, body);
    return { success: true, data: item };
  }

  @Get()
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
  ) {
    // Support comma-separated statuses: ?status=DRAFT,PRICED
    const statuses = status ? status.split(',').filter(Boolean) : undefined;
    const items = await this.inventoryService.findAll(userId, statuses);
    return { success: true, data: items };
  }

  @Get(':id')
  async findOne(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    const item = await this.inventoryService.findOne(userId, id);
    return { success: true, data: item };
  }

  @Put(':id')
  async update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(inventoryUpdateSchema))
    body: InventoryUpdateInput,
  ) {
    const item = await this.inventoryService.update(userId, id, body);
    return { success: true, data: item };
  }

  @Delete(':id')
  async remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    await this.inventoryService.remove(userId, id);
    return { success: true, message: 'Item deleted' };
  }

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) return { success: false, error: 'No file uploaded' };
    const result = await this.inventoryService.bulkUpload(userId, file.buffer);
    return result;
  }

  // Pricing endpoints
  @Post(':id/auto-price')
  async autoPrice(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    const item = await this.inventoryService.autoPrice(userId, id);
    return { success: true, data: item };
  }

  @Post('auto-price-bulk')
  async autoPriceBulk(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(bulkIdsSchema)) body: BulkIdsInput,
  ) {
    const result = await this.inventoryService.autoPriceBulk(userId, body.ids);
    return result;
  }

  @Post(':id/set-price')
  async setPrice(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setPriceSchema)) body: SetPriceInput,
  ) {
    const item = await this.inventoryService.setPrice(
      userId,
      id,
      body.resale_price,
    );
    return { success: true, data: item };
  }

  // Listing endpoints
  @Post(':id/list')
  async listItem(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    const item = await this.inventoryService.listItem(userId, id);
    return { success: true, data: item };
  }

  @Post('list-bulk')
  async listBulk(
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(bulkIdsSchema)) body: BulkIdsInput,
  ) {
    const result = await this.inventoryService.listBulk(userId, body.ids);
    return result;
  }
}
