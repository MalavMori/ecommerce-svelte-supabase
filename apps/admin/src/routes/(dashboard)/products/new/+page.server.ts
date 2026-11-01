import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: categories, error } = await locals.supabase
		.from('categories')
		.select('id, name')
		.order('name');

	if (error) {
		console.error('Error fetching categories for product form:', error);
	}

	return {
		categories: categories ?? []
	};
};
