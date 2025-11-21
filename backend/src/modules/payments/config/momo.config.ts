export const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
  accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
  secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  // Default to capture/create endpoint per MoMo docs; override via env if needed
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
  // Use https defaults to avoid MoMo rejecting http
  redirectUrl:
    process.env.MOMO_REDIRECT_URL ||
    'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
  ipnUrl:
    process.env.MOMO_IPN_URL ||
    'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
  // Request type can be payWithMethod (per sample) or captureWallet depending on merchant config
  requestType: process.env.MOMO_REQUEST_TYPE || 'payWithMethod',
  // Leave empty by default; when set, POS flow will be used
  paymentCode: process.env.MOMO_PAYMENT_CODE || '',
  extraData: '',
  autoCapture: true,
  lang: 'vi',
  // Mock mode - automatically returns success without calling real MoMo API
  useMockMode: process.env.MOMO_USE_MOCK === 'true', // Set to 'true' in .env to enable mock mode
};
