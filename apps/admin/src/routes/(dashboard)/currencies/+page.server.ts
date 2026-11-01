import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { BaseCurrencyInfo } from '#lib';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: storeSetting }, { data: currencies }, { data: rates }] = await Promise.all([
		locals.supabase.from('store_settings').select('*').single(),
		locals.supabase.from('currencies').select('*').order('code'),
		locals.supabase.from('exchange_rates').select('*').order('currency_code')
	]);

	const allCurrencies = currencies ?? [];
	const baseCurrencyCode = storeSetting?.base_currency_code ?? 'INR';
	const foundBase = allCurrencies.find((c) => c.code === baseCurrencyCode);

	const baseCurrency: BaseCurrencyInfo = foundBase
		? {
				code: foundBase.code,
				name: foundBase.name,
				symbol: foundBase.symbol,
				decimal_digits: foundBase.decimal_digits,
				is_active: foundBase.is_active
			}
		: {
				code: baseCurrencyCode,
				name: baseCurrencyCode === 'INR' ? 'Indian Rupee' : baseCurrencyCode,
				symbol: baseCurrencyCode === 'INR' ? '₹' : '$',
				decimal_digits: baseCurrencyCode === 'JPY' ? 0 : 2,
				is_active: true
			};

	return {
		baseCurrency,
		currencies: allCurrencies,
		exchangeRates: rates ?? []
	};
};

export const actions: Actions = {
	updateBaseCurrency: async ({ request, locals }) => {
		const formData = await request.formData();
		const baseCurrencyCode = formData.get('baseCurrencyCode') as string;

		if (!baseCurrencyCode) return fail(400, { error: 'Currency code is required' });

		// Verify currency exists and is active
		const { data: curr, error: currErr } = await locals.supabase
			.from('currencies')
			.select('code, is_active')
			.eq('code', baseCurrencyCode)
			.single();

		if (currErr || !curr) {
			return fail(400, { error: 'Selected currency does not exist' });
		}

		// Ensure it is active
		if (!curr.is_active) {
			await locals.supabase
				.from('currencies')
				.update({ is_active: true })
				.eq('code', baseCurrencyCode);
		}

		// Update store settings (single row id = true)
		const { error: setErr } = await locals.supabase
			.from('store_settings')
			.update({ base_currency_code: baseCurrencyCode })
			.eq('id', true);

		if (setErr) return fail(500, { error: setErr.message });

		// Base currency rate to itself must always be 1.0
		await locals.supabase.from('exchange_rates').upsert({
			currency_code: baseCurrencyCode,
			rate_to_base: 1.0,
			updated_at: new Date().toISOString()
		});

		return { success: true };
	},

	toggleCurrency: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = formData.get('code') as string;
		const isActive = formData.get('isActive') === 'true';

		if (!code) return fail(400, { error: 'Currency code is required' });

		// Check if it is the base currency
		const { data: storeSetting } = await locals.supabase
			.from('store_settings')
			.select('base_currency_code')
			.single();

		if (storeSetting?.base_currency_code === code && !isActive) {
			return fail(400, { error: 'Cannot deactivate the store base charging currency.' });
		}

		const { error } = await locals.supabase
			.from('currencies')
			.update({ is_active: isActive })
			.eq('code', code);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	addCurrency: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = (formData.get('code') as string)?.trim().toUpperCase();
		const name = (formData.get('name') as string)?.trim();
		const symbol = (formData.get('symbol') as string)?.trim();
		const decimalDigits = parseInt((formData.get('decimal_digits') as string) || '2', 10);
		const rateToBase = parseFloat((formData.get('rate_to_base') as string) || '1.0');

		if (!code || code.length !== 3) {
			return fail(400, { error: 'Code must be a 3-letter ISO code (e.g. CAD, AUD)' });
		}
		if (!name) return fail(400, { error: 'Currency name is required' });
		if (!symbol) return fail(400, { error: 'Currency symbol is required' });
		if (isNaN(decimalDigits) || decimalDigits < 0 || decimalDigits > 4) {
			return fail(400, { error: 'Decimal digits must be between 0 and 4' });
		}
		if (isNaN(rateToBase) || rateToBase <= 0) {
			return fail(400, { error: 'Rate to base must be a positive number' });
		}

		const { error: insErr } = await locals.supabase.from('currencies').insert({
			code,
			name,
			symbol,
			decimal_digits: decimalDigits,
			is_active: true
		});

		if (insErr) {
			if (insErr.code === '23505') {
				return fail(400, { error: `Currency "${code}" already exists.` });
			}
			return fail(500, { error: insErr.message });
		}

		// Insert initial exchange rate
		await locals.supabase.from('exchange_rates').upsert({
			currency_code: code,
			rate_to_base: rateToBase,
			updated_at: new Date().toISOString()
		});

		return { success: true };
	},

	updateExchangeRate: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = formData.get('code') as string;
		const rateStr = formData.get('rate_to_base') as string;

		if (!code) return fail(400, { error: 'Currency code is required' });

		const rate = parseFloat(rateStr);
		if (isNaN(rate) || rate <= 0) {
			return fail(400, { error: 'Exchange rate must be a valid positive number' });
		}

		const { error } = await locals.supabase.from('exchange_rates').upsert({
			currency_code: code,
			rate_to_base: rate,
			updated_at: new Date().toISOString()
		});

		if (error) return fail(500, { error: error.message });
		return { success: true };
	}
};
