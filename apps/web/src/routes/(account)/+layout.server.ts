import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	// Fetch user profile
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.maybeSingle();

	// Fetch categories for navbar
	const { data: categories } = await locals.supabase
		.from('categories')
		.select('*')
		.order('name');

	// Fetch cart count
	const { data: cartItems } = await locals.supabase
		.from('cart_items')
		.select('quantity')
		.eq('user_id', user.id);

	const cartCount = cartItems
		? cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
		: 0;

	return {
		user,
		profile,
		categories: categories ?? [],
		cartCount
	};
};
