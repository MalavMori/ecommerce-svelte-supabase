import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	// Load all public categories for navigation
	const { data: categories } = await locals.supabase
		.from('categories')
		.select('*')
		.order('name');

	let profile = null;
	let cartCount = 0;

	if (user) {
		// Load profile info
		const { data: profileData } = await locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.maybeSingle();
		profile = profileData;

		// Load user's cart item count (sum of quantities or total item rows)
		const { data: cartItems } = await locals.supabase
			.from('cart_items')
			.select('quantity')
			.eq('user_id', user.id);

		if (cartItems) {
			cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
		}
	}

	return {
		session,
		user,
		profile,
		cartCount,
		categories: categories ?? []
	};
};
