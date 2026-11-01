import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data: coupon, error: couponError } = await locals.supabase
		.from('coupons')
		.select('*')
		.eq('id', params.id)
		.single();

	if (couponError || !coupon) {
		error(404, 'Coupon not found');
	}

	return {
		coupon
	};
};
