import { form, getRequestEvent } from '$app/server';
import { invalid, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const createCouponSchema = z.object({
	code: z.string().min(1, 'Code is required').toUpperCase(),
	discount_type: z.enum(['percentage', 'fixed']),
	discount_value: z
		.union([z.number(), z.string()])
		.transform((v) => Number(v))
		.refine((v) => !isNaN(v) && v >= 0, 'Discount must be positive'),
	min_order_amount: z
		.union([z.number(), z.string()])
		.optional()
		.transform((v) => {
			if (v == null || v === '') return 0;
			const n = Number(v);
			return isNaN(n) ? 0 : n;
		}),
	max_uses: z
		.union([z.number(), z.string()])
		.optional()
		.transform((v) => {
			if (v == null || v === '') return null;
			const n = parseInt(String(v), 10);
			return isNaN(n) ? null : n;
		}),
	expires_at: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	is_active: z
		.union([z.boolean(), z.string()])
		.optional()
		.transform((val) => val === true || val === 'on' || val === 'true')
});

export const createCoupon = form(createCouponSchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const { error } = await event.locals.supabase.from('coupons').insert({
		code: inputs.code,
		discount_type: inputs.discount_type,
		discount_value: inputs.discount_value,
		min_order_amount: inputs.min_order_amount ?? 0,
		max_uses: inputs.max_uses ?? null,
		expires_at: inputs.expires_at ?? null,
		is_active: inputs.is_active
	});

	if (error) {
		if (error.code === '23505') {
			invalid(issue.code('This coupon code already exists.'));
		}
		invalid(issue.code(error.message));
	}

	redirect(303, '/coupons');
});

const updateCouponSchema = z.object({
	id: z.string().uuid(),
	code: z.string().min(1, 'Code is required').toUpperCase(),
	discount_type: z.enum(['percentage', 'fixed']),
	discount_value: z
		.union([z.number(), z.string()])
		.transform((v) => Number(v))
		.refine((v) => !isNaN(v) && v >= 0, 'Discount must be positive'),
	min_order_amount: z
		.union([z.number(), z.string()])
		.optional()
		.transform((v) => {
			if (v == null || v === '') return 0;
			const n = Number(v);
			return isNaN(n) ? 0 : n;
		}),
	max_uses: z
		.union([z.number(), z.string()])
		.optional()
		.transform((v) => {
			if (v == null || v === '') return null;
			const n = parseInt(String(v), 10);
			return isNaN(n) ? null : n;
		}),
	expires_at: z
		.string()
		.optional()
		.transform((v) => (v && v.trim() !== '' ? v : null)),
	is_active: z
		.union([z.boolean(), z.string()])
		.optional()
		.transform((val) => val === true || val === 'on' || val === 'true')
});

export const updateCoupon = form(updateCouponSchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const { error } = await event.locals.supabase
		.from('coupons')
		.update({
			code: inputs.code,
			discount_type: inputs.discount_type,
			discount_value: inputs.discount_value,
			min_order_amount: inputs.min_order_amount ?? 0,
			max_uses: inputs.max_uses ?? null,
			expires_at: inputs.expires_at ?? null,
			is_active: inputs.is_active
		})
		.eq('id', inputs.id);

	if (error) {
		if (error.code === '23505') {
			invalid(issue.code('This coupon code already exists.'));
		}
		invalid(issue.code(error.message));
	}

	redirect(303, '/coupons');
});

const deleteCouponSchema = z.object({
	id: z.string().uuid()
});

export const deleteCoupon = form(deleteCouponSchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const { error } = await event.locals.supabase.from('coupons').delete().eq('id', inputs.id);

	if (error) {
		invalid(issue.id(error.message));
	}
});
