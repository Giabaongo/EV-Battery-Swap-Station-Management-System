import * as crypto from 'crypto';
import * as qs from 'qs';

/**
 * Validate VNPAY parameters before sending
 */
export function validateVNPayParams(params: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  const requiredFields = [
    'vnp_Version',
    'vnp_Command',
    'vnp_TmnCode',
    'vnp_Amount',
    'vnp_CreateDate',
    'vnp_CurrCode',
    'vnp_IpAddr',
    'vnp_Locale',
    'vnp_OrderInfo',
    'vnp_ReturnUrl',
    'vnp_TxnRef',
  ];

  for (const field of requiredFields) {
    if (!params[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate specific fields
  if (params.vnp_Version && params.vnp_Version !== '2.1.0') {
    errors.push('vnp_Version must be 2.1.0');
  }

  if (params.vnp_Command && params.vnp_Command !== 'pay') {
    errors.push('vnp_Command must be "pay"');
  }

  if (params.vnp_CurrCode && params.vnp_CurrCode !== 'VND') {
    errors.push('vnp_CurrCode must be "VND"');
  }

  if (params.vnp_Locale && !['vn', 'en'].includes(params.vnp_Locale)) {
    errors.push('vnp_Locale must be "vn" or "en"');
  }

  if (params.vnp_Amount) {
    const amount = parseInt(params.vnp_Amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('vnp_Amount must be a positive integer');
    }
  }

  if (params.vnp_TxnRef && params.vnp_TxnRef.length > 100) {
    errors.push('vnp_TxnRef must not exceed 100 characters');
  }

  if (params.vnp_OrderInfo && params.vnp_OrderInfo.length > 255) {
    errors.push('vnp_OrderInfo must not exceed 255 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sort object by key (VNPAY style with URL encoding)
 * Based on official VNPAY sample code
 */
export function sortObject(obj: any): any {
  const sorted: any = {};
  const str: string[] = [];
  
  // Get all keys and encode them
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  
  // Sort keys
  str.sort();
  
  // Build sorted object with encoded values
  for (let i = 0; i < str.length; i++) {
    const key = str[i];
    const originalKey = decodeURIComponent(key);
    // Encode value and replace %20 with +
    sorted[originalKey] = encodeURIComponent(obj[originalKey]).replace(/%20/g, '+');
  }
  
  return sorted;
}

/**
 * Generate VNPAY secure hash
 */
export function generateSecureHash(
  params: any,
  secretKey: string,
): string {
  const sortedParams = sortObject(params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

/**
 * Verify VNPAY secure hash
 */
export function verifySecureHash(
  params: any,
  secureHash: string,
  secretKey: string,
): boolean {
  const paramsWithoutHash = { ...params };
  delete paramsWithoutHash.vnp_SecureHash;
  delete paramsWithoutHash.vnp_SecureHashType;
  
  const calculatedHash = generateSecureHash(paramsWithoutHash, secretKey);
  return calculatedHash === secureHash;
}

/**
 * Log VNPAY parameters for debugging
 */
export function logVNPayParams(params: any, label: string = 'VNPAY Params') {
  console.log(`\n========== ${label} ==========`);
  console.log('Sorted parameters:');
  const sortedParams = sortObject(params);
  Object.keys(sortedParams).forEach((key) => {
    console.log(`  ${key}: ${sortedParams[key]}`);
  });
  console.log('Query string:', qs.stringify(sortedParams, { encode: false }));
  console.log('='.repeat(40) + '\n');
}
