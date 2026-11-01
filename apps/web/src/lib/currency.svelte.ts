import { formatCurrency } from '@repo/utils';

export interface CurrencyItem {
	code: string;
	name: string;
	symbol: string;
	decimal_digits: number;
	is_active: boolean | null;
}

const SYMBOL_MAP: Record<string, string> = {
	INR: '₹',
	USD: '$',
	EUR: '€',
	GBP: '£',
	JPY: '¥'
};

class CurrencyState {
	currentCurrency = $state('INR');
	baseCurrency = $state('INR');
	currencies = $state<CurrencyItem[]>([]);
	rates = $state<Record<string, number>>({});
	initialized = $state(false);

	init(data: {
		baseCurrency?: string;
		currencies?: CurrencyItem[];
		selectedCurrency?: string;
		exchangeRates?: { currency_code: string; rate_to_base: number | string }[];
	}) {
		if (data.baseCurrency) this.baseCurrency = data.baseCurrency;
		if (data.currencies && data.currencies.length > 0) this.currencies = data.currencies;
		if (data.selectedCurrency) this.currentCurrency = data.selectedCurrency;

		if (data.exchangeRates) {
			const map: Record<string, number> = {};
			for (const r of data.exchangeRates) {
				map[r.currency_code] = Number(r.rate_to_base);
			}
			this.rates = map;
		}

		this.initialized = true;
	}

	setCurrency(code: string) {
		const target = this.currencies.find((c) => c.code === code);
		if (!target) return;
		this.currentCurrency = code;
		if (typeof document !== 'undefined') {
			document.cookie = `selected_currency=${code}; path=/; max-age=31536000; SameSite=Lax`;
		}
		if (typeof window !== 'undefined') {
			import('$app/navigation').then(({ invalidateAll }) => {
				invalidateAll();
			}).catch(() => {});
		}
	}

	getActiveCurrency(): CurrencyItem {
		const found = this.currencies.find((c) => c.code === this.currentCurrency);
		if (found) return found;
		return {
			code: this.currentCurrency,
			name: this.currentCurrency,
			symbol: SYMBOL_MAP[this.currentCurrency] || (this.currentCurrency === 'INR' ? '₹' : '$'),
			decimal_digits: this.currentCurrency === 'JPY' ? 0 : 2,
			is_active: true
		};
	}

	convert(amountInBase: number | string | null | undefined): {
		amount: number;
		formatted: string;
		code: string;
		symbol: string;
		decimalDigits: number;
	} {
		const val = Number(amountInBase ?? 0);
		const rate = this.rates[this.currentCurrency] ?? 1.0;
		const curr = this.getActiveCurrency();
		const converted = val * rate;
		const formatted = formatCurrency(converted, curr.code, curr.symbol, curr.decimal_digits);
		return {
			amount: converted,
			formatted,
			code: curr.code,
			symbol: curr.symbol,
			decimalDigits: curr.decimal_digits
		};
	}

	format(amountInBase: number | string | null | undefined): string {
		return this.convert(amountInBase).formatted;
	}

	formatAmount(amount: number | string | null | undefined, currencyCode?: string | null): string {
		const code = (currencyCode || this.currentCurrency).toUpperCase();
		const found = this.currencies.find((c) => c.code === code);
		const sym = found?.symbol || SYMBOL_MAP[code] || (code === 'INR' ? '₹' : '$');
		const digits = found?.decimal_digits ?? (code === 'JPY' ? 0 : 2);
		return formatCurrency(Number(amount ?? 0), code, sym, digits);
	}

	formatForCurrency(
		amountInBase: number | string | null | undefined,
		currencyCode?: string | null,
		customRate?: number | null
	): string {
		const code = (currencyCode || this.currentCurrency).toUpperCase();
		const rate = customRate !== undefined && customRate !== null ? customRate : (this.rates[code] ?? 1.0);
		const found = this.currencies.find((c) => c.code === code);
		const sym = found?.symbol || SYMBOL_MAP[code] || (code === 'INR' ? '₹' : '$');
		const digits = found?.decimal_digits ?? (code === 'JPY' ? 0 : 2);
		const converted = Number(amountInBase ?? 0) * rate;
		return formatCurrency(converted, code, sym, digits);
	}
}

export const currencyState = new CurrencyState();
