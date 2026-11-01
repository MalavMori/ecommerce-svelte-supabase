import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { ProductCard } from '@repo/types';
import { getEffectivePrice, mapToProductListItem } from '$lib/server/prices';

export const load: PageServerLoad = async ({ params, locals }) => {
	const slug = params.slug;

	// Fetch product by slug
	const { data: product, error: prodError } = await locals.supabase
		.from('products')
		.select(
			`
			*,
			categories (id, name, slug),
			product_images (id, url, position, variant_id),
			product_variants (
				id,
				price,
				sale_price,
				compare_at_price,
				stock_quantity,
				sku,
				is_active,
				variant_option_values (
					product_option_values (
						value,
						product_options (name)
					)
				)
			)
		`
		)
		.eq('slug', slug)
		.eq('is_active', true)
		.single();

	if (prodError || !product) {
		throw error(404, `Product "${slug}" not found`);
	}

	// Fetch reviews with profiles, review_images, and verified purchase status
	const { data: reviewsData } = await locals.supabase
		.from('reviews')
		.select(
			`
			id,
			rating,
			comment,
			created_at,
			user_id,
			is_verified_purchase,
			profiles (id, full_name, avatar_url),
			review_images (id, url, position)
		`
		)
		.eq('product_id', product.id)
		.order('created_at', { ascending: false });

	const reviews = (reviewsData ?? []).map((rev: any) => {
		const rImages = rev.review_images || [];
		const sortedReviewImages = [...rImages].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
		return {
			...rev,
			review_images: sortedReviewImages
		};
	});
	const reviewCount = reviews.length;

	// Calculate rating distribution & average
	const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
	let ratingSum = 0;

	for (const rev of reviews) {
		const r = Math.max(1, Math.min(5, Math.round(Number(rev.rating) || 5)));
		distribution[r] = (distribution[r] || 0) + 1;
		ratingSum += Number(rev.rating) || 0;
	}

	const averageRating = reviewCount > 0 ? ratingSum / reviewCount : null;

	// Sort product images by position
	const images = [...(product.product_images || [])].sort(
		(a, b) => (a.position ?? 0) - (b.position ?? 0)
	);

	// Fetch options and option values for variant selectors
	const { data: optionsData } = await locals.supabase
		.from('product_options')
		.select(`
			id,
			name,
			position,
			product_option_values (id, value, position)
		`)
		.eq('product_id', product.id)
		.order('position', { ascending: true });

	const options = (optionsData ?? []).map((opt: any) => ({
		...opt,
		product_option_values: (opt.product_option_values ?? []).sort(
			(a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
		)
	}));

	// Fetch related products (same category)
	let relatedProducts: any[] = [];
	if (product.category_id) {
		const { data: relatedData } = await locals.supabase
			.from('products')
			.select(
				`
				*,
				categories (id, name, slug),
				product_images (url, position),
				product_variants (id, is_active, stock_quantity, price, compare_at_price),
				reviews (rating)
			`
			)
			.eq('category_id', product.category_id)
			.eq('is_active', true)
			.neq('id', product.id)
			.limit(4);

		relatedProducts = await Promise.all(
			(relatedData ?? []).map((p: any) => mapToProductListItem(locals.supabase, p))
		);
	}

	// Check if current logged in user has already reviewed this product
	const { user } = await locals.safeGetSession();
	const userReview = user ? reviews.find((r) => r.user_id === user.id) : null;

	// Check if user has purchased this product (completed order item)
	let hasPurchased = false;
	if (user) {
		const { data: purchaseData } = await locals.supabase
			.from('order_items')
			.select('id, orders!inner(id, user_id, status)')
			.eq('product_id', product.id)
			.eq('orders.user_id', user.id)
			.neq('orders.status', 'cancelled')
			.limit(1);

		hasPurchased = Boolean(purchaseData && purchaseData.length > 0);
	}

	const rawVariants = (product.product_variants || []).filter((v: any) => v.is_active);

	// Resolve effective prices for all variants
	const variants = await Promise.all(
		rawVariants.map(async (v: any) => {
			const { effectivePrice, isOnSale } = await getEffectivePrice(
				locals.supabase,
				v.id,
				Number(v.price)
			);
			return {
				...v,
				effectivePrice,
				isOnSale
			};
		})
	);

	const defaultVariant = variants[0] || null;
	const { effectivePrice: heroEffectivePrice, isOnSale: heroIsOnSale } = await getEffectivePrice(
		locals.supabase,
		defaultVariant?.id,
		defaultVariant ? Number(defaultVariant.price) : Number(product.price)
	);

	return {
		product: {
			...product,
			price: heroEffectivePrice,
			effectivePrice: heroEffectivePrice,
			isOnSale: heroIsOnSale,
			compare_at_price: defaultVariant?.compare_at_price != null
				? Number(defaultVariant.compare_at_price)
				: (product.compare_at_price ? Number(product.compare_at_price) : null),
			stock_quantity: defaultVariant ? defaultVariant.stock_quantity : product.stock_quantity,
			defaultVariantId: defaultVariant?.id || null,
			images
		},
		defaultVariantId: defaultVariant?.id || null,
		variants,
		options,
		reviews,
		reviewCount,
		averageRating,
		distribution,
		relatedProducts,
		userReview,
		user,
		hasPurchased
	};
};

export const actions: Actions = {
	submitReview: async ({ request, locals, params }) => {
		const { user } = await locals.safeGetSession();
		if (!user) {
			return fail(401, { message: 'You must be signed in to submit a review' });
		}

		const formData = await request.formData();
		const productId = formData.get('productId') as string;
		const rating = parseInt(formData.get('rating') as string, 10);
		const comment = (formData.get('comment') as string)?.trim() || '';

		if (!productId || isNaN(rating) || rating < 1 || rating > 5) {
			return fail(400, { message: 'Invalid rating (must be between 1 and 5 stars)' });
		}

		if (!comment) {
			return fail(400, { message: 'Please write a comment for your review' });
		}

		// Verify that user has purchased this product before allowing review submission
		const { data: purchaseData } = await locals.supabase
			.from('order_items')
			.select('id, orders!inner(id, user_id, status)')
			.eq('product_id', productId)
			.eq('orders.user_id', user.id)
			.neq('orders.status', 'cancelled')
			.limit(1);

		if (!purchaseData || purchaseData.length === 0) {
			return fail(403, { message: 'Only verified purchasers of this product can submit a review' });
		}

		// Upsert review
		const { data: reviewRow, error: upsertError } = await locals.supabase
			.from('reviews')
			.upsert(
				{
					product_id: productId,
					user_id: user.id,
					rating,
					comment
				},
				{ onConflict: 'product_id,user_id' }
			)
			.select('id')
			.single();

		if (upsertError || !reviewRow) {
			return fail(500, { message: upsertError?.message || 'Failed to save review' });
		}

		// Handle attached review images
		const imageFiles = formData.getAll('images') as File[];
		let position = 0;

		for (const file of imageFiles) {
			if (file && file.size > 0 && file.size <= 5 * 1024 * 1024 && file.type.startsWith('image/')) {
				const ext = file.name.split('.').pop() || 'jpg';
				const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

				const { error: uploadError } = await locals.supabase.storage
					.from('review-images')
					.upload(path, file, {
						contentType: file.type,
						upsert: true
					});

				if (!uploadError) {
					const { data: { publicUrl } } = locals.supabase.storage
						.from('review-images')
						.getPublicUrl(path);

					await locals.supabase.from('review_images').insert({
						review_id: reviewRow.id,
						url: publicUrl,
						position: position++
					});
				} else {
					console.error('Failed to upload review image:', uploadError);
				}
			}
		}

		return { success: true, message: 'Your review and photos have been published!' };
	}
};

