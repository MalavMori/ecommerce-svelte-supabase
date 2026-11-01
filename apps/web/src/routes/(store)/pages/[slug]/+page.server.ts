import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const slug = params.slug;

	const { data: page, error: pageErr } = await locals.supabase
		.from('pages')
		.select('*')
		.eq('slug', slug)
		.eq('is_published', true)
		.maybeSingle();

	if (pageErr || !page) {
		throw error(404, `Page "${slug}" not found or is unpublished`);
	}

	return {
		page
	};
};
