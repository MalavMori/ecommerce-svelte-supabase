const SYMBOL_MAP: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥'
};

export function formatCurrency(
  amount: number,
  currencyCode = 'INR',
  symbol?: string,
  decimalDigits?: number
): string {
  const code = (currencyCode || 'INR').toUpperCase();
  const digits = decimalDigits !== undefined ? decimalDigits : (code === 'JPY' ? 0 : 2);
  const sym = symbol || SYMBOL_MAP[code] || '₹';

  if (isNaN(amount) || amount == null) return `${sym}0.00`;

  const formattedNumber = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });

  return `${sym}${formattedNumber}`;
}

export function slugify(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
