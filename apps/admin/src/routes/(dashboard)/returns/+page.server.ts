import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const ALLOWED_PER_PAGE = [10, 20, 50];
const DEFAULT_PER_PAGE = 10;

export const load: PageServerLoad = async ({ locals, url }) => {
	const pageParam = parseInt(url.searchParams.get('page') ?? '1', 10);
	const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

	const perPageParam = parseInt(url.searchParams.get('perPage') ?? String(DEFAULT_PER_PAGE), 10);
	const perPage = ALLOWED_PER_PAGE.includes(perPageParam) ? perPageParam : DEFAULT_PER_PAGE;

	const statusFilter = url.searchParams.get('status') ?? 'all';
	const search = url.searchParams.get('q') ?? '';

	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	let query = locals.supabase
		.from('returns')
		.select(
			`
			*,
			orders (
				id,
				total,
				status,
				created_at
			),
			profiles (
				id,
				full_name,
				phone
			)
		`,
			{ count: 'exact' }
		)
		.order('requested_at', { ascending: false })
		.range(from, to);

	if (statusFilter && statusFilter !== 'all') {
		query = query.eq('status', statusFilter);
	}

	if (search) {
		query = query.ilike('reason', `%${search}%`);
	}

	const { data: returns, error, count } = await query;

	if (error) {
		console.error('Error fetching returns:', error);
	}

	// Calculate counts for quick status filter pills
	const { data: allStatuses } = await locals.supabase.from('returns').select('status');
	const counts = {
		all: allStatuses?.length ?? 0,
		requested: allStatuses?.filter((r) => r.status === 'requested').length ?? 0,
		approved: allStatuses?.filter((r) => r.status === 'approved').length ?? 0,
		rejected: allStatuses?.filter((r) => r.status === 'rejected').length ?? 0,
		refunded: allStatuses?.filter((r) => r.status === 'refunded').length ?? 0
	};

	return {
		returns: returns ?? [],
		page,
		perPage,
		total: count ?? 0,
		statusFilter,
		search,
		counts
	};
};

import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$app/env/private';

export const actions: Actions = {
	updateStatus: async ({ request, locals, platform }) => {
		const formData = await request.formData();
		const returnId = formData.get('returnId')?.toString();
		const status = formData.get('status')?.toString();

		if (!returnId || !status) {
			return fail(400, { message: 'Return ID and status are required.' });
		}

		const updatePayload: { status: string; resolved_at?: string | null; stripe_refund_id?: string | null } = { status };
		if (['approved', 'rejected', 'refunded'].includes(status)) {
			updatePayload.resolved_at = new Date().toISOString();
		}

		// When refunding, trigger Stripe refund if order was paid via Stripe
		if (status === 'refunded') {
			const { data: retData } = await locals.supabase
				.from('returns')
				.select('*, orders (id, stripe_payment_intent_id)')
				.eq('id', returnId)
				.maybeSingle();

			if (retData) {
				const orderPaymentIntent = (retData.orders as any)?.stripe_payment_intent_id;
				if (orderPaymentIntent && !retData.stripe_refund_id) {
					const stripeKey =
						STRIPE_SECRET_KEY ||
						(platform as any)?.env?.STRIPE_SECRET_KEY ||
						process.env.STRIPE_SECRET_KEY ||
						'';
					if (stripeKey && stripeKey !== 'sk_test_placeholder' && !orderPaymentIntent.startsWith('pi_mock_')) {
						try {
							const stripe = new Stripe(stripeKey, {
								apiVersion: '2024-12-18.acacia' as any,
								httpClient: Stripe.createFetchHttpClient()
							});
							const refund = await stripe.refunds.create({
								payment_intent: orderPaymentIntent,
								amount: retData.refund_amount ? Math.round(Number(retData.refund_amount) * 100) : undefined
							});
							updatePayload.stripe_refund_id = refund.id;
						} catch (e: any) {
							console.error('Stripe refund creation error:', e);
						}
					} else if (orderPaymentIntent.startsWith('pi_mock_')) {
						updatePayload.stripe_refund_id = `re_mock_${returnId.slice(0, 8)}`;
					}
				}
			}
		}

		const { error: updateErr } = await locals.supabase
			.from('returns')
			.update(updatePayload)
			.eq('id', returnId);

		if (updateErr) {
			return fail(500, { message: updateErr.message });
		}

		return { success: true, message: `Return request marked as ${status}.` };
	}
};
