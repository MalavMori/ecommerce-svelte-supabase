// packages/types/src/index.ts
import type {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductImage,
  Category,
  CategoryInsert,
  CartItem,
  CartItemInsert,
  Coupon,
  Order,
  OrderInsert,
  OrderItem,
  OrderItemInsert,
  Review,
  ReviewInsert,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Address,
  AddressInsert,
  ProductOption,
  ProductOptionInsert,
  ProductOptionValue,
  ProductOptionValueInsert,
  ProductVariant,
  ProductVariantInsert,
  ProductVariantUpdate,
  VariantOptionValue,
  VariantOptionValueInsert,
  Currency,
  StoreSetting,
  ExchangeRate,
  Wishlist,
  WishlistInsert,
  OrderStatusHistory,
  OrderStatusHistoryInsert,
  Shipment,
  ShipmentInsert,
  Return,
  ReturnInsert,
  ReviewImage,
  ReviewImageInsert,
  Banner,
  BannerInsert,
  FeaturedCollection,
  FeaturedCollectionInsert,
  FeaturedProduct,
  FeaturedProductInsert,
  Page,
  PageInsert,
} from '@repo/supabase-client/types';

// Re-export the raw DB shapes so consumers only need one import path
export type {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductImage,
  Category,
  CategoryInsert,
  CartItem,
  CartItemInsert,
  Coupon,
  Order,
  OrderInsert,
  OrderItem,
  OrderItemInsert,
  Review,
  ReviewInsert,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Address,
  AddressInsert,
  ProductOption,
  ProductOptionInsert,
  ProductOptionValue,
  ProductOptionValueInsert,
  ProductVariant,
  ProductVariantInsert,
  ProductVariantUpdate,
  VariantOptionValue,
  VariantOptionValueInsert,
  Currency,
  StoreSetting,
  ExchangeRate,
  Wishlist,
  WishlistInsert,
  OrderStatusHistory,
  OrderStatusHistoryInsert,
  Shipment,
  ShipmentInsert,
  Return,
  ReturnInsert,
  ReviewImage,
  ReviewImageInsert,
  Banner,
  BannerInsert,
  FeaturedCollection,
  FeaturedCollectionInsert,
  FeaturedProduct,
  FeaturedProductInsert,
  Page,
  PageInsert,
};

// ---- App-level types that are NOT database tables ----

// A product as displayed on a listing page: DB row + derived UI fields
export interface ProductCard extends Product {
  primaryImageUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  defaultVariantId?: string | null;
}

// Resolved option value for variant display (e.g. { optionName: "Color", value: "Red" })
export interface ResolvedOptionValue {
  optionName: string;
  value: string;
}

// A variant with its resolved option values
export interface VariantWithOptions extends ProductVariant {
  options: ResolvedOptionValue[];
}

// Product joined with its variants array
export interface ProductWithVariants extends Product {
  variants: VariantWithOptions[];
}

// Client-side cart state (before it becomes real cart_items rows)
export interface CartLineItem {
  product: Product;
  variantId: string;
  variantLabel: string;
  variantPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CartSummary {
  items: CartLineItem[];
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  appliedCoupon: Coupon | null;
}

// Checkout form shape (maps to multiple tables on submit: orders + order_items)
export interface CheckoutFormData {
  addressId: string;
  couponCode: string | null;
  items: { variantId: string; quantity: number }[];
}

// API response shape for a full order detail page (order + joined items)
export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// Formatted display price for multi-currency display
export interface DisplayPrice {
  amount: number;
  currencyCode: string;
  formatted: string;
}

// Product as returned by list/catalog queries — effectivePrice replaces raw price for flash-sale safety
export interface ProductListItem extends Omit<Product, 'price'> {
  effectivePrice: number;
  compareAtPrice: number | null;
  primaryImageUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  defaultVariantId: string | null;
  isOnSale: boolean;
}

// Structured homepage payload combining banners, collections, and segmented products
export interface HomepageContent {
  banners: Banner[];
  featuredCollections: (FeaturedCollection & { category: Category })[];
  featuredProductSections: {
    featured: ProductListItem[];
    new_arrivals: ProductListItem[];
    best_sellers: ProductListItem[];
    trending: ProductListItem[];
  };
}

// Complete order detail view with joined shipments, status audit trail, and return status
export interface OrderWithDetails extends Order {
  items: (OrderItem & {
    variant_label: string | null;
    variant_id: string | null;
  })[];
  shipments: Shipment[];
  statusHistory: OrderStatusHistory[];
  returnRequest: Return | null;
}

// Static content page (about, contact, terms, privacy, etc.)
export type StaticPage = Page;