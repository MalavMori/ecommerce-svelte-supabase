import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// 1. Featured collections joined with category
	const { data: collections } = await locals.supabase
		.from('featured_collections')
		.select(
			`
			*,
			category:categories (id, name, slug)
		`
		)
		.order('position', { ascending: true });

	// 2. Featured products joined with product
	const { data: featuredProds } = await locals.supabase
		.from('featured_products')
		.select(
			`
			*,
			product:products (id, name, slug, price)
		`
		)
		.order('section')
		.order('position', { ascending: true });

	// 3. All categories and products for dropdown selects
	const { data: allCategories } = await locals.supabase
		.from('categories')
		.select('id, name')
		.order('name');

	const { data: allProducts } = await locals.supabase
		.from('products')
		.select('id, name')
		.eq('is_active', true)
		.order('name');

	return {
		collections: collections ?? [],
		featuredProducts: featuredProds ?? [],
		allCategories: allCategories ?? [],
		allProducts: allProducts ?? []
	};
};

export const actions: Actions = {
	addCollection: async ({ request, locals }) => {
		const formData = await request.formData();
		const category_id = formData.get('category_id')?.toString();
		const label = formData.get('label')?.toString().trim() || null;
		const image_url = formData.get('image_url')?.toString().trim();
		const position = parseInt(formData.get('position')?.toString() || '0', 10);
		const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

		if (!category_id || !image_url) {
			return fail(400, { message: 'Category and image URL are required.' });
		}

		const { error } = await locals.supabase.from('featured_collections').insert({
			category_id,
			label,
			image_url,
			position,
			is_active
		});

		if (error) {
			return fail(500, { message: error.message });
		}

		return { success: true, message: 'Featured collection added.' };
	},

	toggleCollectionActive: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const is_active = formData.get('is_active') === 'true';

		if (!id) return fail(400, { message: 'ID required.' });

		const { error } = await locals.supabase
			.from('featured_collections')
			.update({ is_active: !is_active })
			.eq('id', id);

		if (error) return fail(500, { message: error.message });
		return { success: true };
	},

	deleteCollection: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return fail(400, { message: 'ID required.' });

		const { error } = await locals.supabase.from('featured_collections').delete().eq('id', id);
		if (error) return fail(500, { message: error.message });

		return { success: true, message: 'Collection removed.' };
	},

	addFeaturedProduct: async ({ request, locals }) => {
		const formData = await request.formData();
		const product_id = formData.get('product_id')?.toString();
		const section = formData.get('section')?.toString() || 'featured';
		const position = parseInt(formData.get('position')?.toString() || '0', 10);
		const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

		if (!product_id) {
			return fail(400, { message: 'Product is required.' });
		}

		const { error } = await locals.supabase.from('featured_products').insert({
			product_id,
			section,
			position,
			is_active
		});

		if (error) {
			return fail(500, { message: error.message });
		}

		return { success: true, message: 'Featured product added to section.' };
	},

	toggleProductActive: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const is_active = formData.get('is_active') === 'true';

		if (!id) return fail(400, { message: 'ID required.' });

		const { error } = await locals.supabase
			.from('featured_products')
			.update({ is_active: !is_active })
			.eq('id', id);

		if (error) return fail(500, { message: error.message });
		return { success: true };
	},

	deleteFeaturedProduct: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return fail(400, { message: 'ID required.' });

		const { error } = await locals.supabase.from('featured_products').delete().eq('id', id);
		if (error) return fail(500, { message: error.message });

		return { success: true, message: 'Product removed from section.' };
	}
};
