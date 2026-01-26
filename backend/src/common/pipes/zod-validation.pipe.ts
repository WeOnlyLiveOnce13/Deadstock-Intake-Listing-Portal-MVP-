import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';
import { ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private schema: ZodType<T>) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map(
          (i) => `${i.path.join('.')}: ${i.message}`,
        );
        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
