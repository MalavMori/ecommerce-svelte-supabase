import { form, getRequestEvent } from '$app/server';
import { invalid, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { slugify } from '@repo/utils';

const createCategorySchema = z.object({
	name: z.string().min(1, 'Name is required'),
	slug: z
		.string()
		.optional()
		.transform((v) => (v ? slugify(v) : '')),
	parent_id: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null))
});

export const createCategory = form(createCategorySchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const slug = inputs.slug || slugify(inputs.name);
	if (!slug) {
		invalid(issue.slug('Slug is required'));
	}

	const { error } = await event.locals.supabase.from('categories').insert({
		name: inputs.name,
		slug,
		parent_id: inputs.parent_id
	});

	if (error) {
		if (error.code === '23505') {
			invalid(issue.slug('A category with this slug already exists.'));
		}
		invalid(issue.name(error.message));
	}

	redirect(303, '/categories');
});

const updateCategorySchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, 'Name is required'),
	slug: z
		.string()
		.optional()
		.transform((v) => (v ? slugify(v) : '')),
	parent_id: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null))
});

export const updateCategory = form(updateCategorySchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const slug = inputs.slug || slugify(inputs.name);
	if (!slug) {
		invalid(issue.slug('Slug is required'));
	}

	const { error } = await event.locals.supabase
		.from('categories')
		.update({
			name: inputs.name,
			slug,
			parent_id: inputs.parent_id
		})
		.eq('id', inputs.id);

	if (error) {
		if (error.code === '23505') {
			invalid(issue.slug('A category with this slug already exists.'));
		}
		invalid(issue.name(error.message));
	}

	redirect(303, '/categories');
});

const deleteCategorySchema = z.object({
	id: z.string().uuid()
});

export const deleteCategory = form(deleteCategorySchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const { error } = await event.locals.supabase.from('categories').delete().eq('id', inputs.id);

	if (error) {
		invalid(issue.id(error.message));
	}
});
