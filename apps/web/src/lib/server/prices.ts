import type { ProductListItem } from '@repo/types';

/**
 * Resolves the effective price and flash sale status for a product variant using Supabase SQL RPC effective_price
 */
export async function getEffectivePrice(
	supabase: any,
	variantId: string | null | undefined,
	regularPrice: number
): Promise<{ effectivePrice: number; isOnSale: boolean }> {
	if (!variantId) {
		return { effectivePrice: regularPrice, isOnSale: false };
	}

	try {
		const { data, error } = await supabase.rpc('effective_price', { p_variant_id: variantId });
		if (!error && data != null) {
			const effectivePrice = Number(data);
			return {
				effectivePrice,
				isOnSale: effectivePrice < regularPrice
			};
		}
	} catch (e) {
		console.error('Error invoking effective_price RPC:', e);
	}

	return { effectivePrice: regularPrice, isOnSale: false };
}

/**
 * Maps raw database product row (with joined variants, images, categories, reviews)
 * into a strongly typed ProductListItem with effective pricing.
 */
export async function mapToProductListItem(
	supabase: any,
	p: any
): Promise<ProductListItem & { categories?: { id: string; name: string; slug: string } | null }> {
	const images = p.product_images || [];
	const sortedImages = [...images].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
	const primaryImageUrl = sortedImages[0]?.url || null;

	const reviews = p.reviews || [];
	const reviewCount = reviews.length;
	const averageRating =
		reviewCount > 0
			? reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / reviewCount
			: null;

	const activeVariants = (p.product_variants || []).filter((v: any) => v.is_active !== false);
	const defaultVariant = activeVariants[0] || null;
	const defaultVariantId = defaultVariant?.id || null;

	const basePrice = defaultVariant ? Number(defaultVariant.price) : Number(p.price);
	const compareAtPrice =
		defaultVariant?.compare_at_price != null
			? Number(defaultVariant.compare_at_price)
			: p.compare_at_price != null
				? Number(p.compare_at_price)
				: null;

	const { effectivePrice, isOnSale } = await getEffectivePrice(supabase, defaultVariantId, basePrice);

	return {
		id: p.id,
		name: p.name,
		slug: p.slug,
		description: p.description,
		compareAtPrice,
		compare_at_price: compareAtPrice,
		effectivePrice,
		isOnSale,
		stock_quantity: defaultVariant ? defaultVariant.stock_quantity : p.stock_quantity,
		sku: defaultVariant?.sku || p.sku,
		is_active: p.is_active,
		category_id: p.category_id,
		created_at: p.created_at,
		updated_at: p.updated_at || p.created_at || new Date().toISOString(),
		meta_title: p.meta_title ?? null,
		meta_description: p.meta_description ?? null,
		og_image_url: p.og_image_url ?? null,
		defaultVariantId,
		categories: p.categories,
		primaryImageUrl,
		averageRating,
		reviewCount
	};
}
