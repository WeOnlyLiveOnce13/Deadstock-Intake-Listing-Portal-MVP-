import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload, AuthenticatedRequest } from '../types/index.js';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return data ? request.user?.[data] : request.user;
  },
);
