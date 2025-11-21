import * as crypto from 'crypto';

/**
 * Generate HMAC SHA256 signature for MoMo
 */
export function generateMoMoSignature(
  rawSignature: string,
  secretKey: string,
): string {
  const hmac = crypto.createHmac('sha256', secretKey);
  return hmac.update(rawSignature).digest('hex');
}

/**
 * Verify MoMo callback signature
 */
export function verifyMoMoSignature(
  params: any,
  secretKey: string,
): boolean {
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature,
  } = params;

  // Build raw signature string (must match order from MoMo docs)
  const rawSignature = `accessKey=${params.accessKey || ''}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const expectedSignature = generateMoMoSignature(rawSignature, secretKey);

  return signature === expectedSignature;
}

/**
 * Log MoMo parameters for debugging
 */
export function logMoMoParams(params: any, title: string = 'MoMo Params') {
  console.log(`========== ${title} ==========`);
  console.log('Partner Code:', params.partnerCode);
  console.log('Order ID:', params.orderId);
  console.log('Request ID:', params.requestId);
  console.log('Amount:', params.amount);
  console.log('Order Info:', params.orderInfo);
  console.log('Redirect URL:', params.redirectUrl);
  console.log('IPN URL:', params.ipnUrl);
  console.log('Signature:', params.signature);
  console.log('==================================================');
}
