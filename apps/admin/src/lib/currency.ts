import { formatCurrency as baseFormatCurrency } from '@repo/utils';
import type { Currency } from '@repo/types';

export interface BaseCurrencyInfo {
	code: string;
	name: string;
	symbol: string;
	decimal_digits: number;
	is_active?: boolean | null;
}

const DEFAULT_BASE_CURRENCY: BaseCurrencyInfo = {
	code: 'INR',
	name: 'Indian Rupee',
	symbol: '₹',
	decimal_digits: 2
};

/**
 * Format an amount using the store's configured base currency.
 */
export function formatBasePrice(
	amount: number | string | null | undefined,
	baseCurrency?: Partial<BaseCurrencyInfo> | null
): string {
	const val = Number(amount ?? 0);
	const code = baseCurrency?.code ?? DEFAULT_BASE_CURRENCY.code;
	const symbol = baseCurrency?.symbol ?? (code === 'INR' ? '₹' : '$');
	const digits = baseCurrency?.decimal_digits ?? (code === 'JPY' ? 0 : 2);
	return baseFormatCurrency(val, code, symbol, digits);
}

/**
 * Format an amount using a specific currency code (e.g., customer display currency on orders).
 */
export function formatOrderCurrency(
	amount: number | string | null | undefined,
	currencyCode: string | null | undefined,
	currencies?: Currency[] | null
): string {
	const val = Number(amount ?? 0);
	const code = (currencyCode || DEFAULT_BASE_CURRENCY.code).toUpperCase();
	const found = currencies?.find((c) => c.code === code);
	const symbol = found?.symbol;
	const digits = found?.decimal_digits ?? (code === 'JPY' ? 0 : 2);
	return baseFormatCurrency(val, code, symbol, digits);
}

/**
 * Get currency symbol with fallback.
 */
export function getCurrencySymbol(
	currencyCode?: string | null,
	currencies?: Currency[] | null
): string {
	if (!currencyCode) return '₹';
	const found = currencies?.find((c) => c.code.toUpperCase() === currencyCode.toUpperCase());
	if (found?.symbol) return found.symbol;
	if (currencyCode === 'INR') return '₹';
	if (currencyCode === 'USD') return '$';
	if (currencyCode === 'EUR') return '€';
	if (currencyCode === 'GBP') return '£';
	if (currencyCode === 'JPY') return '¥';
	return currencyCode;
}
