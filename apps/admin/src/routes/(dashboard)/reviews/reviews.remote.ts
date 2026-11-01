import { form, getRequestEvent } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { z } from 'zod';

const deleteReviewSchema = z.object({
	id: z.string().uuid()
});

export const deleteReview = form(deleteReviewSchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const { error } = await event.locals.supabase.from('reviews').delete().eq('id', inputs.id);

	if (error) {
		invalid(issue.id(error.message));
	}
});
