declare module "@adyen/api-library" {
  export default class Client {
    constructor(config: { apiKey: string; environment: string });
  }
  export class CheckoutAPI {
    constructor(client: Client);
    PaymentsApi: {
      payments(request: any): Promise<any>;
    };
    ModificationsApi: {
      captureAuthorisedPayment(pspReference: string, request: any): Promise<any>;
      refundCapturedPayment(pspReference: string, request: any): Promise<any>;
      cancelAuthorisedPaymentByPspReference(pspReference: string, request: any): Promise<any>;
    };
  }
  export enum Environment {
    TEST = "TEST",
    LIVE = "LIVE",
  }
}

declare module "square" {
  export class Client {
    constructor(config: { accessToken: string; environment: any });
    paymentsApi: {
      createPayment(request: any): Promise<any>;
      completePayment(paymentId: string, body: any): Promise<any>;
      cancelPayment(paymentId: string): Promise<any>;
      getPayment(paymentId: string): Promise<any>;
    };
    refundsApi: {
      refundPayment(request: any): Promise<any>;
    };
  }
  export enum Environment {
    Sandbox = "sandbox",
    Production = "production",
  }
}
