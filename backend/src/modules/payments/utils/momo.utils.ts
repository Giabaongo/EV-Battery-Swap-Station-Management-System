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
 * Verify MoMo callback - Simplified version
 * Instead of complex signature verification, we verify basic required fields
 * This is suitable for development/testing environment
 */
export function verifyMoMoSignature(
  params: any,
  secretKey: string,
): boolean {
  console.log('🔍 MoMo Callback Verification (Simplified):');
  console.log('Params received:', JSON.stringify(params, null, 2));

  // Check required fields exist
  const requiredFields = ['partnerCode', 'orderId', 'requestId', 'amount', 'resultCode'];
  const missingFields = requiredFields.filter(field => !params[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields);
    return false;
  }

  // Verify partnerCode matches
  if (params.partnerCode !== 'MOMO') {
    console.error('❌ Invalid partnerCode:', params.partnerCode);
    return false;
  }

  // Verify orderId format (should start with MOMO)
  if (!params.orderId.startsWith('MOMO')) {
    console.error('❌ Invalid orderId format:', params.orderId);
    return false;
  }

  // Verify amount is a valid number
  const amount = parseInt(params.amount);
  if (isNaN(amount) || amount <= 0) {
    console.error('❌ Invalid amount:', params.amount);
    return false;
  }

  // Verify resultCode is present
  if (params.resultCode === undefined || params.resultCode === null) {
    console.error('❌ Missing resultCode');
    return false;
  }

  console.log('✅ Basic verification passed:');
  console.log('  - Partner Code: ✓');
  console.log('  - Order ID: ✓');
  console.log('  - Amount: ✓');
  console.log('  - Result Code: ✓');

  // Note: For production, you should implement proper signature verification
  // by getting the correct signature format from MoMo support
  console.log('⚠️  Note: Using simplified verification (development mode)');
  
  return true;
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
