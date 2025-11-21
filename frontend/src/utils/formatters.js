/**
 * Format number as Vietnamese currency (VND)
 * @param {number} value - The value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format date to Vietnamese locale
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date to short format (DD/MM/YYYY)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateShort = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Format number with thousand separators
 * @param {number} value - The value to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  if (!value && value !== 0) return '0';
  return new Intl.NumberFormat('vi-VN').format(value);
};

/**
 * Format percentage
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercent = (value, decimals = 2) => {
  if (!value && value !== 0) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Format time (HH:mm)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
