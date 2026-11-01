import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return { reviews: [] };

	const { data: reviews, error } = await locals.supabase
		.from('reviews')
		.select(
			`
			id,
			rating,
			comment,
			created_at,
			product_id,
			is_verified_purchase,
			review_images (id, url, position),
			products (
				id,
				name,
				slug,
				product_images (url, position)
			)
		`
		)
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching user reviews:', error);
	}

	const formattedReviews = (reviews ?? []).map((rev: any) => {
		const p = rev.products;
		const images = p?.product_images || [];
		const sorted = [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
		const rImages = rev.review_images || [];
		const sortedReviewImages = [...rImages].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
		return {
			...rev,
			productName: p?.name || 'Hardware Product',
			productSlug: p?.slug || '',
			primaryImage: sorted[0]?.url || null,
			review_images: sortedReviewImages
		};
	});

	return {
		reviews: formattedReviews
	};
};

export const actions: Actions = {
	deleteReview: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const reviewId = formData.get('reviewId') as string;

		if (!reviewId) return fail(400, { message: 'Review ID required' });

		const { error } = await locals.supabase
			.from('reviews')
			.delete()
			.eq('id', reviewId)
			.eq('user_id', user.id);

		if (error) {
			return fail(500, { message: error.message || 'Failed to delete review' });
		}

		return { success: true, message: 'Review removed' };
	}
};
