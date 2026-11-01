import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data: category, error: catError } = await locals.supabase
		.from('categories')
		.select('*')
		.eq('id', params.id)
		.single();

	if (catError || !category) {
		error(404, 'Category not found');
	}

	// Fetch other categories for parent selection (exclude current category to avoid circular reference)
	const { data: categories } = await locals.supabase
		.from('categories')
		.select('id, name')
		.neq('id', params.id)
		.order('name');

	return {
		category,
		categories: categories ?? []
	};
};
