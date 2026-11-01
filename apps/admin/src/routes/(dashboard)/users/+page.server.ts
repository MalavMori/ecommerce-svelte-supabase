import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const ALLOWED_PER_PAGE = [10, 20, 50, 100];
const DEFAULT_PER_PAGE = 10;

export const load: PageServerLoad = async ({ locals, url }) => {
	const pageParam = parseInt(url.searchParams.get('page') ?? '1', 10);
	const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

	const perPageParam = parseInt(url.searchParams.get('perPage') ?? String(DEFAULT_PER_PAGE), 10);
	const perPage = ALLOWED_PER_PAGE.includes(perPageParam) ? perPageParam : DEFAULT_PER_PAGE;

	const search = url.searchParams.get('q') ?? '';
	const roleFilter = url.searchParams.get('role') ?? 'all';

	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	let query = locals.supabase
		.from('profiles')
		.select(
			`
			*,
			orders ( id )
		`,
			{ count: 'exact' }
		)
		.order('created_at', { ascending: false })
		.range(from, to);

	if (roleFilter && roleFilter !== 'all') {
		query = query.eq('role', roleFilter);
	}

	if (search) {
		query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
	}

	const { data: users, error, count } = await query;

	if (error) {
		console.error('Error fetching users:', error);
	}

	// Map order counts
	const mappedUsers = (users ?? []).map((u: any) => ({
		...u,
		ordersCount: Array.isArray(u.orders) ? u.orders.length : 0
	}));

	return {
		users: mappedUsers,
		page,
		perPage,
		total: count ?? 0,
		search,
		roleFilter
	};
};

export const actions: Actions = {
	updateRole: async ({ request, locals }) => {
		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();
		const role = formData.get('role')?.toString();

		if (!userId || !role) {
			return fail(400, { message: 'User ID and role are required.' });
		}

		if (!['customer', 'admin'].includes(role)) {
			return fail(400, { message: 'Invalid role. Must be customer or admin.' });
		}

		// Prevent self-demotion
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (user?.id === userId && role !== 'admin') {
			return fail(400, { message: 'You cannot remove admin privileges from your own account.' });
		}

		const { error } = await locals.supabase.from('profiles').update({ role }).eq('id', userId);

		if (error) {
			return fail(500, { message: error.message });
		}

		return { success: true, message: `User role successfully updated to ${role}.` };
	}
};
