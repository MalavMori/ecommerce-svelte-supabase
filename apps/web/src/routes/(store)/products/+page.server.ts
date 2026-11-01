import type { PageServerLoad } from './$types';
import type { Category, ProductListItem } from '@repo/types';
import { mapToProductListItem } from '$lib/server/prices';
import { getCategoryAndDescendantIds } from '$lib/server/categories';

export const load: PageServerLoad = async ({ url, locals, cookies }) => {
	// Parse URL search params
	const categorySlug = url.searchParams.get('category')?.trim() || '';
	const search = url.searchParams.get('search')?.trim() || '';
	const sort = url.searchParams.get('sort')?.trim() || 'newest';
	const dealsOnly = url.searchParams.get('deals') === 'true';
	const inStockOnly = url.searchParams.get('inStock') === 'true';
	const minPriceParam = url.searchParams.get('minPrice')?.trim();
	const maxPriceParam = url.searchParams.get('maxPrice')?.trim();
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
	const pageSize = 12;

	// Fetch categories, store setting (base currency), and exchange rates in parallel
	const [
		{ data: categoriesData },
		{ data: storeSetting },
		{ data: ratesData }
	] = await Promise.all([
		locals.supabase.from('categories').select('*').order('name'),
		locals.supabase.from('store_settings').select('base_currency_code').single(),
		locals.supabase.from('exchange_rates').select('currency_code, rate_to_base')
	]);

	const categories: Category[] = categoriesData ?? [];
	const baseCurrency = storeSetting?.base_currency_code ?? 'INR';
	const urlCurrency = url.searchParams.get('currency')?.trim() || url.searchParams.get('curr')?.trim();
	const cookieCurrency = cookies.get('selected_currency')?.trim();
	const activeCurrency = (urlCurrency || cookieCurrency || baseCurrency).toUpperCase();

	// Exchange rate: 1 baseCurrency = rate activeCurrency
	const rateObj = (ratesData ?? []).find((r: any) => r.currency_code === activeCurrency);
	const exchangeRate = rateObj ? Number(rateObj.rate_to_base) : (activeCurrency === baseCurrency ? 1.0 : 1.0);
	const rate = exchangeRate > 0 ? exchangeRate : 1.0;

	// Parse & validate price boundaries (provided in active display currency)
	let minPrice: number | null = null;
	let maxPrice: number | null = null;

	if (minPriceParam && !isNaN(parseFloat(minPriceParam))) {
		minPrice = Math.max(0, parseFloat(minPriceParam));
	}
	if (maxPriceParam && !isNaN(parseFloat(maxPriceParam))) {
		maxPrice = Math.max(0, parseFloat(maxPriceParam));
	}
	// If both set and min > max, swap them to prevent zero-result deadlock
	if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
		const temp = minPrice;
		minPrice = maxPrice;
		maxPrice = temp;
	}

	// Build query
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
		.eq('is_active', true);

	// Category filter (includes current category and all child subcategories)
	if (categorySlug) {
		const slugLower = categorySlug.toLowerCase();
		const matchedCategory = categories.find(
			(c) => c.slug.toLowerCase() === slugLower || c.name.toLowerCase() === slugLower || c.id === categorySlug
		);
		if (matchedCategory) {
			const targetCategoryIds = getCategoryAndDescendantIds(matchedCategory.id, categories);
			query = query.in('category_id', targetCategoryIds);
		} else {
			// Unknown category specified, match nothing rather than returning all
			query = query.eq('category_id', '00000000-0000-0000-0000-000000000000');
		}
	}

	// Search filter (name or description, sanitized against PostgREST syntax injection)
	if (search) {
		const cleanSearch = search.replace(/[,()]/g, ' ').trim();
		if (cleanSearch) {
			query = query.or(`name.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%`);
		}
	}

	// Deals only filter
	if (dealsOnly) {
		query = query.not('compare_at_price', 'is', null).gt('compare_at_price', 0);
	}

	// In-stock only filter
	if (inStockOnly) {
		query = query.gt('stock_quantity', 0);
	}

	// Price range filters: convert active currency amount to base currency (DB price)
	// Because: displayPrice = basePrice * rate => basePrice = displayPrice / rate
	if (minPrice !== null) {
		const minInBase = minPrice / rate;
		query = query.gte('price', minInBase);
	}
	if (maxPrice !== null) {
		const maxInBase = maxPrice / rate;
		query = query.lte('price', maxInBase);
	}

	// Sorting
	if (sort === 'price_asc') {
		query = query.order('price', { ascending: true });
	} else if (sort === 'price_desc') {
		query = query.order('price', { ascending: false });
	} else if (sort === 'name_asc') {
		query = query.order('name', { ascending: true });
	} else if (sort === 'name_desc') {
		query = query.order('name', { ascending: false });
	} else {
		// default newest
		query = query.order('created_at', { ascending: false });
	}

	let products: ProductListItem[] = [];
	let total = 0;

	if (sort === 'rating') {
		// Rating sorting requires computing average rating across matching products
		const { data: allRaw, count: allCount, error: sortError } = await query.limit(100);
		if (sortError) {
			console.error('Error querying products for rating sort:', sortError);
		}
		total = allCount ?? 0;
		const allMapped = await Promise.all(
			(allRaw ?? []).map((p: any) => mapToProductListItem(locals.supabase, p))
		);
		allMapped.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

		const from = (page - 1) * pageSize;
		products = allMapped.slice(from, from + pageSize);
	} else {
		// Standard database pagination
		const from = (page - 1) * pageSize;
		const to = from + pageSize - 1;
		query = query.range(from, to);

		const { data: rawProducts, count: totalCount, error } = await query;
		if (error) {
			console.error('Error loading products catalog:', error);
		}
		total = totalCount ?? 0;
		products = await Promise.all(
			(rawProducts ?? []).map((p: any) => mapToProductListItem(locals.supabase, p))
		);
	}

	const totalPages = Math.ceil(total / pageSize) || 1;

	return {
		products,
		total,
		page,
		totalPages,
		pageSize,
		categories,
		filters: {
			category: categorySlug,
			search,
			sort,
			deals: dealsOnly,
			inStock: inStockOnly,
			minPrice,
			maxPrice,
			currency: activeCurrency
		}
	};
};
