import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// POST /api/cart - Add item or update existing quantity
export const POST: RequestHandler = async ({ request, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		return json(
			{ error: 'unauthorized', message: 'Please sign in to add items to your cart' },
			{ status: 401 }
		);
	}

	try {
		const { variantId, quantity = 1 } = await request.json();
		if (!variantId) {
			return json({ error: 'missing_variantId', message: 'Variant ID is required' }, { status: 400 });
		}

		// Verify variant exists and is active, along with its parent product
		const { data: variant, error: variantError } = await locals.supabase
			.from('product_variants')
			.select('id, product_id, stock_quantity, is_active, products(id, name, is_active)')
			.eq('id', variantId)
			.single();

		const parentProduct = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;

		if (variantError || !variant || !variant.is_active || !parentProduct || !parentProduct.is_active) {
			return json({ error: 'not_found', message: 'Product variant is unavailable' }, { status: 404 });
		}

		if (variant.stock_quantity <= 0) {
			return json({ error: 'out_of_stock', message: 'This product variant is currently out of stock' }, { status: 400 });
		}

		// Check if variant is already in user's cart
		const { data: existingItem } = await locals.supabase
			.from('cart_items')
			.select('id, quantity')
			.eq('user_id', user.id)
			.eq('variant_id', variantId)
			.maybeSingle();

		let finalQuantity = quantity;

		if (existingItem) {
			finalQuantity = (existingItem.quantity || 1) + quantity;
			// Limit to stock quantity of variant
			if (finalQuantity > variant.stock_quantity) {
				finalQuantity = variant.stock_quantity;
			}

			const { error: updateError } = await locals.supabase
				.from('cart_items')
				.update({ quantity: finalQuantity })
				.eq('id', existingItem.id);

			if (updateError) throw updateError;
		} else {
			if (finalQuantity > variant.stock_quantity) {
				finalQuantity = variant.stock_quantity;
			}

			const { error: insertError } = await locals.supabase
				.from('cart_items')
				.insert({
					user_id: user.id,
					variant_id: variantId,
					product_id: variant.product_id,
					quantity: Math.max(1, finalQuantity)
				});

			if (insertError) throw insertError;
		}

		// Compute updated total cart count for the user
		const { data: allItems } = await locals.supabase
			.from('cart_items')
			.select('quantity')
			.eq('user_id', user.id);

		const totalCount = allItems ? allItems.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

		return json({
			success: true,
			message: `Added "${parentProduct.name}" to cart`,
			cartCount: totalCount
		});
	} catch (err: any) {
		return json({ error: 'server_error', message: err.message || 'Failed to update cart' }, { status: 500 });
	}
};

// PATCH /api/cart - Set exact quantity
export const PATCH: RequestHandler = async ({ request, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		return json({ error: 'unauthorized', message: 'Please sign in' }, { status: 401 });
	}

	try {
		const { cartItemId, quantity } = await request.json();
		if (!cartItemId) {
			return json({ error: 'missing_id', message: 'Cart item ID is required' }, { status: 400 });
		}

		if (quantity <= 0) {
			// Delete if 0 or negative
			await locals.supabase.from('cart_items').delete().eq('id', cartItemId).eq('user_id', user.id);
		} else {
			await locals.supabase
				.from('cart_items')
				.update({ quantity })
				.eq('id', cartItemId)
				.eq('user_id', user.id);
		}

		const { data: allItems } = await locals.supabase
			.from('cart_items')
			.select('quantity')
			.eq('user_id', user.id);

		const totalCount = allItems ? allItems.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

		return json({ success: true, cartCount: totalCount });
	} catch (err: any) {
		return json({ error: 'server_error', message: err.message }, { status: 500 });
	}
};

// DELETE /api/cart - Remove item
export const DELETE: RequestHandler = async ({ request, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) {
		return json({ error: 'unauthorized', message: 'Please sign in' }, { status: 401 });
	}

	try {
		const { cartItemId } = await request.json();
		if (!cartItemId) {
			return json({ error: 'missing_id', message: 'Cart item ID is required' }, { status: 400 });
		}

		const { error } = await locals.supabase
			.from('cart_items')
			.delete()
			.eq('id', cartItemId)
			.eq('user_id', user.id);

		if (error) throw error;

		const { data: allItems } = await locals.supabase
			.from('cart_items')
			.select('quantity')
			.eq('user_id', user.id);

		const totalCount = allItems ? allItems.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

		return json({ success: true, cartCount: totalCount });
	} catch (err: any) {
		return json({ error: 'server_error', message: err.message }, { status: 500 });
	}
};
