import { form, getRequestEvent } from '$app/server';
import { invalid, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { slugify } from '@repo/utils';

const createProductSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	slug: z
		.string()
		.optional()
		.transform((v) => (v ? slugify(v) : '')),
	description: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	price: z
		.union([z.number(), z.string()])
		.transform((v) => Number(v))
		.refine((v) => !isNaN(v) && v >= 0, 'Price must be at least 0'),
	compare_at_price: z
		.union([z.number(), z.string()])
		.optional()
		.transform((v) => {
			if (v == null || v === '') return null;
			const n = Number(v);
			return isNaN(n) ? null : n;
		}),
	stock_quantity: z
		.union([z.number(), z.string()])
		.transform((v) => parseInt(String(v), 10))
		.refine((v) => !isNaN(v) && v >= 0, 'Stock cannot be negative'),
	sku: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	category_id: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	is_active: z
		.union([z.boolean(), z.string()])
		.optional()
		.transform((val) => val === true || val === 'on' || val === 'true'),
	meta_title: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	meta_description: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	og_image_url: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null))
});

export const createProduct = form(createProductSchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const slug = inputs.slug || slugify(inputs.name);
	if (!slug) {
		invalid(issue.slug('Slug is required'));
	}

	const { data: product, error } = await event.locals.supabase
		.from('products')
		.insert({
			name: inputs.name,
			slug,
			description: inputs.description,
			price: inputs.price,
			compare_at_price: inputs.compare_at_price,
			stock_quantity: inputs.stock_quantity,
			sku: inputs.sku,
			category_id: inputs.category_id,
			is_active: inputs.is_active,
			meta_title: inputs.meta_title,
			meta_description: inputs.meta_description,
			og_image_url: inputs.og_image_url
		})
		.select('id')
		.single();

	if (error) {
		if (error.code === '23505') {
			if (error.message.includes('slug')) {
				invalid(issue.slug('A product with this slug already exists.'));
			}
			if (error.message.includes('sku')) {
				invalid(issue.sku('A product with this SKU already exists.'));
			}
		}
		invalid(issue.name(error.message));
	}

	// Auto-create a default base variant so product has an immediate purchasable unit
	await event.locals.supabase.from('product_variants').insert({
		product_id: product!.id,
		sku: inputs.sku || `${slug}-DEFAULT`,
		price: inputs.price,
		compare_at_price: inputs.compare_at_price,
		stock_quantity: inputs.stock_quantity,
		is_active: inputs.is_active ?? true
	});

	// Redirect to edit page so images can be uploaded immediately
	redirect(303, `/products/${product!.id}?created=1`);
});

const updateProductSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, 'Name is required'),
	slug: z
		.string()
		.optional()
		.transform((v) => (v ? slugify(v) : '')),
	description: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	price: z
		.union([z.number(), z.string()])
		.transform((v) => Number(v))
		.refine((v) => !isNaN(v) && v >= 0, 'Price must be at least 0'),
	compare_at_price: z
		.union([z.number(), z.string()])
		.optional()
		.transform((v) => {
			if (v == null || v === '') return null;
			const n = Number(v);
			return isNaN(n) ? null : n;
		}),
	stock_quantity: z
		.union([z.number(), z.string()])
		.transform((v) => parseInt(String(v), 10))
		.refine((v) => !isNaN(v) && v >= 0, 'Stock cannot be negative'),
	sku: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	category_id: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	is_active: z
		.union([z.boolean(), z.string()])
		.optional()
		.transform((val) => val === true || val === 'on' || val === 'true'),
	meta_title: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	meta_description: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	og_image_url: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null))
});

export const updateProduct = form(updateProductSchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const slug = inputs.slug || slugify(inputs.name);
	if (!slug) {
		invalid(issue.slug('Slug is required'));
	}

	const { error } = await event.locals.supabase
		.from('products')
		.update({
			name: inputs.name,
			slug,
			description: inputs.description,
			price: inputs.price,
			compare_at_price: inputs.compare_at_price,
			stock_quantity: inputs.stock_quantity,
			sku: inputs.sku,
			category_id: inputs.category_id,
			is_active: inputs.is_active,
			meta_title: inputs.meta_title,
			meta_description: inputs.meta_description,
			og_image_url: inputs.og_image_url
		})
		.eq('id', inputs.id);

	if (error) {
		if (error.code === '23505') {
			if (error.message.includes('slug')) {
				invalid(issue.slug('A product with this slug already exists.'));
			}
			if (error.message.includes('sku')) {
				invalid(issue.sku('A product with this SKU already exists.'));
			}
		}
		invalid(issue.name(error.message));
	}

	redirect(303, '/products');
});

const deleteProductSchema = z.object({
	id: z.string().uuid()
});

export const deleteProduct = form(deleteProductSchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const { error } = await event.locals.supabase.from('products').delete().eq('id', inputs.id);

	if (error) {
		invalid(issue.id(error.message));
	}
});
