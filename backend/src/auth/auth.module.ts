import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * AuthModule - Authentication feature module
 *
 * Provides:
 * - User registration (sign up)
 * - User authentication (sign in)
 * - JWT token management
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // Export for use in guards
})
export class AuthModule {}
