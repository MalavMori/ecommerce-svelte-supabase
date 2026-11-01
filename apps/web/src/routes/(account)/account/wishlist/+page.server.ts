import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { mapToProductListItem } from '$lib/server/prices';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		throw redirect(303, '/login');
	}

	const { data: wishlistData, error } = await locals.supabase
		.from('wishlists')
		.select(`
			id,
			created_at,
			products (
				id,
				name,
				slug,
				description,
				price,
				compare_at_price,
				stock_quantity,
				sku,
				is_active,
				created_at,
				categories (id, name, slug),
				product_images (url, position),
				product_variants (id, is_active, stock_quantity, price, compare_at_price),
				reviews (rating)
			)
		`)
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching wishlist:', error);
	}

	const items = await Promise.all(
		(wishlistData ?? [])
			.filter((row: any) => row.products && row.products.is_active)
			.map(async (row: any) => {
				const product = await mapToProductListItem(locals.supabase, row.products);
				return {
					wishlistId: row.id,
					addedAt: row.created_at,
					product
				};
			})
	);

	return {
		items
	};
};
