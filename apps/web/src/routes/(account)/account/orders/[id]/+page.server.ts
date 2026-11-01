import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) throw error(401, 'Unauthorized');

	const orderId = params.id;

	const { data: order, error: orderErr } = await locals.supabase
		.from('orders')
		.select(
			`
			*,
			addresses (*),
			coupons (code, discount_type, discount_value),
			order_items (*),
			order_status_history (*),
			shipments (*),
			returns (*)
		`
		)
		.eq('id', orderId)
		.eq('user_id', user.id)
		.single();

	if (orderErr || !order) {
		throw error(404, 'Order not found');
	}

	// Sort status history chronologically
	const statusHistory = [...(order.order_status_history || [])].sort(
		(a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
	);

	// Sort shipments newest first
	const shipments = [...(order.shipments || [])].sort(
		(a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
	);

	// Active return or latest return
	const returnRequests = order.returns || [];
	const activeReturn = returnRequests.find((r: any) =>
		['requested', 'approved'].includes(r.status)
	) || returnRequests[0] || null;

	return {
		order: {
			...order,
			statusHistory,
			shipments,
			returnRequest: activeReturn
		}
	};
};

export const actions: Actions = {
	requestReturn: async ({ request, params, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Unauthorized' });

		const orderId = params.id;
		const formData = await request.formData();
		const reason = formData.get('reason')?.toString().trim();

		if (!reason || reason.length < 5) {
			return fail(400, { message: 'Please provide a detailed reason for the return (min 5 characters).' });
		}

		// Verify order belongs to user and is delivered
		const { data: order, error: orderErr } = await locals.supabase
			.from('orders')
			.select('id, status, total')
			.eq('id', orderId)
			.eq('user_id', user.id)
			.single();

		if (orderErr || !order) {
			return fail(404, { message: 'Order not found.' });
		}

		if (order.status !== 'delivered') {
			return fail(400, { message: 'Returns can only be requested after the order has been delivered.' });
		}

		// Check for active return
		const { data: existingReturn } = await locals.supabase
			.from('returns')
			.select('id, status')
			.eq('order_id', orderId)
			.in('status', ['requested', 'approved'])
			.maybeSingle();

		if (existingReturn) {
			return fail(400, { message: 'There is already an active return request for this order.' });
		}

		// Insert return request
		const { error: insertErr } = await locals.supabase.from('returns').insert({
			order_id: orderId,
			user_id: user.id,
			reason,
			status: 'requested',
			refund_amount: order.total
		});

		if (insertErr) {
			console.error('Error submitting return:', insertErr);
			return fail(500, { message: insertErr.message || 'Failed to submit return request.' });
		}

		return { success: true, message: 'Return request submitted successfully.' };
	}
};
