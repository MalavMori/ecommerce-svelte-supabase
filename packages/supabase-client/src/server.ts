import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Minimal subset of SvelteKit's Cookies interface that we need.
 * Compatible with both SvelteKit 2 and SvelteKit 3.
 */
export interface SvelteKitCookies {
	getAll(opts?: Record<string, unknown>): Array<{ name: string; value: string }>;
	set(name: string, value: string, opts: Record<string, unknown>): void;
}

export function createSupabaseServerClient(
	url: string,
	anonKey: string,
	cookies: SvelteKitCookies
) {
	return createServerClient<Database>(url, anonKey, {
		cookies: {
			getAll() {
				return cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					// SvelteKit's set requires an `opts` object; pass options (with required path default)
					cookies.set(name, value, { path: '/', ...options });
				});
			}
		}
	});
}

export function createSupabaseServiceClient(url: string, serviceRoleKey: string) {
	return createClient<Database>(url, serviceRoleKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});
}
