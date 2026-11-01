import { form, getRequestEvent } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { z } from 'zod';

const signupSchema = z
	.object({
		name: z.string().min(2, 'Name must be at least 2 characters'),
		email: z.email('Please enter a valid email address'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string().min(1, 'Please confirm your password')
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

export const signup = form(signupSchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const { error } = await event.locals.supabase.auth.signUp({
		email: inputs.email,
		password: inputs.password,
		options: {
			data: {
				full_name: inputs.name
			},
			emailRedirectTo: `${event.url.origin}/auth/callback`
		}
	});

	if (error) {
		console.error('Supabase signup error:', error);
		invalid(issue.email(error.message));
	}

	// Return a signal that signup was successful (email confirmation sent).
	// The page component reads this via a reactive check.
	return { success: true };
});
