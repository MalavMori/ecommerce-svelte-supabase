import type { PageServerLoad } from './$types';
import type { HomepageContent, ProductListItem, Category, Banner, FeaturedCollection } from '@repo/types';
import { mapToProductListItem } from '$lib/server/prices';

export const load: PageServerLoad = async ({ locals }) => {
	// 1. Fetch active banners ordered by position
	const { data: bannersData } = await locals.supabase
		.from('banners')
		.select('*')
		.eq('is_active', true)
		.order('position', { ascending: true });

	const banners: Banner[] = bannersData ?? [];

	// 2. Fetch featured collections joined with category
	const { data: collectionsData } = await locals.supabase
		.from('featured_collections')
		.select(`
			*,
			category:categories (id, name, slug)
		`)
		.order('position', { ascending: true });

	const featuredCollections = (collectionsData ?? []).filter((c: any) => c.category) as (FeaturedCollection & { category: Category })[];

	// 3. Fetch configured featured products by section
	const { data: featProdsData } = await locals.supabase
		.from('featured_products')
		.select(`
			section,
			position,
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
				meta_title,
				meta_description,
				og_image_url,
				categories (id, name, slug),
				product_images (url, position),
				product_variants (id, is_active, stock_quantity, price, compare_at_price, sale_price),
				reviews (rating)
			)
		`)
		.order('position', { ascending: true });

	const sections: {
		featured: ProductListItem[];
		new_arrivals: ProductListItem[];
		best_sellers: ProductListItem[];
		trending: ProductListItem[];
	} = {
		featured: [],
		new_arrivals: [],
		best_sellers: [],
		trending: []
	};

	if (featProdsData && featProdsData.length > 0) {
		for (const row of featProdsData) {
			if (row.products && (row.products as any).is_active) {
				const item = await mapToProductListItem(locals.supabase, row.products);
				const sec = row.section as keyof typeof sections;
				if (sections[sec]) {
					sections[sec].push(item);
				}
			}
		}
	}

	// 4. Fallback if any section is empty from catalog
	const needsFallback = Object.values(sections).some((arr) => arr.length === 0);
	if (needsFallback) {
		const { data: fallbackProducts } = await locals.supabase
			.from('products')
			.select(`
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
				meta_title,
				meta_description,
				og_image_url,
				categories (id, name, slug),
				product_images (url, position),
				product_variants (id, is_active, stock_quantity, price, compare_at_price, sale_price),
				reviews (rating)
			`)
			.eq('is_active', true)
			.order('created_at', { ascending: false })
			.limit(16);

		const catalog = await Promise.all(
			(fallbackProducts ?? []).map((p: any) => mapToProductListItem(locals.supabase, p))
		);

		if (sections.featured.length === 0) sections.featured = catalog.slice(0, 8);
		if (sections.new_arrivals.length === 0) sections.new_arrivals = catalog.slice(0, 8);
		if (sections.best_sellers.length === 0) sections.best_sellers = catalog.slice(2, 10);
		if (sections.trending.length === 0) sections.trending = catalog.slice(4, 12);
	}

	// 5. Fetch all categories
	const { data: categoriesData } = await locals.supabase
		.from('categories')
		.select('id, name, slug')
		.order('name');

	const homepageContent: HomepageContent = {
		banners,
		featuredCollections,
		featuredProductSections: sections
	};

	return {
		homepageContent,
		categories: (categoriesData ?? []) as Category[]
	};
};
