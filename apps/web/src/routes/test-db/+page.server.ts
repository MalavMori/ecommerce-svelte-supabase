import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: categories, error: dbError } = await locals.supabase
		.from('categories')
		.select('*')
		.limit(5);

	if (dbError) {
		throw error(500, `Database error: ${dbError.message}`);
	}

	return { categories: categories ?? [] };
};
