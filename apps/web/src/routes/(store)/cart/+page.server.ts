import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getEffectivePrice } from '$lib/server/prices';
import { formatCurrency } from '@repo/utils';

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		return {
			user: null,
			items: [],
			subtotal: 0,
			discountAmount: 0,
			shippingAmount: 0,
			total: 0,
			appliedCoupon: null,
			couponError: null
		};
	}

	// Fetch user's cart items joined with product and variant details
	const { data: cartData, error } = await locals.supabase
		.from('cart_items')
		.select(
			`
			id,
			quantity,
			variant_id,
			product_id,
			created_at,
			product_variants (
				id,
				price,
				sale_price,
				compare_at_price,
				stock_quantity,
				sku,
				is_active,
				variant_option_values (
					product_option_values (
						value,
						product_options (name)
					)
				)
			),
			products (
				id,
				name,
				slug,
				price,
				compare_at_price,
				stock_quantity,
				sku,
				is_active,
				product_images (url, position)
			)
		`
		)
		.eq('user_id', user.id)
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Error fetching cart items:', error);
	}

	// Process cart items with effective pricing
	const items = await Promise.all(
		(cartData ?? [])
			.filter((item: any) => {
				const productActive = item.products && item.products.is_active;
				const variantActive = item.product_variants ? item.product_variants.is_active : true;
				return productActive && variantActive;
			})
			.map(async (item: any) => {
				const p = item.products;
				const v = item.product_variants;
				const images = p.product_images || [];
				const sortedImages = [...images].sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
				const imageUrl = sortedImages[0]?.url || null;

				const basePrice = v ? Number(v.price) : Number(p.price);
				const { effectivePrice, isOnSale } = await getEffectivePrice(
					locals.supabase,
					v?.id || item.variant_id,
					basePrice
				);

				const compareAtPrice =
					v?.compare_at_price != null
						? Number(v.compare_at_price)
						: p.compare_at_price != null
							? Number(p.compare_at_price)
							: null;
				const stockQuantity = v ? v.stock_quantity : p.stock_quantity;
				const sku = v?.sku || p.sku;

				// Build variant label (e.g. "Color: Red, Size: Large")
				let variantLabel = '';
				if (v?.variant_option_values?.length) {
					variantLabel = v.variant_option_values
						.map((vov: any) => {
							const optName = vov.product_option_values?.product_options?.name;
							const val = vov.product_option_values?.value;
							return optName && val ? `${optName}: ${val}` : val;
						})
						.filter(Boolean)
						.join(', ');
				}

				const lineTotal = effectivePrice * item.quantity;

				return {
					id: item.id,
					productId: p.id,
					variantId: item.variant_id || v?.id || null,
					variantLabel,
					name: p.name,
					slug: p.slug,
					sku,
					price: effectivePrice,
					effectivePrice,
					isOnSale,
					compareAtPrice,
					quantity: item.quantity,
					stockQuantity,
					lineTotal,
					imageUrl
				};
			})
	);

	const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

	// Check coupon param
	const couponCodeParam = url.searchParams.get('coupon')?.trim().toUpperCase();
	let appliedCoupon: any = null;
	let couponError: string | null = null;
	let discountAmount = 0;

	if (couponCodeParam && subtotal > 0) {
		const { data: coupon, error: coupErr } = await locals.supabase
			.from('coupons')
			.select('*')
			.eq('code', couponCodeParam)
			.eq('is_active', true)
			.maybeSingle();

		if (coupErr || !coupon) {
			couponError = `Coupon code "${couponCodeParam}" is invalid or expired`;
		} else if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
			couponError = `Coupon code "${couponCodeParam}" has expired`;
		} else if (coupon.max_uses && (coupon.used_count || 0) >= coupon.max_uses) {
			couponError = `Coupon code "${couponCodeParam}" has reached its maximum usage limit`;
		} else if (coupon.min_order_amount && subtotal < Number(coupon.min_order_amount)) {
			const cookieCurrency = cookies.get('selected_currency') || 'INR';
			couponError = `Minimum order amount of ${formatCurrency(Number(coupon.min_order_amount), cookieCurrency)} required for this coupon`;
		} else {
			// Valid coupon
			appliedCoupon = coupon;
			const discountVal = Number(coupon.discount_value);
			if (coupon.discount_type === 'percentage') {
				discountAmount = Math.round((subtotal * (discountVal / 100)) * 100) / 100;
			} else {
				discountAmount = Math.min(subtotal, discountVal);
			}
		}
	}

	// Shipping: Free if subtotal >= 100 or cart is empty
	const shippingAmount = subtotal >= 100 || subtotal === 0 ? 0 : 15;
	const total = Math.max(0, Math.round((subtotal - discountAmount + shippingAmount) * 100) / 100);

	return {
		user,
		items,
		subtotal: Math.round(subtotal * 100) / 100,
		discountAmount,
		shippingAmount,
		total,
		appliedCoupon,
		couponError
	};
};

export const actions: Actions = {
	applyCoupon: async ({ request, url }) => {
		const formData = await request.formData();
		const code = (formData.get('code') as string)?.trim();
		if (!code) {
			return fail(400, { couponMessage: 'Please enter a coupon code' });
		}
		const newUrl = new URL(url);
		newUrl.searchParams.set('coupon', code.toUpperCase());
		redirect(303, newUrl.pathname + newUrl.search);
	},
	removeCoupon: async ({ url }) => {
		const newUrl = new URL(url);
		newUrl.searchParams.delete('coupon');
		redirect(303, newUrl.pathname + newUrl.search);
	}
};
