import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: pages, error } = await locals.supabase.from('pages').select('*').order('slug');

	if (error) {
		console.error('Error fetching pages:', error);
	}

	return {
		pages: pages ?? []
	};
};

export const actions: Actions = {
	savePage: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const slug = formData.get('slug')?.toString().trim().toLowerCase();
		const title = formData.get('title')?.toString().trim();
		const content = formData.get('content')?.toString() || '';
		const meta_title = formData.get('meta_title')?.toString().trim() || null;
		const meta_description = formData.get('meta_description')?.toString().trim() || null;
		const is_published =
			formData.get('is_published') === 'true' || formData.get('is_published') === 'on';

		if (!slug || !title) {
			return fail(400, { message: 'Slug and title are required.' });
		}

		if (id) {
			// Update
			const { error } = await locals.supabase
				.from('pages')
				.update({
					slug,
					title,
					content,
					meta_title,
					meta_description,
					is_published,
					updated_at: new Date().toISOString()
				})
				.eq('id', id);

			if (error) return fail(500, { message: error.message });
			return { success: true, message: `Page "${title}" updated successfully.` };
		} else {
			// Create
			const { error } = await locals.supabase.from('pages').insert({
				slug,
				title,
				content,
				meta_title,
				meta_description,
				is_published
			});

			if (error) return fail(500, { message: error.message });
			return { success: true, message: `Page "${title}" created.` };
		}
	},

	deletePage: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return fail(400, { message: 'Page ID required.' });

		const { error } = await locals.supabase.from('pages').delete().eq('id', id);
		if (error) return fail(500, { message: error.message });

		return { success: true, message: 'Page deleted.' };
	}
};
