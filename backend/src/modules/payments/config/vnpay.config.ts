export interface VNPayConfig {
  vnp_TmnCode: string;
  vnp_HashSecret: string;
  vnp_Url: string;
  vnp_ReturnUrl: string;
}

export const vnpayConfig: VNPayConfig = {
  // VNPAY Sandbox PUBLIC credentials (official test account)
  // Source: https://sandbox.vnpayment.vn/apis/vnpay-demo/
  vnp_TmnCode: process.env.VNP_TMN_CODE || 'JGP69JEE',
  vnp_HashSecret: process.env.VNP_HASH_SECRET || '9Y9YWW5IXQ2XE1ZIG1NLCR6AASBIRXZY',
  vnp_Url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:8080/api/v1/payments/vnpay-return',
};
