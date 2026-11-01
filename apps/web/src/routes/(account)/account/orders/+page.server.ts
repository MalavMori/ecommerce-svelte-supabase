import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return { orders: [] };

	const { data: orders, error } = await locals.supabase
		.from('orders')
		.select(
			`
			id,
			created_at,
			status,
			payment_status,
			subtotal,
			discount_amount,
			shipping_amount,
			total,
			display_currency_code,
			display_total,
			order_items (id, product_name, quantity, unit_price, line_total),
			returns (id, status),
			shipments (id, tracking_number, carrier, status)
		`
		)
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching orders:', error);
	}

	return {
		orders: orders ?? []
	};
};
