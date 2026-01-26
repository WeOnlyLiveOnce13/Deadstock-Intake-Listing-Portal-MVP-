import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { signUpSchema, signInSchema } from './dto/auth.schema';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(new ZodValidationPipe(signUpSchema))
  async signUp(@Body() body: { email: string; password: string }) {
    const result = await this.authService.signUp(body);
    return { success: true, data: result };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(signInSchema))
  async signIn(@Body() body: { email: string; password: string }) {
    const result = await this.authService.signIn(body);
    return { success: true, data: result };
  }
}
