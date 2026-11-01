import { createSupabaseServerClient } from '@repo/supabase-client/server';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$app/env/public';
import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		event.cookies
	);

	/**
	 * safeGetSession validates the session by calling getUser() to confirm the JWT
	 * is still valid against Supabase Auth, rather than trusting the cookie alone.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !user) {
			// JWT validation failed or no user — treat as logged out
			return { session: null, user: null };
		}

		return { session: null, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name: string) {
			// Required so Supabase can set cookies from server responses
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
