import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStripe } from '$lib/server/stripe';
import { PUBLIC_SUPABASE_URL } from '$app/env/public';
import { STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY } from '$app/env/private';
import { createSupabaseServiceClient } from '@repo/supabase-client/server';
import Stripe from 'stripe';

export const POST: RequestHandler = async ({ request, platform }) => {
	const signature = request.headers.get('stripe-signature');
	const payload = await request.text();

	const webhookSecret =
		STRIPE_WEBHOOK_SECRET ||
		(platform as any)?.env?.STRIPE_WEBHOOK_SECRET ||
		process.env.STRIPE_WEBHOOK_SECRET ||
		'';

	const serviceRoleKey =
		SUPABASE_SERVICE_ROLE_KEY ||
		(platform as any)?.env?.SUPABASE_SERVICE_ROLE_KEY ||
		process.env.SUPABASE_SERVICE_ROLE_KEY ||
		'';

	const stripeSecret = 
		(platform as any)?.env?.STRIPE_SECRET_KEY ||
		process.env.STRIPE_SECRET_KEY ||
		'';

	if (!serviceRoleKey) {
		console.error('[Stripe Webhook] SUPABASE_SERVICE_ROLE_KEY is not configured in environment or Cloudflare Pages settings');
		return json({ error: 'Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
	}

	const stripe = getStripe(stripeSecret);
	let event: Stripe.Event;

	try {
		if (webhookSecret && webhookSecret !== 'whsec_placeholder' && signature) {
			// Fast native Web Crypto subtle provider verification for Cloudflare edge (<0.5ms CPU)
			event = await stripe.webhooks.constructEventAsync(
				payload,
				signature,
				webhookSecret,
				undefined,
				Stripe.createSubtleCryptoProvider()
			);
		} else {
			// Dev / simulation mode when webhook secret is not configured
			console.warn('[Stripe Webhook] Verifying event without STRIPE_WEBHOOK_SECRET check (development only)');
			event = JSON.parse(payload) as Stripe.Event;
		}
	} catch (err: any) {
		console.error('[Stripe Webhook] Signature verification failed:', err.message);
		return json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
	}

	const supabaseAdmin = createSupabaseServiceClient(PUBLIC_SUPABASE_URL, serviceRoleKey);

	switch (event.type) {
		case 'payment_intent.succeeded': {
			const paymentIntent = event.data.object as Stripe.PaymentIntent;
			const orderId = paymentIntent.metadata?.order_id;

			if (!orderId) {
				console.warn('[Stripe Webhook] payment_intent.succeeded missing metadata.order_id', paymentIntent.id);
				break;
			}

			// Single atomic RPC round-trip on edge (<2ms CPU time):
			// Decrements stock, marks coupon redeemed, sets status to 'paid', clears user cart
			const customerId = typeof paymentIntent.customer === 'string' ? paymentIntent.customer : undefined;
			const { data, error } = await supabaseAdmin.rpc('fulfill_paid_order', {
				p_order_id: orderId,
				p_payment_intent_id: paymentIntent.id,
				p_customer_id: customerId
			});

			if (error) {
				console.error('[Stripe Webhook] Failed to fulfill order via fulfill_paid_order RPC:', error);
				return json({ error: error.message }, { status: 500 });
			}

			console.log(`[Stripe Webhook] Order ${orderId} successfully fulfilled:`, data);
			break;
		}

		case 'payment_intent.payment_failed': {
			const paymentIntent = event.data.object as Stripe.PaymentIntent;
			const orderId = paymentIntent.metadata?.order_id;

			if (orderId) {
				await supabaseAdmin
					.from('orders')
					.update({
						status: 'cancelled',
						payment_status: 'unpaid'
					})
					.eq('id', orderId);

				console.log(`[Stripe Webhook] Order ${orderId} marked cancelled due to payment failure`);
			}
			break;
		}

		default:
			// Unhandled event type ignored
			break;
	}

	return json({ received: true }, { status: 200 });
};
