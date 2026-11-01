import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: categories } = await locals.supabase
		.from('categories')
		.select('id, name')
		.order('name');

	return {
		categories: categories ?? []
	};
};
