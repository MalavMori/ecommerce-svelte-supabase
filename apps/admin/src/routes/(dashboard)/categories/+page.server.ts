import type { PageServerLoad } from './$types';

const ALLOWED_PER_PAGE = [10, 20, 50, 100];
const DEFAULT_PER_PAGE = 10;

export const load: PageServerLoad = async ({ locals, url }) => {
	const pageParam = parseInt(url.searchParams.get('page') ?? '1', 10);
	const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

	const perPageParam = parseInt(url.searchParams.get('perPage') ?? String(DEFAULT_PER_PAGE), 10);
	const perPage = ALLOWED_PER_PAGE.includes(perPageParam) ? perPageParam : DEFAULT_PER_PAGE;

	const search = url.searchParams.get('q') ?? '';

	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	let query = locals.supabase
		.from('categories')
		.select('*, parent:parent_id(name)', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(from, to);

	if (search) {
		query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
	}

	const { data: categories, error, count } = await query;

	if (error) {
		console.error('Error fetching categories:', error);
	}

	return {
		categories: categories ?? [],
		page,
		perPage,
		total: count ?? 0,
		search
	};
};
