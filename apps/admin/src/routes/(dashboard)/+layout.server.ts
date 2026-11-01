import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { BaseCurrencyInfo } from '#lib';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!user) {
		redirect(303, '/login');
	}

	const [
		{ data: profile },
		{ data: storeSetting },
		{ data: currencies },
		{ data: rates }
	] = await Promise.all([
		locals.supabase
			.from('profiles')
			.select('id, full_name, role, avatar_url')
			.eq('id', user.id)
			.single(),
		locals.supabase.from('store_settings').select('*').single(),
		locals.supabase.from('currencies').select('*').order('code'),
		locals.supabase.from('exchange_rates').select('*').order('currency_code')
	]);

	if (!profile || profile.role !== 'admin') {
		await locals.supabase.auth.signOut();
		redirect(303, '/login?unauthorized=1');
	}

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
		session,
		user,
		profile,
		baseCurrency,
		currencies: allCurrencies,
		exchangeRates: rates ?? []
	};
};
