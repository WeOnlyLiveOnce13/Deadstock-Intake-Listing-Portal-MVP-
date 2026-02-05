import { Injectable, Logger } from '@nestjs/common';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
}

export interface PaymentResponse {
  success: boolean;
  authorizationId?: string;
  transactionId?: string;
  message: string;
  error?: PaymentError;
  processedAt: Date;
}

export type PaymentError =
  | 'INSUFFICIENT_FUNDS'
  | 'CARD_DECLINED'
  | 'EXPIRED_CARD'
  | 'INVALID_CARD'
  | 'FRAUD_DETECTED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private successRate = 0.9;
  private minLatency = 500;
  private maxLatency = 1500;

  async authorizePayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.logger.log(
      `Processing payment: ${request.currency} ${request.amount} for order ${request.orderId}`,
    );

    // Simulate network latency
    await this.simulateLatency();

    // Determine success/failure
    const isSuccess = Math.random() < this.successRate;

    if (isSuccess) {
      return this.createSuccessResponse(request);
    } else {
      return this.createFailureResponse(request);
    }
  }

  async capturePayment(authorizationId: string): Promise<PaymentResponse> {
    this.logger.log(`Capturing payment: ${authorizationId}`);

    await this.simulateLatency();

    return {
      success: true,
      authorizationId,
      transactionId: this.generateTransactionId(),
      message: 'Payment captured successfully',
      processedAt: new Date(),
    };
  }

  async refundPayment(
    transactionId: string,
    amount: number,
  ): Promise<PaymentResponse> {
    this.logger.log(`Refunding payment: ${transactionId}, amount: ${amount}`);

    await this.simulateLatency();

    return {
      success: true,
      transactionId: `REFUND-${transactionId}`,
      message: `Refund of ${amount} processed successfully`,
      processedAt: new Date(),
    };
  }

  async voidAuthorization(authorizationId: string): Promise<PaymentResponse> {
    this.logger.log(`Voiding authorization: ${authorizationId}`);

    await this.simulateLatency();

    return {
      success: true,
      authorizationId,
      message: 'Authorization voided successfully',
      processedAt: new Date(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CONFIGURATION METHODS (for testing)
  // ─────────────────────────────────────────────────────────────────────────────

  setSuccessRate(rate: number): void {
    this.successRate = Math.max(0, Math.min(1, rate));
    this.logger.log(`Payment success rate set to ${this.successRate * 100}%`);
  }

  setLatency(min: number, max: number): void {
    this.minLatency = min;
    this.maxLatency = max;
    this.logger.log(`Payment latency set to ${min}-${max}ms`);
  }

  disableLatency(): void {
    this.minLatency = 0;
    this.maxLatency = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  private async simulateLatency(): Promise<void> {
    const latency =
      this.minLatency + Math.random() * (this.maxLatency - this.minLatency);
    await new Promise((resolve) => setTimeout(resolve, latency));
  }

  private generateAuthorizationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `AUTH-${timestamp}-${random}`;
  }

  private generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `TXN-${timestamp}-${random}`;
  }

  private createSuccessResponse(request: PaymentRequest): PaymentResponse {
    this.logger.log(`Payment authorized for order ${request.orderId}`);

    return {
      success: true,
      authorizationId: this.generateAuthorizationId(),
      transactionId: this.generateTransactionId(),
      message: 'Payment authorized successfully',
      processedAt: new Date(),
    };
  }

  private createFailureResponse(request: PaymentRequest): PaymentResponse {
    const errors: Array<{ error: PaymentError; message: string }> = [
      {
        error: 'INSUFFICIENT_FUNDS',
        message: 'Payment declined: Insufficient funds',
      },
      {
        error: 'CARD_DECLINED',
        message: 'Payment declined: Card declined by issuer',
      },
      {
        error: 'EXPIRED_CARD',
        message: 'Payment declined: Card has expired',
      },
      {
        error: 'FRAUD_DETECTED',
        message: 'Payment declined: Suspected fraud',
      },
      {
        error: 'NETWORK_ERROR',
        message: 'Payment failed: Network error, please try again',
      },
    ];

    const randomError = errors[Math.floor(Math.random() * errors.length)];

    this.logger.warn(
      `Payment failed for order ${request.orderId}: ${randomError.message}`,
    );

    return {
      success: false,
      message: randomError.message,
      error: randomError.error,
      processedAt: new Date(),
    };
  }
}
