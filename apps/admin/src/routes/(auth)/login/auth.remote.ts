import { form, getRequestEvent } from '$app/server';
import { invalid, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const loginSchema = z.object({
	email: z.email('Please enter a valid email address'),
	password: z.string().min(1, 'Password is required')
});

export const login = form(loginSchema, async (inputs, issue) => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	const { error } = await event.locals.supabase.auth.signInWithPassword({
		email: inputs.email,
		password: inputs.password
	});

	if (error) {
		console.error('Supabase admin login error:', error);
		invalid(issue.email(error.message));
	}

	redirect(303, '/');
});

export const logout = form('unchecked', async () => {
	const event = getRequestEvent();
	if (!event) throw new Error('Request event not found');

	await event.locals.supabase.auth.signOut();
	redirect(303, '/login');
});
