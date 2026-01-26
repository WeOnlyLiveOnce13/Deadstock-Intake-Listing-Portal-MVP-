import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * PrismaModule - Global database module
 *
 * Why @Global()?
 * - Makes PrismaService available to ALL modules without importing PrismaModule everywhere
 * - Common pattern for cross-cutting concerns (database, config, logging)
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
