import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Handles the Supabase email confirmation redirect.
 * Supabase redirects here with a `code` query param after the user clicks
 * the confirmation link in their email. We exchange it for a session.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');

	if (code) {
		await locals.supabase.auth.exchangeCodeForSession(code);
	}

	redirect(303, '/');
};
