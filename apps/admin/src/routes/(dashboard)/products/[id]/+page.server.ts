import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const BUCKET = 'product-images';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	const { data: product, error: productError } = await locals.supabase
		.from('products')
		.select('*')
		.eq('id', id)
		.single();

	if (productError || !product) {
		throw error(404, 'Product not found');
	}

	const [{ data: categories }, { data: images }, { data: rawOptions }, { data: rawVariants }] =
		await Promise.all([
			locals.supabase.from('categories').select('id, name').order('name'),
			locals.supabase
				.from('product_images')
				.select('*')
				.eq('product_id', id)
				.order('position', { ascending: true }),
			locals.supabase
				.from('product_options')
				.select(
					`
				id,
				name,
				position,
				product_option_values (
					id,
					option_id,
					value,
					position
				)
			`
				)
				.eq('product_id', id)
				.order('position', { ascending: true }),
			locals.supabase
				.from('product_variants')
				.select(
					`
				id,
				sku,
				price,
				compare_at_price,
				stock_quantity,
				is_active,
				sale_price,
				sale_starts_at,
				sale_ends_at,
				created_at,
				variant_option_values (
					option_value_id,
					product_option_values (
						id,
						value,
						option_id
					)
				)
			`
				)
				.eq('product_id', id)
				.order('created_at', { ascending: true })
		]);

	// Sort option values by position
	const options = (rawOptions ?? []).map((opt: any) => ({
		...opt,
		product_option_values: (opt.product_option_values ?? []).sort(
			(a: any, b: any) => (a.position ?? 0) - (b.position ?? 0)
		)
	}));

	return {
		product,
		categories: categories ?? [],
		images: images ?? [],
		options,
		variants: rawVariants ?? []
	};
};

export const actions: Actions = {
	uploadImage: async ({ request, params, locals }) => {
		const { id: product_id } = params;
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const urlParam =
			(formData.get('url') as string) || (formData.get('image_url') as string) || null;
		const variantId = (formData.get('variant_id') as string) || null;

		let finalUrl = urlParam && urlParam.trim() !== '' ? urlParam.trim() : null;

		if (!finalUrl) {
			if (!file || file.size === 0) {
				return fail(400, { error: 'No file or image URL provided' });
			}

			// Only allow image types
			if (!file.type.startsWith('image/')) {
				return fail(400, { error: 'File must be an image' });
			}

			// Generate a unique storage path in product-images bucket
			const ext = file.name.split('.').pop() ?? 'jpg';
			const storagePath = `${product_id}/${crypto.randomUUID()}.${ext}`;

			const arrayBuffer = await file.arrayBuffer();
			const { error: uploadError } = await locals.supabase.storage
				.from(BUCKET)
				.upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

			if (uploadError) {
				return fail(500, { error: `Upload failed: ${uploadError.message}` });
			}

			// Get the public URL
			const { data: urlData } = locals.supabase.storage.from(BUCKET).getPublicUrl(storagePath);
			finalUrl = urlData.publicUrl;
		}

		// Get current max position
		const { data: existing } = await locals.supabase
			.from('product_images')
			.select('position')
			.eq('product_id', product_id)
			.order('position', { ascending: false })
			.limit(1);

		const nextPosition = existing && existing.length > 0 ? (existing[0].position ?? 0) + 1 : 0;

		const { error: dbError } = await locals.supabase.from('product_images').insert({
			product_id,
			url: finalUrl,
			position: nextPosition,
			variant_id: variantId && variantId.trim() !== '' ? variantId : null
		});

		if (dbError) {
			return fail(500, { error: `Database error: ${dbError.message}` });
		}

		return { success: true };
	},

	updateImageVariant: async ({ request, locals }) => {
		const formData = await request.formData();
		const imageId = formData.get('imageId') as string;
		const variantId = (formData.get('variantId') as string) || null;

		if (!imageId) return fail(400, { error: 'Image ID is required' });

		const { error } = await locals.supabase
			.from('product_images')
			.update({ variant_id: variantId && variantId.trim() !== '' ? variantId : null })
			.eq('id', imageId);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	replaceImage: async ({ request, locals }) => {
		const formData = await request.formData();
		const imageId = formData.get('imageId') as string;
		const newUrl =
			(formData.get('url') as string) || (formData.get('image_url') as string) || null;

		if (!imageId || !newUrl) {
			return fail(400, { error: 'Image ID and new image are required' });
		}

		const { error } = await locals.supabase
			.from('product_images')
			.update({ url: newUrl.trim() })
			.eq('id', imageId);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	deleteImage: async ({ request, locals }) => {
		const formData = await request.formData();
		const imageId = formData.get('id') as string;
		const imageUrl = formData.get('url') as string;

		if (!imageId) {
			return fail(400, { error: 'Image ID required' });
		}

		// Delete from DB first
		const { error: dbError } = await locals.supabase
			.from('product_images')
			.delete()
			.eq('id', imageId);

		if (dbError) {
			return fail(500, { error: `Delete failed: ${dbError.message}` });
		}

		// Extract storage path and remove from bucket
		if (imageUrl) {
			try {
				const url = new URL(imageUrl);
				const pathMatch = url.pathname.match(/\/object\/public\/(?:product-images|files)\/(.+)/);
				if (pathMatch) {
					const bucketName = url.pathname.includes('/product-images/') ? 'product-images' : 'files';
					await locals.supabase.storage.from(bucketName).remove([pathMatch[1]]);
				}
			} catch {
				// Don't fail if storage cleanup fails
			}
		}

		return { success: true };
	},

	addOption: async ({ request, params, locals }) => {
		const { id: product_id } = params;
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();

		if (!name) return fail(400, { error: 'Option name is required' });

		// Calculate next position
		const { data: existing } = await locals.supabase
			.from('product_options')
			.select('position')
			.eq('product_id', product_id)
			.order('position', { ascending: false })
			.limit(1);

		const nextPos = existing && existing.length > 0 ? (existing[0].position ?? 0) + 1 : 0;

		const { error } = await locals.supabase.from('product_options').insert({
			product_id,
			name,
			position: nextPos
		});

		if (error) {
			if (error.code === '23505') {
				return fail(400, { error: `Option "${name}" already exists on this product.` });
			}
			return fail(500, { error: error.message });
		}

		return { success: true };
	},

	deleteOption: async ({ request, locals }) => {
		const formData = await request.formData();
		const optionId = formData.get('optionId') as string;

		if (!optionId) return fail(400, { error: 'Option ID is required' });

		const { error } = await locals.supabase.from('product_options').delete().eq('id', optionId);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	addOptionValue: async ({ request, locals }) => {
		const formData = await request.formData();
		const optionId = formData.get('optionId') as string;
		const value = (formData.get('value') as string)?.trim();

		if (!optionId || !value) return fail(400, { error: 'Option ID and value are required' });

		// Get next position
		const { data: existing } = await locals.supabase
			.from('product_option_values')
			.select('position')
			.eq('option_id', optionId)
			.order('position', { ascending: false })
			.limit(1);

		const nextPos = existing && existing.length > 0 ? (existing[0].position ?? 0) + 1 : 0;

		const { error } = await locals.supabase.from('product_option_values').insert({
			option_id: optionId,
			value,
			position: nextPos
		});

		if (error) {
			if (error.code === '23505') {
				return fail(400, { error: `Value "${value}" already exists for this option.` });
			}
			return fail(500, { error: error.message });
		}

		return { success: true };
	},

	deleteOptionValue: async ({ request, locals }) => {
		const formData = await request.formData();
		const valueId = formData.get('valueId') as string;

		if (!valueId) return fail(400, { error: 'Value ID is required' });

		const { error } = await locals.supabase
			.from('product_option_values')
			.delete()
			.eq('id', valueId);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	saveVariant: async ({ request, params, locals }) => {
		const { id: product_id } = params;
		const formData = await request.formData();

		const variantId = (formData.get('variantId') as string) || null;
		const sku = ((formData.get('sku') as string) || '').trim() || null;
		const priceStr = formData.get('price') as string;
		const comparePriceStr = formData.get('compare_at_price') as string;
		const stockStr = formData.get('stock_quantity') as string;
		const isActive = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

		const salePriceStr = formData.get('sale_price') as string;
		const saleStartsAtStr = formData.get('sale_starts_at') as string;
		const saleEndsAtStr = formData.get('sale_ends_at') as string;

		const optionValueIdsRaw = formData.getAll('optionValueIds') as string[];

		const price = parseFloat(priceStr);
		if (isNaN(price) || price < 0) {
			return fail(400, { error: 'Price must be a valid number >= 0' });
		}

		const compareAtPrice = comparePriceStr ? parseFloat(comparePriceStr) : null;
		const stockQuantity = parseInt(stockStr ?? '0', 10);
		if (isNaN(stockQuantity) || stockQuantity < 0) {
			return fail(400, { error: 'Stock quantity must be >= 0' });
		}

		const salePrice = salePriceStr && salePriceStr.trim() !== '' ? parseFloat(salePriceStr) : null;
		if (salePrice !== null) {
			if (isNaN(salePrice) || salePrice < 0) {
				return fail(400, { error: 'Sale price must be >= 0' });
			}
			if (salePrice >= price) {
				return fail(400, { error: 'Sale price must be strictly lower than regular price' });
			}
		}

		const saleStartsAt =
			saleStartsAtStr && saleStartsAtStr.trim() !== ''
				? new Date(saleStartsAtStr).toISOString()
				: null;
		const saleEndsAt =
			saleEndsAtStr && saleEndsAtStr.trim() !== '' ? new Date(saleEndsAtStr).toISOString() : null;

		if (saleStartsAt && saleEndsAt && new Date(saleEndsAt) <= new Date(saleStartsAt)) {
			return fail(400, { error: 'Sale end date must be after sale start date' });
		}

		let savedVariantId = variantId;

		if (variantId) {
			// Update variant
			const { error: updateError } = await locals.supabase
				.from('product_variants')
				.update({
					sku,
					price,
					compare_at_price: compareAtPrice,
					stock_quantity: stockQuantity,
					is_active: isActive,
					sale_price: salePrice,
					sale_starts_at: saleStartsAt,
					sale_ends_at: saleEndsAt
				})
				.eq('id', variantId);

			if (updateError) {
				return fail(500, { error: updateError.message });
			}
		} else {
			// Insert new variant
			const { data: newVariant, error: insertError } = await locals.supabase
				.from('product_variants')
				.insert({
					product_id,
					sku,
					price,
					compare_at_price: compareAtPrice,
					stock_quantity: stockQuantity,
					is_active: isActive,
					sale_price: salePrice,
					sale_starts_at: saleStartsAt,
					sale_ends_at: saleEndsAt
				})
				.select('id')
				.single();

			if (insertError) {
				return fail(500, { error: insertError.message });
			}
			savedVariantId = newVariant!.id;
		}

		// Update option values junction
		if (savedVariantId && optionValueIdsRaw.length > 0) {
			// Clean up old option values
			await locals.supabase.from('variant_option_values').delete().eq('variant_id', savedVariantId);

			// Insert new pairs
			const junctionRows = optionValueIdsRaw
				.filter((id) => Boolean(id && id.trim()))
				.map((option_value_id) => ({
					variant_id: savedVariantId!,
					option_value_id
				}));

			if (junctionRows.length > 0) {
				const { error: junctionError } = await locals.supabase
					.from('variant_option_values')
					.insert(junctionRows);

				if (junctionError) {
					console.error('Failed to link variant options:', junctionError);
				}
			}
		}

		return { success: true };
	},

	deleteVariant: async ({ request, locals }) => {
		const formData = await request.formData();
		const variantId = formData.get('variantId') as string;

		if (!variantId) return fail(400, { error: 'Variant ID is required' });

		const { error } = await locals.supabase.from('product_variants').delete().eq('id', variantId);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	}
};
