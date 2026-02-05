import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      message: 'Muna Africa API is running',
      timestamp: new Date().toISOString(),
    };
  }
}
