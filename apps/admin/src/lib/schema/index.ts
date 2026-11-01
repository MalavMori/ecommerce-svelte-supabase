import { z } from 'zod';

// ============================================
// PROFILES
// ============================================
export const profileSchema = z.object({
	id: z.string().uuid(),
	full_name: z.string().nullable(),
	phone: z.string().nullable(),
	avatar_url: z.string().nullable(),
	role: z.enum(['customer', 'admin']).default('customer'),
	created_at: z.string().nullable()
});

// ============================================
// ADDRESSES
// ============================================
export const addressSchema = z.object({
	id: z.string().uuid(),
	user_id: z.string().uuid(),
	label: z.string().nullable(),
	line1: z.string(),
	line2: z.string().nullable(),
	city: z.string(),
	state: z.string().nullable(),
	postal_code: z.string(),
	country: z.string(),
	is_default: z.boolean().nullable(),
	created_at: z.string().nullable()
});

// ============================================
// CATEGORIES
// ============================================
export const categorySchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	slug: z.string(),
	parent_id: z.string().uuid().nullable(),
	created_at: z.string().nullable()
});

// ============================================
// PRODUCTS
// ============================================
export const productSchema = z.object({
	id: z.string().uuid(),
	category_id: z.string().uuid().nullable(),
	name: z.string(),
	slug: z.string(),
	description: z.string().nullable(),
	price: z.number().min(0),
	compare_at_price: z.number().nullable(),
	stock_quantity: z.number().int().min(0),
	sku: z.string().nullable(),
	is_active: z.boolean().nullable(),
	meta_title: z.string().nullable(),
	meta_description: z.string().nullable(),
	og_image_url: z.string().nullable(),
	created_at: z.string().nullable(),
	updated_at: z.string().nullable()
});

// ============================================
// PRODUCT OPTIONS & VALUES
// ============================================
export const productOptionSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	name: z.string(),
	position: z.number().int().nullable(),
	created_at: z.string().nullable()
});

export const productOptionValueSchema = z.object({
	id: z.string().uuid(),
	option_id: z.string().uuid(),
	value: z.string(),
	position: z.number().int().nullable(),
	created_at: z.string().nullable()
});

// ============================================
// PRODUCT VARIANTS
// ============================================
export const productVariantSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	sku: z.string().nullable(),
	price: z.number().min(0),
	compare_at_price: z.number().nullable(),
	stock_quantity: z.number().int().min(0),
	is_active: z.boolean().nullable(),
	sale_price: z.number().nullable(),
	sale_starts_at: z.string().nullable(),
	sale_ends_at: z.string().nullable(),
	created_at: z.string().nullable(),
	updated_at: z.string().nullable()
});

export const variantOptionValueSchema = z.object({
	variant_id: z.string().uuid(),
	option_value_id: z.string().uuid()
});

// ============================================
// PRODUCT IMAGES
// ============================================
export const productImageSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	variant_id: z.string().uuid().nullable(),
	url: z.string(),
	position: z.number().int().nullable(),
	created_at: z.string().nullable()
});

// ============================================
// CART ITEMS
// ============================================
export const cartItemSchema = z.object({
	id: z.string().uuid(),
	user_id: z.string().uuid(),
	product_id: z.string().uuid().nullable(),
	variant_id: z.string().uuid().nullable(),
	quantity: z.number().int().positive(),
	created_at: z.string().nullable()
});

// ============================================
// COUPONS
// ============================================
export const couponSchema = z.object({
	id: z.string().uuid(),
	code: z.string(),
	discount_type: z.enum(['percentage', 'fixed']),
	discount_value: z.number(),
	min_order_amount: z.number().nullable(),
	max_uses: z.number().int().nullable(),
	used_count: z.number().int().nullable(),
	expires_at: z.string().nullable(),
	is_active: z.boolean().nullable(),
	created_at: z.string().nullable()
});

// ============================================
// ORDERS & ORDER ITEMS
// ============================================
export const orderSchema = z.object({
	id: z.string().uuid(),
	user_id: z.string().uuid().nullable(),
	address_id: z.string().uuid().nullable(),
	coupon_id: z.string().uuid().nullable(),
	status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
	subtotal: z.number(),
	discount_amount: z.number().nullable(),
	shipping_amount: z.number().nullable(),
	total: z.number(),
	payment_status: z.enum(['unpaid', 'paid', 'refunded']).nullable(),
	stripe_payment_intent_id: z.string().nullable(),
	stripe_customer_id: z.string().nullable(),
	display_currency_code: z.string().nullable(),
	display_total: z.number().nullable(),
	created_at: z.string().nullable()
});

export const orderItemSchema = z.object({
	id: z.string().uuid(),
	order_id: z.string().uuid(),
	product_id: z.string().uuid().nullable(),
	variant_id: z.string().uuid().nullable(),
	product_name: z.string(),
	variant_label: z.string().nullable(),
	unit_price: z.number(),
	quantity: z.number().int().positive(),
	line_total: z.number()
});

export const orderStatusHistorySchema = z.object({
	id: z.string().uuid(),
	order_id: z.string().uuid(),
	status: z.string(),
	changed_by: z.string().uuid().nullable(),
	created_at: z.string().nullable()
});

// ============================================
// SHIPMENTS & RETURNS
// ============================================
export const shipmentSchema = z.object({
	id: z.string().uuid(),
	order_id: z.string().uuid(),
	carrier: z.string().nullable(),
	tracking_number: z.string().nullable(),
	status: z.enum(['pending', 'shipped', 'in_transit', 'delivered', 'failed']),
	shipped_at: z.string().nullable(),
	delivered_at: z.string().nullable(),
	estimated_delivery: z.string().nullable(),
	created_at: z.string().nullable()
});

export const returnSchema = z.object({
	id: z.string().uuid(),
	order_id: z.string().uuid(),
	user_id: z.string().uuid().nullable(),
	reason: z.string(),
	status: z.enum(['requested', 'approved', 'rejected', 'refunded']),
	refund_amount: z.number().nullable(),
	stripe_refund_id: z.string().nullable(),
	requested_at: z.string().nullable(),
	resolved_at: z.string().nullable()
});

// ============================================
// REVIEWS & REVIEW IMAGES
// ============================================
export const reviewSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	user_id: z.string().uuid(),
	rating: z.number().int().min(1).max(5),
	comment: z.string().nullable(),
	is_verified_purchase: z.boolean(),
	created_at: z.string().nullable()
});

export const reviewImageSchema = z.object({
	id: z.string().uuid(),
	review_id: z.string().uuid(),
	url: z.string(),
	position: z.number().int().nullable(),
	created_at: z.string().nullable()
});

// ============================================
// BANNERS, PAGES & CURATED CONTENT
// ============================================
export const bannerSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	subtitle: z.string().nullable(),
	image_url: z.string(),
	link_url: z.string().nullable(),
	position: z.number().int(),
	is_active: z.boolean(),
	starts_at: z.string().nullable(),
	ends_at: z.string().nullable(),
	created_at: z.string().nullable(),
	updated_at: z.string().nullable()
});

export const pageSchema = z.object({
	id: z.string().uuid(),
	slug: z.string(),
	title: z.string(),
	content: z.string(),
	meta_title: z.string().nullable(),
	meta_description: z.string().nullable(),
	is_published: z.boolean(),
	created_at: z.string().nullable(),
	updated_at: z.string().nullable()
});

export const featuredCollectionSchema = z.object({
	id: z.string().uuid(),
	category_id: z.string().uuid(),
	label: z.string().nullable(),
	image_url: z.string().nullable(),
	position: z.number().int(),
	is_active: z.boolean(),
	created_at: z.string().nullable()
});

export const featuredProductSchema = z.object({
	id: z.string().uuid(),
	product_id: z.string().uuid(),
	section: z.enum(['featured', 'new_arrivals', 'best_sellers', 'trending']),
	position: z.number().int(),
	is_active: z.boolean(),
	created_at: z.string().nullable()
});

// ============================================
// CURRENCIES & STORE SETTINGS
// ============================================
export const currencySchema = z.object({
	code: z.string().length(3),
	name: z.string(),
	symbol: z.string(),
	decimal_digits: z.number().int(),
	is_active: z.boolean().nullable()
});

export const storeSettingsSchema = z.object({
	id: z.boolean(),
	base_currency_code: z.string().length(3)
});
export const storeSettingSchema = storeSettingsSchema;

export const exchangeRateSchema = z.object({
	currency_code: z.string().length(3),
	rate_to_base: z.number().positive(),
	updated_at: z.string().nullable()
});

export const wishlistSchema = z.object({
	id: z.string().uuid(),
	user_id: z.string().uuid(),
	product_id: z.string().uuid(),
	created_at: z.string().nullable()
});
