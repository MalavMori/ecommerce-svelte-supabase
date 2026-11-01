import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const [
		{ session },
		{ data: storeSetting },
		{ data: currencies },
		{ data: rates }
	] = await Promise.all([
		locals.safeGetSession(),
		locals.supabase.from('store_settings').select('*').single(),
		locals.supabase.from('currencies').select('*').eq('is_active', true).order('code'),
		locals.supabase.from('exchange_rates').select('*')
	]);

	const baseCurrency = storeSetting?.base_currency_code ?? 'INR';
	const cookieCurrency = cookies.get('selected_currency');
	const activeCurrencies = currencies ?? [];

	// Validate selected currency is active, otherwise fallback to base
	const isValid = activeCurrencies.some(c => c.code === cookieCurrency);
	const selectedCurrency = isValid && cookieCurrency ? cookieCurrency : baseCurrency;

	return {
		session,
		baseCurrency,
		currencies: activeCurrencies,
		exchangeRates: rates ?? [],
		selectedCurrency
	};
};
