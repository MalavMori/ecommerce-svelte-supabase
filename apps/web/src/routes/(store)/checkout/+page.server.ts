import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getEffectivePrice } from '$lib/server/prices';
import { formatCurrency } from '@repo/utils';

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	const { user } = await locals.safeGetSession();

	if (!user) {
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	// 1. Fetch user's cart items
	const { data: cartData } = await locals.supabase
		.from('cart_items')
		.select(
			`
			id,
			quantity,
			product_id,
			variant_id,
			product_variants (
				id,
				price,
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
				stock_quantity,
				sku,
				is_active,
				product_images (url, position)
			)
		`
		)
		.eq('user_id', user.id);

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
				const sortedImages = [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
				const basePrice = v ? Number(v.price) : Number(p.price);
				const { effectivePrice, isOnSale } = await getEffectivePrice(
					locals.supabase,
					v?.id || item.variant_id,
					basePrice
				);

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

				return {
					id: item.id,
					productId: p.id,
					variantId: item.variant_id || v?.id || null,
					variantLabel,
					name: p.name,
					slug: p.slug,
					sku: v?.sku || p.sku,
					price: effectivePrice,
					effectivePrice,
					isOnSale,
					quantity: item.quantity,
					lineTotal: effectivePrice * item.quantity,
					imageUrl: sortedImages[0]?.url || null
				};
			})
	);

	if (items.length === 0) {
		redirect(303, '/cart');
	}

	// 2. Fetch saved addresses
	const { data: addresses } = await locals.supabase
		.from('addresses')
		.select('*')
		.eq('user_id', user.id)
		.order('is_default', { ascending: false });

	// 3. Fetch user profile
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.maybeSingle();

	// 4. Calculations & Coupon
	const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
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

	const shippingAmount = subtotal >= 100 ? 0 : 15;
	const total = Math.max(0, Math.round((subtotal - discountAmount + shippingAmount) * 100) / 100);

	return {
		user,
		profile,
		addresses: addresses ?? [],
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
	},
	placeOrder: async ({ request, locals, cookies, url }) => {
		const { user } = await locals.safeGetSession();
		if (!user) {
			return fail(401, { message: 'You must be signed in to complete checkout' });
		}

		const formData = await request.formData();
		let addressId = (formData.get('addressId') as string)?.trim();
		const couponCode = (formData.get('couponCode') as string)?.trim().toUpperCase();

		// Handle new address creation if requested
		const isNewAddress = formData.get('isNewAddress') === 'true';
		if (isNewAddress) {
			const line1 = (formData.get('line1') as string)?.trim();
			const line2 = (formData.get('line2') as string)?.trim() || null;
			const city = (formData.get('city') as string)?.trim();
			const state = (formData.get('state') as string)?.trim() || null;
			const postalCode = (formData.get('postalCode') as string)?.trim();
			const country = (formData.get('country') as string)?.trim() || 'US';
			const label = (formData.get('label') as string)?.trim() || 'Shipping Address';

			if (!line1 || !city || !postalCode) {
				return fail(400, { message: 'Please fill out all required address fields (Street, City, Postal Code)' });
			}

			const { data: newAddress, error: addrError } = await locals.supabase
				.from('addresses')
				.insert({
					user_id: user.id,
					line1,
					line2,
					city,
					state,
					postal_code: postalCode,
					country,
					label,
					is_default: false
				})
				.select()
				.single();

			if (addrError || !newAddress) {
				return fail(500, { message: addrError?.message || 'Failed to save new shipping address' });
			}
			addressId = newAddress.id;
		}

		if (!addressId) {
			return fail(400, { message: 'Please select or enter a shipping address' });
		}

		// 1. Fetch current cart items with latest variant & product prices & stock
		const { data: cartData, error: cartErr } = await locals.supabase
			.from('cart_items')
			.select(
				`
				id,
				quantity,
				product_id,
				variant_id,
				product_variants (
					id,
					price,
					stock_quantity,
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
					price,
					stock_quantity,
					is_active
				)
			`
			)
			.eq('user_id', user.id);

		if (cartErr || !cartData || cartData.length === 0) {
			return fail(400, { message: 'Your cart is empty' });
		}

		// 2. Validate stock for every item
		for (const item of cartData) {
			const p = item.products as any;
			const v = item.product_variants as any;
			const isProductActive = p && p.is_active;
			const isVariantActive = v ? v.is_active : true;
			const stockAvailable = v ? v.stock_quantity : (p ? p.stock_quantity : 0);

			if (!isProductActive || !isVariantActive || stockAvailable < item.quantity) {
				return fail(400, {
					message: `Sorry, "${p?.name || 'an item'}" does not have enough stock (${stockAvailable} left). Please adjust your cart.`
				});
			}
		}

		// 3. Compute totals using effective_price
		let subtotal = 0;
		const itemPrices: Map<string, number> = new Map();
		for (const item of cartData) {
			const p = item.products as any;
			const v = item.product_variants as any;
			const basePrice = v ? Number(v.price) : Number(p.price);
			const { effectivePrice } = await getEffectivePrice(
				locals.supabase,
				v?.id || item.variant_id,
				basePrice
			);
			itemPrices.set(item.id, effectivePrice);
			subtotal += effectivePrice * item.quantity;
		}
		subtotal = Math.round(subtotal * 100) / 100;

		let couponId: string | null = null;
		let discountAmount = 0;

		if (couponCode) {
			const { data: coupon } = await locals.supabase
				.from('coupons')
				.select('*')
				.eq('code', couponCode)
				.eq('is_active', true)
				.maybeSingle();

			if (
				coupon &&
				(!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) &&
				(!coupon.max_uses || (coupon.used_count || 0) < coupon.max_uses) &&
				(!coupon.min_order_amount || subtotal >= Number(coupon.min_order_amount))
			) {
				couponId = coupon.id;
				const discountVal = Number(coupon.discount_value);
				if (coupon.discount_type === 'percentage') {
					discountAmount = Math.round((subtotal * (discountVal / 100)) * 100) / 100;
				} else {
					discountAmount = Math.min(subtotal, discountVal);
				}
			}
		}

		const shippingAmount = subtotal >= 100 ? 0 : 15;
		// Must strictly satisfy trigger trg_validate_order_total
		const total = Math.round((subtotal - discountAmount + shippingAmount) * 100) / 100;

		// 4. Decrement stock for all items using variant ID
		for (const item of cartData) {
			const targetVariantId = item.variant_id || item.product_variants?.id;
			if (targetVariantId) {
				await locals.supabase.rpc('decrement_stock', {
					p_variant_id: targetVariantId,
					p_quantity: item.quantity
				});
			}
		}

		// 5. Redeem coupon if applicable
		if (couponId) {
			await locals.supabase.rpc('redeem_coupon', {
				p_coupon_id: couponId
			});
		}

		// 6. Snapshot display currency and compute display total via convert_price RPC
		const cookieCurrency = cookies.get('selected_currency');
		const displayCurrencyCode = cookieCurrency || 'INR';
		let displayTotal: number | null = null;

		if (displayCurrencyCode) {
			const { data: conv } = await locals.supabase.rpc('convert_price', {
				p_amount: total,
				p_target_currency: displayCurrencyCode
			});
			displayTotal = conv != null ? Number(conv) : total;
		}

		// 7. Payment method handling
		const paymentMethod = ((formData.get('paymentMethod') as string) || 'card').toLowerCase();
		const paymentDetails = (formData.get('paymentDetails') as string) || '';

		// Insert Order
		const { data: order, error: orderError } = await locals.supabase
			.from('orders')
			.insert({
				user_id: user.id,
				address_id: addressId,
				coupon_id: couponId,
				status: 'paid',
				payment_status: 'paid',
				subtotal,
				discount_amount: discountAmount,
				shipping_amount: shippingAmount,
				total,
				display_currency_code: displayCurrencyCode,
				display_total: displayTotal
			})
			.select()
			.single();

		if (orderError || !order) {
			console.error('Order creation error:', orderError);
			return fail(500, { message: orderError?.message || 'Failed to place order' });
		}

		// 8. Insert Order Items snapshots
		const orderItemsPayload = cartData.map((item: any) => {
			const p = item.products as any;
			const v = item.product_variants as any;
			const unitPrice = itemPrices.get(item.id) ?? (v ? Number(v.price) : Number(p.price));

			let variantLabel: string | null = null;
			if (v?.variant_option_values?.length) {
				variantLabel = v.variant_option_values
					.map((vov: any) => {
						const optName = vov.product_option_values?.product_options?.name;
						const val = vov.product_option_values?.value;
						return optName && val ? `${optName}: ${val}` : val;
					})
					.filter(Boolean)
					.join(', ') || null;
			}

			return {
				order_id: order.id,
				product_id: p.id,
				variant_id: item.variant_id || v?.id || null,
				variant_label: variantLabel,
				product_name: p.name,
				unit_price: unitPrice,
				quantity: item.quantity,
				line_total: Math.round(unitPrice * item.quantity * 100) / 100
			};
		});

		const { error: itemsError } = await locals.supabase
			.from('order_items')
			.insert(orderItemsPayload);

		if (itemsError) {
			console.error('Failed to create order items snapshot:', itemsError);
		}

		// 9. Clear cart
		await locals.supabase.from('cart_items').delete().eq('user_id', user.id);

		// Redirect to confirmation with payment info
		const successUrl = new URL(`/checkout/success`, url.origin);
		successUrl.searchParams.set('order', order.id);
		successUrl.searchParams.set('method', paymentMethod);
		if (paymentDetails) {
			successUrl.searchParams.set('details', paymentDetails);
		}
		redirect(303, successUrl.pathname + successUrl.search);
	}
};
