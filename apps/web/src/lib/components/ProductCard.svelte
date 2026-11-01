<script lang="ts">
	import { ShoppingBag, LoaderCircle, Heart } from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import StarRating from './StarRating.svelte';
	import PriceDisplay from './PriceDisplay.svelte';
	import { cartState, wishlistState } from '#lib';
	import type { ProductCard as ProductCardType, ProductListItem } from '@repo/types';

	interface Props {
		product: (ProductCardType | ProductListItem) & {
			categories?: { name: string; slug: string } | null;
		};
		class?: string;
	}

	let { product, class: className = '' }: Props = $props();

	let isAdding = $state(false);

	const currentPrice = $derived(
		'effectivePrice' in product && (product as any).effectivePrice != null
			? (product as any).effectivePrice
			: (product as any).price ?? 0
	);

	const isOnSale = $derived(Boolean((product as any).isOnSale));
	const isWishlisted = $derived(wishlistState.isWishlisted(product.id));

	async function handleAddToCart(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (product.stock_quantity <= 0 || isAdding) return;

		const targetVariantId = product.defaultVariantId;
		if (!targetVariantId) return;

		isAdding = true;
		try {
			await cartState.addItem(targetVariantId, 1, product.name);
		} finally {
			isAdding = false;
		}
	}

	async function handleToggleWishlist(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		await wishlistState.toggle(product.id, product.name);
	}

	const isOutOfStock = $derived(product.stock_quantity <= 0);
	const isLowStock = $derived(product.stock_quantity > 0 && product.stock_quantity <= 5);
</script>

<div
	class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xs hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 {className}"
>
	<!-- Card Top: Image Container -->
	<div class="relative aspect-square w-full overflow-hidden bg-muted/40 block">
		<a href="/products/{product.slug}" class="block h-full w-full">
			{#if product.primaryImageUrl}
				<img
					src={product.primaryImageUrl}
					alt={product.name}
					loading="lazy"
					class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
				/>
			{:else}
				<div class="h-full w-full flex items-center justify-center text-muted-foreground/40 bg-muted/60">
					<ShoppingBag class="h-12 w-12 stroke-[1.5]" />
				</div>
			{/if}
		</a>

		<!-- Wishlist Heart Button -->
		<button
			type="button"
			aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
			onclick={handleToggleWishlist}
			class="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur-xs border border-border/60 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer"
		>
			<Heart class="h-4 w-4 transition-colors {isWishlisted ? 'fill-red-500 text-red-500 stroke-red-500' : 'stroke-current'}" />
		</button>

		<!-- Stock & Discount Badges Overlay -->
		<div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
			{#if isOutOfStock}
				<Badge variant="destructive" class="text-[11px] font-bold px-2 py-0.5 shadow-sm">
					Sold Out
				</Badge>
			{:else if isLowStock}
				<Badge class="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold px-2 py-0.5 shadow-sm">
					Only {product.stock_quantity} left
				</Badge>
			{/if}

			{#if isOnSale}
				<Badge class="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2 py-0.5 shadow-sm">
					SALE
				</Badge>
			{:else if product.compare_at_price && product.compare_at_price > currentPrice}
				<Badge class="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2 py-0.5 shadow-sm">
					SAVE {Math.round(((product.compare_at_price - currentPrice) / product.compare_at_price) * 100)}%
				</Badge>
			{/if}
		</div>

		{#if isOutOfStock}
			<div class="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
				<span class="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-background/90 text-foreground border shadow-sm">
					Out of Stock
				</span>
			</div>
		{/if}
	</div>

	<!-- Card Bottom: Info & CTA -->
	<div class="flex flex-1 flex-col justify-between p-4 sm:p-5">
		<div class="space-y-2">
			<!-- Category Tag -->
			{#if product.categories?.name}
				<a
					href="/category/{product.categories.slug}"
					class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors inline-block"
				>
					{product.categories.name}
				</a>
			{/if}

			<!-- Title -->
			<h3 class="font-bold text-sm sm:text-base leading-snug line-clamp-2">
				<a
					href="/products/{product.slug}"
					class="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline"
				>
					{product.name}
				</a>
			</h3>

			<!-- Rating -->
			<div class="pt-0.5">
				<StarRating
					rating={product.averageRating}
					count={product.reviewCount}
					size="xs"
					showCount={true}
				/>
			</div>
		</div>

		<!-- Price & Add Button Row -->
		<div class="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
			<PriceDisplay
				price={currentPrice}
				compareAtPrice={product.compare_at_price}
				size="sm"
				showDiscountBadge={false}
			/>

			{#if isOutOfStock}
				<Button
					variant="outline"
					size="sm"
					disabled
					class="h-9 px-3 text-xs opacity-60 cursor-not-allowed"
				>
					Sold Out
				</Button>
			{:else}
				<Button
					variant="default"
					size="sm"
					onclick={handleAddToCart}
					disabled={isAdding}
					class="h-9 px-3 text-xs font-semibold rounded-lg shadow-sm gap-1.5 transition-all hover:shadow-md"
				>
					{#if isAdding}
						<LoaderCircle class="h-3.5 w-3.5 animate-spin" />
						<span class="hidden sm:inline">Adding...</span>
					{:else}
						<ShoppingBag class="h-3.5 w-3.5" />
						<span>Add</span>
					{/if}
				</Button>
			{/if}
		</div>
	</div>
</div>
