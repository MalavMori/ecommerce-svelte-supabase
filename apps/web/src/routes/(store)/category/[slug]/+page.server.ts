import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ProductListItem } from '@repo/types';
import { mapToProductListItem } from '$lib/server/prices';
import {
	getCategoryAndDescendantIds,
	getCategoryAncestors,
	getSubcategories,
	type CategoryNode
} from '$lib/server/categories';

export const load: PageServerLoad = async ({ params, url, locals, depends }) => {
	depends('app:category');
	const categorySlug = params.slug;
	const sort = url.searchParams.get('sort')?.trim() || 'newest';
	const search = url.searchParams.get('search')?.trim() || '';
	const minPriceParam = url.searchParams.get('minPrice');
	const maxPriceParam = url.searchParams.get('maxPrice');
	const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
	const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
	const pageSize = 12;

	// Load target category
	const { data: category, error: catError } = await locals.supabase
		.from('categories')
		.select('*')
		.eq('slug', categorySlug)
		.single();

	if (catError || !category) {
		throw error(404, `Category "${categorySlug}" not found`);
	}

	// Load all categories for nav/sidebar and hierarchy resolution
	const { data: allCategoriesRaw } = await locals.supabase
		.from('categories')
		.select('id, name, slug, parent_id')
		.order('name');

	const allCategories: CategoryNode[] = allCategoriesRaw ?? [];

	// Resolve all descendant category IDs (current category + all child/grandchild categories)
	const targetCategoryIds = getCategoryAndDescendantIds(category.id, allCategories);
	const subcategories = getSubcategories(category.id, allCategories);
	const ancestors = getCategoryAncestors(category, allCategories);

	// Query products in this category and all descendant categories
	let query = locals.supabase
		.from('products')
		.select(
			`
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
		`,
			{ count: 'exact' }
		)
		.in('category_id', targetCategoryIds)
		.eq('is_active', true);

	// Filters
	if (search) {
		query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
	}
	if (minPriceParam && !isNaN(parseFloat(minPriceParam))) {
		query = query.gte('price', parseFloat(minPriceParam));
	}
	if (maxPriceParam && !isNaN(parseFloat(maxPriceParam))) {
		query = query.lte('price', parseFloat(maxPriceParam));
	}

	// Sorting
	if (sort === 'price_asc') {
		query = query.order('price', { ascending: true });
	} else if (sort === 'price_desc') {
		query = query.order('price', { ascending: false });
	} else {
		query = query.order('created_at', { ascending: false });
	}

	// Pagination
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;
	query = query.range(from, to);

	const { data: rawProducts, count: totalCount, error: prodError } = await query;

	if (prodError) {
		console.error('Error loading category products:', prodError);
	}

	const products = await Promise.all(
		(rawProducts ?? []).map((p: any) => mapToProductListItem(locals.supabase, p))
	);

	if (sort === 'rating') {
		products.sort((a: ProductListItem, b: ProductListItem) => (b.averageRating || 0) - (a.averageRating || 0));
	}

	const total = totalCount ?? 0;
	const totalPages = Math.ceil(total / pageSize) || 1;

	return {
		category,
		categories: allCategories,
		subcategories,
		ancestors,
		products,
		total,
		page,
		totalPages,
		pageSize,
		filters: {
			sort,
			search,
			minPrice: minPriceParam ? parseFloat(minPriceParam) : null,
			maxPrice: maxPriceParam ? parseFloat(maxPriceParam) : null
		}
	};
};
