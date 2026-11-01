import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data: order, error: orderError } = await locals.supabase
		.from('orders')
		.select(
			`
			*,
			profiles (
				full_name,
				phone
			),
			addresses (
				line1,
				line2,
				city,
				state,
				postal_code,
				country
			),
			coupons (
				code,
				discount_type,
				discount_value
			),
			order_status_history (*),
			shipments (*),
			returns (*)
		`
		)
		.eq('id', params.id)
		.single();

	if (orderError || !order) {
		throw error(404, 'Order not found');
	}

	const { data: items } = await locals.supabase
		.from('order_items')
		.select('*')
		.eq('order_id', params.id);

	// Sort history chronologically
	const statusHistory = [...(order.order_status_history || [])].sort(
		(a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
	);

	// Sort shipments newest first
	const shipments = [...(order.shipments || [])].sort(
		(a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
	);

	return {
		order: {
			...order,
			statusHistory,
			shipments,
			returns: order.returns || []
		},
		items: items ?? []
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const status = formData.get('status')?.toString();

		if (!status) {
			return fail(400, { message: 'Status is required' });
		}

		// Updating orders.status triggers trg_log_order_status automatically!
		const { error: updateError } = await locals.supabase
			.from('orders')
			.update({ status })
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { message: updateError.message });
		}

		return { success: true, message: `Order status updated to ${status}` };
	},

	addShipment: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const carrier = formData.get('carrier')?.toString().trim();
		const tracking_number = formData.get('tracking_number')?.toString().trim();
		const status = formData.get('status')?.toString() || 'shipped';
		const estimated_delivery = formData.get('estimated_delivery')?.toString() || null;

		if (!carrier || !tracking_number) {
			return fail(400, { message: 'Carrier and tracking number are required.' });
		}

		// estimated_delivery is of PostgreSQL date type (YYYY-MM-DD)
		const formattedDate = estimated_delivery
			? new Date(estimated_delivery).toISOString().split('T')[0]
			: null;

		const { error: insertError } = await locals.supabase.from('shipments').insert({
			order_id: params.id,
			carrier,
			tracking_number,
			status,
			estimated_delivery: formattedDate,
			shipped_at: new Date().toISOString()
		});

		if (insertError) {
			return fail(500, { message: insertError.message });
		}

		return { success: true, message: 'Shipment added successfully.' };
	},

	updateShipmentStatus: async ({ request, locals }) => {
		const formData = await request.formData();
		const shipmentId = formData.get('shipmentId')?.toString();
		const status = formData.get('status')?.toString();

		if (!shipmentId || !status) {
			return fail(400, { message: 'Shipment ID and status are required.' });
		}

		const updateData: { status: string; delivered_at?: string | null } = { status };
		if (status === 'delivered') {
			updateData.delivered_at = new Date().toISOString();
		}

		const { error: updateErr } = await locals.supabase
			.from('shipments')
			.update(updateData)
			.eq('id', shipmentId);

		if (updateErr) {
			return fail(500, { message: updateErr.message });
		}

		return { success: true, message: `Shipment marked as ${status}.` };
	},

	deleteShipment: async ({ request, locals }) => {
		const formData = await request.formData();
		const shipmentId = formData.get('shipmentId')?.toString();
		if (!shipmentId) return fail(400, { message: 'Shipment ID required.' });

		const { error: delErr } = await locals.supabase.from('shipments').delete().eq('id', shipmentId);

		if (delErr) return fail(500, { message: delErr.message });
		return { success: true, message: 'Shipment record deleted.' };
	},

	updateReturnStatus: async ({ request, locals }) => {
		const formData = await request.formData();
		const returnId = formData.get('returnId')?.toString();
		const status = formData.get('status')?.toString();

		if (!returnId || !status) {
			return fail(400, { message: 'Return ID and status required.' });
		}

		const updatePayload: { status: string; resolved_at?: string | null } = { status };
		if (['approved', 'rejected', 'refunded'].includes(status)) {
			updatePayload.resolved_at = new Date().toISOString();
		}

		const { error: updateErr } = await locals.supabase
			.from('returns')
			.update(updatePayload)
			.eq('id', returnId);

		if (updateErr) {
			return fail(500, { message: updateErr.message });
		}

		return { success: true, message: `Return status updated to ${status}.` };
	}
};
