const SUSPICIOUS_PATTERNS = [
  /['";`]/,
  /--/,
  /\/\*/,
  /\*\//,
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /OR\s+1=1/i,
  /OR\s+.*=/i,
];

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b)/i,
  /(--|#|\/\*|\*\/)/,
  /(\bUNION\b|\bOR\b.*=.*|\bAND\b.*=.*)/i,
  /(execute|exec|sp_executesql)/i,
  /(0x[0-9a-fA-F]+)/,
];

export const hasSuspiciousInput = (value) => {
  if (typeof value !== 'string') return false;
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(value));
};

export const hasSqlInjection = (value) => {
  if (typeof value !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
};

export const validateFormSecurity = (formData, prefix = '') => {
  for (const key in formData) {
    const field = prefix ? `${prefix}.${key}` : key;
    const value = formData[key];

    if (typeof value === 'string') {
      if (hasSuspiciousInput(value)) {
        return {
          isValid: false,
          field,
          code: 'SUSPICIOUS_INPUT',
          message: `Karakter tidak diizinkan pada field ${field}`,
        };
      }
      if (hasSqlInjection(value)) {
        return {
          isValid: false,
          field,
          code: 'INVALID_INPUT',
          message: 'Input tidak valid atau mengandung karakter terlarang',
        };
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedResult = validateFormSecurity(value, field);
      if (!nestedResult.isValid) return nestedResult;
    }
  }
  return { isValid: true };
};
