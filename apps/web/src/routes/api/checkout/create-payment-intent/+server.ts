import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStripe, formatStripeAmount } from '$lib/server/stripe';
import { STRIPE_SECRET_KEY } from '$app/env/private';

export const POST: RequestHandler = async ({ request, locals, cookies, platform }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		return json({ error: 'You must be signed in to checkout' }, { status: 401 });
	}

	const stripeSecret = 
		(platform as any)?.env?.STRIPE_SECRET_KEY ||
		process.env.STRIPE_SECRET_KEY ||
		'';

	if (!stripeSecret) {
		return json(
			{ error: 'Stripe secret key is not configured. Please set STRIPE_SECRET_KEY in apps/web/.env' },
			{ status: 500 }
		);
	}

	try {
		const body = await request.json();
		let addressId = body.addressId;
		const couponCode = body.couponCode?.trim() || null;
		const isNewAddress = Boolean(body.isNewAddress);

		// Handle new address creation if requested
		if (isNewAddress && body.newAddress) {
			const { line1, line2, city, state, postalCode, country, label } = body.newAddress;
			if (!line1 || !city || !postalCode) {
				return json({ error: 'Please fill out all required address fields (Street, City, Postal Code)' }, { status: 400 });
			}

			const { data: newAddr, error: addrErr } = await locals.supabase
				.from('addresses')
				.insert({
					user_id: user.id,
					line1: line1.trim(),
					line2: line2?.trim() || null,
					city: city.trim(),
					state: state?.trim() || null,
					postal_code: postalCode.trim(),
					country: country?.trim() || 'US',
					label: label?.trim() || 'Shipping Address',
					is_default: false
				})
				.select('id')
				.single();

			if (addrErr || !newAddr) {
				return json({ error: addrErr?.message || 'Failed to save shipping address' }, { status: 500 });
			}

			addressId = newAddr.id;
		}

		if (!addressId) {
			return json({ error: 'Shipping address is required' }, { status: 400 });
		}

		// Single atomic RPC round-trip on edge: checks stock, applies coupon, creates pending order & order_items
		const selectedCurrency = cookies.get('selected_currency') || 'INR';
		const { data: rpcData, error: rpcErr } = await locals.supabase.rpc('create_pending_checkout_order', {
			p_user_id: user.id,
			p_address_id: addressId,
			p_coupon_code: couponCode,
			p_display_currency: selectedCurrency
		});

		if (rpcErr || !rpcData) {
			console.error('Error creating pending order via RPC:', rpcErr);
			return json({ error: rpcErr?.message || 'Failed to create order' }, { status: 400 });
		}

		const order = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;

		// Fetch base store currency
		const { data: storeSetting } = await locals.supabase
			.from('store_settings')
			.select('base_currency_code')
			.maybeSingle();

		const baseCurrency = (storeSetting?.base_currency_code || 'INR').toLowerCase();
		const amountSmallestUnit = formatStripeAmount(Number(order.total), baseCurrency);

		// Create real Stripe PaymentIntent (uses module-level singleton)
		const stripe = getStripe(stripeSecret);
		const paymentIntent = await stripe.paymentIntents.create({
			amount: amountSmallestUnit,
			currency: baseCurrency,
			metadata: {
				order_id: order.order_id,
				user_id: user.id
			},
			automatic_payment_methods: {
				enabled: true
			}
		});

		// Attach real stripe_payment_intent_id to order
		await locals.supabase
			.from('orders')
			.update({ stripe_payment_intent_id: paymentIntent.id })
			.eq('id', order.order_id);

		return json({
			clientSecret: paymentIntent.client_secret,
			orderId: order.order_id,
			total: order.total,
			currency: baseCurrency
		});
	} catch (err: any) {
		console.error('Create payment intent failed:', err);
		return json({ error: err?.message || 'Internal server error while initializing payment' }, { status: 500 });
	}
};
