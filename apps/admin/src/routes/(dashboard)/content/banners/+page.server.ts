import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: banners, error } = await locals.supabase
		.from('banners')
		.select('*')
		.order('position', { ascending: true });

	if (error) {
		console.error('Error fetching banners:', error);
	}

	return {
		banners: banners ?? []
	};
};

export const actions: Actions = {
	createBanner: async ({ request, locals }) => {
		const formData = await request.formData();
		const title = formData.get('title')?.toString().trim();
		const subtitle = formData.get('subtitle')?.toString().trim() || null;
		const image_url = formData.get('image_url')?.toString().trim();
		const link_url = formData.get('link_url')?.toString().trim() || null;
		const position = parseInt(formData.get('position')?.toString() || '0', 10);
		const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

		const starts_at_raw = formData.get('starts_at')?.toString().trim();
		const ends_at_raw = formData.get('ends_at')?.toString().trim();

		const starts_at = starts_at_raw ? new Date(starts_at_raw).toISOString() : null;
		const ends_at = ends_at_raw ? new Date(ends_at_raw).toISOString() : null;

		if (!title || !image_url) {
			return fail(400, { message: 'Title and image URL are required.' });
		}

		if (starts_at && ends_at && new Date(ends_at) <= new Date(starts_at)) {
			return fail(400, { message: 'End time must be after start time.' });
		}

		const { error } = await locals.supabase.from('banners').insert({
			title,
			subtitle,
			image_url,
			link_url,
			position,
			is_active,
			starts_at,
			ends_at
		});

		if (error) {
			return fail(500, { message: error.message });
		}

		return { success: true, message: 'Banner created successfully.' };
	},

	updateBanner: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const title = formData.get('title')?.toString().trim();
		const subtitle = formData.get('subtitle')?.toString().trim() || null;
		const image_url = formData.get('image_url')?.toString().trim();
		const link_url = formData.get('link_url')?.toString().trim() || null;
		const position = parseInt(formData.get('position')?.toString() || '0', 10);
		const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

		const starts_at_raw = formData.get('starts_at')?.toString().trim();
		const ends_at_raw = formData.get('ends_at')?.toString().trim();

		const starts_at = starts_at_raw ? new Date(starts_at_raw).toISOString() : null;
		const ends_at = ends_at_raw ? new Date(ends_at_raw).toISOString() : null;

		if (!id) return fail(400, { message: 'Banner ID required.' });
		if (!title || !image_url) {
			return fail(400, { message: 'Title and image URL are required.' });
		}

		if (starts_at && ends_at && new Date(ends_at) <= new Date(starts_at)) {
			return fail(400, { message: 'End time must be after start time.' });
		}

		const { error } = await locals.supabase
			.from('banners')
			.update({
				title,
				subtitle,
				image_url,
				link_url,
				position,
				is_active,
				starts_at,
				ends_at,
				updated_at: new Date().toISOString()
			})
			.eq('id', id);

		if (error) {
			return fail(500, { message: error.message });
		}

		return { success: true, message: 'Banner updated successfully.' };
	},

	toggleActive: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const is_active = formData.get('is_active') === 'true';

		if (!id) return fail(400, { message: 'Banner ID required.' });

		const { error } = await locals.supabase
			.from('banners')
			.update({ is_active: !is_active, updated_at: new Date().toISOString() })
			.eq('id', id);

		if (error) return fail(500, { message: error.message });

		return { success: true };
	},

	deleteBanner: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) return fail(400, { message: 'Banner ID required.' });

		const { error } = await locals.supabase.from('banners').delete().eq('id', id);

		if (error) return fail(500, { message: error.message });

		return { success: true, message: 'Banner deleted.' };
	}
};
