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

	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	let query = locals.supabase
		.from('reviews')
		.select(
			`
			*,
			products ( name ),
			profiles ( full_name ),
			review_images ( id, url, position )
		`,
			{ count: 'exact' }
		)
		.order('created_at', { ascending: false })
		.range(from, to);

	if (search) {
		query = query.ilike('comment', `%${search}%`);
	}

	const { data: reviews, error, count } = await query;

	if (error) {
		console.error('Error fetching reviews:', error);
	}

	return {
		reviews: (reviews ?? []).map((r: any) => ({
			...r,
			review_images: [...(r.review_images ?? [])].sort(
				(a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
			)
		})),
		page,
		perPage,
		total: count ?? 0,
		search
	};
};

export const actions: Actions = {
	deleteReviewImage: async ({ request, locals }) => {
		const formData = await request.formData();
		const imageId = formData.get('imageId') as string;
		const imageUrl = formData.get('imageUrl') as string;

		if (!imageId) return fail(400, { error: 'Image ID is required' });

		const { error: dbError } = await locals.supabase
			.from('review_images')
			.delete()
			.eq('id', imageId);

		if (dbError) return fail(500, { error: dbError.message });

		if (imageUrl) {
			try {
				const url = new URL(imageUrl);
				const pathMatch = url.pathname.match(/\/object\/public\/review-images\/(.+)/);
				if (pathMatch) {
					await locals.supabase.storage.from('review-images').remove([pathMatch[1]]);
				}
			} catch {
				// Don't fail if storage cleanup fails
			}
		}

		return { success: true };
	}
};
