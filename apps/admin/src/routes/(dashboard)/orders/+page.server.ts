import type { PageServerLoad } from './$types';

const ALLOWED_PER_PAGE = [10, 20, 50, 100];
const DEFAULT_PER_PAGE = 10;

export const load: PageServerLoad = async ({ locals, url }) => {
	const pageParam = parseInt(url.searchParams.get('page') ?? '1', 10);
	const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

	const perPageParam = parseInt(url.searchParams.get('perPage') ?? String(DEFAULT_PER_PAGE), 10);
	const perPage = ALLOWED_PER_PAGE.includes(perPageParam) ? perPageParam : DEFAULT_PER_PAGE;

	const search = url.searchParams.get('q') ?? '';
	const statusFilter = url.searchParams.get('status') ?? 'all';

	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	let query = locals.supabase
		.from('orders')
		.select(
			`
			*,
			profiles (
				full_name,
				phone
			),
			returns (
				id,
				status
			),
			shipments (
				id,
				status
			)
		`,
			{ count: 'exact' }
		)
		.order('created_at', { ascending: false })
		.range(from, to);

	if (statusFilter && statusFilter !== 'all') {
		query = query.eq('status', statusFilter);
	}

	if (search) {
		const trimmed = search.trim();
		const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
		if (isUuid) {
			query = query.eq('id', trimmed);
		} else {
			query = query.or(`status.ilike.%${trimmed}%,payment_status.ilike.%${trimmed}%`);
		}
	}

	const { data: orders, error, count } = await query;

	if (error) {
		console.error('Error fetching orders:', error);
	}

	return {
		orders: orders ?? [],
		page,
		perPage,
		total: count ?? 0,
		search,
		statusFilter
	};
};
