import { form, getRequestEvent } from '$app/server';
import { invalid, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const updateOrderStatusSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
});

export const updateOrderStatus = form(updateOrderStatusSchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const { error } = await event.locals.supabase
		.from('orders')
		.update({ status: inputs.status })
		.eq('id', inputs.id);

	if (error) {
		invalid(issue.status(error.message));
	}

	redirect(303, `/orders/${inputs.id}`);
});
