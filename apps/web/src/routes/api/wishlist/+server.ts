import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET /api/wishlist - Get all product IDs in user's wishlist
export const GET: RequestHandler = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		return json({ productIds: [] });
	}

	const { data, error } = await locals.supabase
		.from('wishlists')
		.select('product_id')
		.eq('user_id', user.id);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	const productIds = (data ?? []).map((w: any) => w.product_id);
	return json({ productIds });
};

// POST /api/wishlist - Toggle product in user's wishlist
export const POST: RequestHandler = async ({ request, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		return json(
			{ error: 'unauthorized', message: 'Please sign in to save items to your wishlist' },
			{ status: 401 }
		);
	}

	try {
		const { productId } = await request.json();
		if (!productId) {
			return json({ error: 'missing_productId', message: 'Product ID is required' }, { status: 400 });
		}

		// Check if already in wishlist
		const { data: existing } = await locals.supabase
			.from('wishlists')
			.select('id')
			.eq('user_id', user.id)
			.eq('product_id', productId)
			.maybeSingle();

		if (existing) {
			// Remove from wishlist
			const { error: deleteError } = await locals.supabase
				.from('wishlists')
				.delete()
				.eq('id', existing.id)
				.eq('user_id', user.id);

			if (deleteError) throw deleteError;

			return json({
				success: true,
				action: 'removed',
				productId,
				message: 'Removed from wishlist'
			});
		} else {
			// Add to wishlist
			const { error: insertError } = await locals.supabase
				.from('wishlists')
				.insert({
					user_id: user.id,
					product_id: productId
				});

			if (insertError) throw insertError;

			return json({
				success: true,
				action: 'added',
				productId,
				message: 'Added to wishlist'
			});
		}
	} catch (err: any) {
		return json({ error: 'server_error', message: err.message || 'Failed to update wishlist' }, { status: 500 });
	}
};
