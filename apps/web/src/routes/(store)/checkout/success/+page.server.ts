import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createSupabaseServiceClient } from '@repo/supabase-client/server';
import { PUBLIC_SUPABASE_URL } from '$app/env/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$app/env/private';
import { getStripe } from '$lib/server/stripe';

export const load: PageServerLoad = async ({ url, locals, platform }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		redirect(303, '/login');
	}

	const orderId = url.searchParams.get('order');
	if (!orderId) {
		redirect(303, '/');
	}

	const { data: order, error: orderErr } = await locals.supabase
		.from('orders')
		.select(
			`
			*,
			addresses (*),
			coupons (code, discount_type, discount_value),
			order_items (*)
		`
		)
		.eq('id', orderId)
		.eq('user_id', user.id)
		.single();

	if (orderErr || !order) {
		throw error(404, 'Order not found');
	}

	// Immediate client reconciliation:
	// If the order is still 'unpaid', check if Stripe has confirmed payment.
	// Either via redirect_status=succeeded OR by verifying directly against the Stripe PaymentIntent.
	const redirectStatus = url.searchParams.get('redirect_status');
	const paymentIntentId = url.searchParams.get('payment_intent') || order.stripe_payment_intent_id;

	if (order.payment_status !== 'paid' && (redirectStatus === 'succeeded' || paymentIntentId)) {
		let isPaid = redirectStatus === 'succeeded';

		// Verify with Stripe API directly if paymentIntentId is available
		if (paymentIntentId) {
			try {
				const stripeSecret = 
					(platform as any)?.env?.STRIPE_SECRET_KEY ||
					process.env.STRIPE_SECRET_KEY ||
					'';
				const stripe = getStripe(stripeSecret);
				const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
				isPaid = pi.status === 'succeeded';
			} catch (err: any) {
				console.warn('[Checkout Success] Could not verify PaymentIntent with Stripe API:', err?.message);
			}
		}

		if (isPaid) {
			const serviceRoleKey =
				SUPABASE_SERVICE_ROLE_KEY ||
				(platform as any)?.env?.SUPABASE_SERVICE_ROLE_KEY ||
				process.env.SUPABASE_SERVICE_ROLE_KEY ||
				'';

			// Use admin client if service role key exists; otherwise fallback to locals.supabase
			// (fulfill_paid_order is SECURITY DEFINER and authenticated user is granted execute)
			const client = serviceRoleKey
				? createSupabaseServiceClient(PUBLIC_SUPABASE_URL, serviceRoleKey)
				: locals.supabase;

			const { error: rpcErr } = await client.rpc('fulfill_paid_order', {
				p_order_id: order.id,
				p_payment_intent_id: paymentIntentId || order.stripe_payment_intent_id || '',
				p_customer_id: undefined
			});

			if (rpcErr) {
				console.error('[Checkout Success] Client reconciliation RPC failed:', rpcErr.message);
			} else {
				order.payment_status = 'paid';
				order.status = 'paid';
			}
		}
	}

	const paymentMethod = url.searchParams.get('method') || 'card';
	let paymentDetails: Record<string, any> = {};
	const detailsRaw = url.searchParams.get('details');
	if (detailsRaw) {
		try {
			paymentDetails = JSON.parse(detailsRaw);
		} catch {
			paymentDetails = { note: detailsRaw };
		}
	}

	return {
		order,
		paymentMethod,
		paymentDetails
	};
};
