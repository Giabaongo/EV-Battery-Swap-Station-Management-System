export const normalizeEmail = async (email: string): Promise<string> => {
  return email.toLowerCase().trim();
}

export const normalizePhone = async (phone: string): Promise<string> => {
  let normalized = phone.replace(/\D/g, '');

  if (normalized.startsWith('84')) {
    normalized = '0' + normalized.slice(2);
  }

  return normalized;
}
