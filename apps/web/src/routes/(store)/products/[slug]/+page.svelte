<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import {
		ShoppingBag,
		Check,
		Truck,
		ShieldCheck,
		RotateCcw,
		Star,
		Plus,
		Minus,
		ArrowRight,
		Sparkles,
		CheckCircle2,
		AlertCircle,
		LoaderCircle,
		Share2,
		Heart,
		Zap,
		Maximize2,
		X
	} from 'lucide-svelte';
	import ImageViewerModal, { type ViewerImage } from '#lib/components/ImageViewerModal.svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import * as Breadcrumb from '@repo/ui/lib/components/ui/breadcrumb/index.js';
	import * as Avatar from '@repo/ui/lib/components/ui/avatar/index.js';
	import StarRating from '#lib/components/StarRating.svelte';
	import PriceDisplay from '#lib/components/PriceDisplay.svelte';
	import ProductCard from '#lib/components/ProductCard.svelte';
	import { cartState, wishlistState, currencyState } from '#lib';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	// Gallery active image index
	let activeImageIndex = $state(0);
	const activeImage = $derived(data.product.images?.[activeImageIndex]?.url || null);

	// Quantity state
	let quantity = $state(1);
	let isAdding = $state(false);
	let isBuyingNow = $state(false);

	// Review form state
	let newRating = $state(5);
	let hoverRating = $state(0);
	let reviewComment = $state('');
	let isWriteReviewOpen = $state(false);

	$effect(() => {
		if (form?.message) {
			isWriteReviewOpen = true;
		}
	});

	// Options & Variant Selection State
	let selectedOptions = $state<Record<string, string>>({});
	let currentProductId = $state<string | null>(null);

	// Helper to extract options map from variant
	function getVariantOptions(variant: any): Record<string, string> {
		if (!variant) return {};
		const map: Record<string, string> = {};
		for (const l of variant.variant_option_values || []) {
			const pov = l.product_option_values;
			const poName = pov?.product_options?.name;
			if (poName && pov?.value) {
				map[poName] = pov.value;
			}
		}
		return map;
	}

	// Initialize selected options reactively on product load or product switch
	$effect(() => {
		if (data.product?.id && data.product.id !== currentProductId) {
			currentProductId = data.product.id;
			const defaultVar =
				data.variants.find((v: any) => v.id === data.defaultVariantId) || data.variants[0];
			const initial: Record<string, string> = defaultVar ? getVariantOptions(defaultVar) : {};
			if (data.options) {
				for (const opt of data.options) {
					if (!initial[opt.name] && opt.product_option_values?.length > 0) {
						initial[opt.name] = opt.product_option_values[0].value;
					}
				}
			}
			selectedOptions = initial;
			quantity = 1;
		}
	});

	// Derive the active variant that matches selected options
	const activeVariant = $derived.by(() => {
		if (!data.variants || data.variants.length === 0) return null;
		if (!data.options || data.options.length === 0) return data.variants[0] || null;

		const optKeys = Object.keys(selectedOptions);
		if (optKeys.length === 0) return data.variants[0] || null;

		const matched = data.variants.find((v: any) => {
			const vOpts = getVariantOptions(v);
			return data.options.every((opt: any) => {
				const selectedVal = selectedOptions[opt.name];
				return !selectedVal || vOpts[opt.name] === selectedVal;
			});
		});

		return matched || null;
	});

	// Smart option select: if chosen value isn't compatible with current sister options, auto-switch to a compatible variant
	function selectOption(optName: string, val: string) {
		const next = { ...selectedOptions, [optName]: val };

		// Check if this exact combination exists
		const directMatch = data.variants.find((v: any) => {
			const vOpts = getVariantOptions(v);
			return data.options.every((opt: any) => {
				const sVal = next[opt.name];
				return !sVal || vOpts[opt.name] === sVal;
			});
		});

		if (directMatch) {
			selectedOptions = next;
			return;
		}

		// Find any variant that has this chosen option value
		const compatibleVariant = data.variants.find((v: any) => {
			const vOpts = getVariantOptions(v);
			return vOpts[optName] === val;
		});

		if (compatibleVariant) {
			selectedOptions = {
				...getVariantOptions(compatibleVariant),
				[optName]: val
			};
		} else {
			selectedOptions = next;
		}
	}

	// Check if an option value is available (exists in an active variant with stock > 0)
	function isOptionAvailable(optName: string, val: string): boolean {
		if (!data.variants || data.variants.length === 0) return true;
		return data.variants.some((v: any) => {
			const vOpts = getVariantOptions(v);
			return vOpts[optName] === val && v.stock_quantity > 0;
		});
	}

	// Live variant-driven values
	const isUnavailable = $derived(Boolean(data.options?.length && !activeVariant));
	const currentPrice = $derived(activeVariant?.effectivePrice ?? data.product.price);
	const currentCompareAt = $derived(
		activeVariant?.compare_at_price != null
			? Number(activeVariant.compare_at_price)
			: data.product.compare_at_price
	);
	const currentStock = $derived(
		activeVariant
			? activeVariant.stock_quantity
			: data.variants?.length === 0
				? data.product.stock_quantity
				: 0
	);
	const currentSku = $derived(
		activeVariant?.sku ?? (data.variants?.length === 0 ? data.product.sku : null)
	);
	const isOnSale = $derived(activeVariant?.isOnSale ?? data.product.isOnSale);
	const currentVariantId = $derived(
		activeVariant?.id ??
			(data.variants?.length === 0
				? (data.defaultVariantId ?? data.product.defaultVariantId)
				: null)
	);

	// Clamp quantity whenever activeVariant / currentStock changes
	$effect(() => {
		if (currentStock > 0 && quantity > currentStock) {
			quantity = currentStock;
		} else if (quantity < 1 && currentStock > 0) {
			quantity = 1;
		}
	});

	// Find label for an image that is mapped to a variant
	function getImageVariantLabel(variantId: string | null | undefined): string | null {
		if (!variantId || !data.variants) return null;
		const v = data.variants.find((item: any) => item.id === variantId);
		if (!v) return null;
		const vOpts = getVariantOptions(v);
		const parts = Object.entries(vOpts).map(([k, val]) => `${k}: ${val}`);
		return parts.length > 0 ? parts.join(', ') : v.sku || null;
	}

	const activeImageVariantLabel = $derived(
		getImageVariantLabel(data.product.images?.[activeImageIndex]?.variant_id)
	);

	// Lightbox state for product images
	let isProductViewerOpen = $state(false);
	const productViewerImages = $derived<ViewerImage[]>(
		(data.product.images || []).map((img: any) => ({
			url: img.url,
			alt: data.product.name,
			caption: data.product.name,
			subcaption: getImageVariantLabel(img.variant_id) || undefined,
			tag: img.variant_id ? 'Variant Photo' : undefined
		}))
	);

	function handleProductViewerClose(finalIdx: number) {
		activeImageIndex = finalIdx;
	}

	// Lightbox state for review images
	let isReviewViewerOpen = $state(false);
	let reviewViewerImages = $state<ViewerImage[]>([]);
	let reviewViewerIndex = $state(0);

	function openReviewImages(review: any, clickedIndex: number) {
		if (!review.review_images || review.review_images.length === 0) return;
		reviewViewerImages = review.review_images.map((img: any, i: number) => ({
			url: img.url,
			alt: `Review photo ${i + 1} by ${review.profiles?.full_name || 'Customer'}`,
			caption: `Review by ${review.profiles?.full_name || 'Customer'}`,
			subcaption: `★ ${review.rating}/5 — ${review.comment ? (review.comment.length > 80 ? review.comment.slice(0, 80) + '...' : review.comment) : 'Verified Customer Review'}`,
			tag: `${review.rating} ★ Rating`
		}));
		reviewViewerIndex = clickedIndex;
		isReviewViewerOpen = true;
	}

	function handleThumbnailClick(img: any, idx: number) {
		activeImageIndex = idx;
		// If thumbnail is tied to a specific variant, auto-select that variant
		if (img.variant_id && data.variants) {
			const targetVar = data.variants.find((v: any) => v.id === img.variant_id);
			if (targetVar) {
				selectedOptions = getVariantOptions(targetVar);
			}
		}
	}

	// Switch gallery image if variant has a mapped image
	$effect(() => {
		if (activeVariant && data.product.images?.length) {
			const mappedIdx = data.product.images.findIndex(
				(img: any) => img.variant_id === activeVariant.id
			);
			if (mappedIdx !== -1) {
				activeImageIndex = mappedIdx;
			} else {
				// If current image belongs to a different variant, switch to general image or 0
				const currentImg = data.product.images[activeImageIndex];
				if (currentImg?.variant_id && currentImg.variant_id !== activeVariant.id) {
					const generalIdx = data.product.images.findIndex((img: any) => !img.variant_id);
					activeImageIndex = generalIdx !== -1 ? generalIdx : 0;
				}
			}
		}
	});

	function handleDecrement() {
		if (quantity > 1) quantity--;
	}

	function handleIncrement() {
		if (quantity < currentStock) {
			quantity++;
		} else {
			toast.info(`Only ${currentStock} units available in stock`);
		}
	}

	const isWishlisted = $derived(wishlistState.isWishlisted(data.product.id));

	async function handleToggleWishlist() {
		await wishlistState.toggle(data.product.id, data.product.name);
	}

	async function handleAddToCart() {
		if (isUnavailable) {
			toast.error('This combination is currently unavailable');
			return;
		}
		if (currentStock <= 0 || isAdding) return;
		if (!currentVariantId) {
			toast.error('No available variant for this product');
			return;
		}
		isAdding = true;
		try {
			await cartState.addItem(currentVariantId, quantity, data.product.name);
		} finally {
			isAdding = false;
		}
	}

	async function handleBuyNow() {
		if (isUnavailable) {
			toast.error('This combination is currently unavailable');
			return;
		}
		if (currentStock <= 0 || isBuyingNow) return;
		if (!currentVariantId) {
			toast.error('No available variant for this product');
			return;
		}

		if (!data.user) {
			toast.info('Please sign in to complete your purchase');
			goto(`/login?redirectTo=${encodeURIComponent('/checkout')}`);
			return;
		}

		isBuyingNow = true;
		try {
			const success = await cartState.addItem(currentVariantId, quantity, data.product.name);
			if (success) {
				goto('/checkout');
			}
		} finally {
			isBuyingNow = false;
		}
	}

	function handleShare() {
		if (navigator.share) {
			navigator
				.share({
					title: data.product.name,
					text: data.product.description || undefined,
					url: window.location.href
				})
				.catch(() => {});
		} else {
			navigator.clipboard.writeText(window.location.href);
			toast.success('Product link copied to clipboard!');
		}
	}

	const isOutOfStock = $derived(currentStock <= 0 || isUnavailable);
	const isLowStock = $derived(!isUnavailable && currentStock > 0 && currentStock <= 5);
</script>

<svelte:head>
	<title>{data.product.meta_title || `${data.product.name} — Nexus`}</title>
	<meta name="description" content={data.product.meta_description || data.product.description} />
	{#if data.product.og_image_url || activeImage}
		<meta property="og:image" content={data.product.og_image_url || activeImage} />
	{/if}
	<meta property="og:title" content={data.product.meta_title || `${data.product.name} — Nexus`} />
	<meta
		property="og:description"
		content={data.product.meta_description || data.product.description}
	/>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
	<!-- Breadcrumb -->
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/products">Products</Breadcrumb.Link>
			</Breadcrumb.Item>
			{#if data.product.categories}
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/category/{data.product.categories.slug}">
						{data.product.categories.name}
					</Breadcrumb.Link>
				</Breadcrumb.Item>
			{/if}
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page class="line-clamp-1 max-w-xs sm:max-w-md">
					{data.product.name}
				</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!-- Main Product Showcase Grid -->
	<div class="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
		<!-- Left: Image Gallery (Spans 7 cols) -->
		<div class="space-y-4 lg:col-span-7">
			<!-- Main Large Viewport -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				onclick={() => {
					if (activeImage) isProductViewerOpen = true;
				}}
				class="group/viewport relative aspect-square w-full overflow-hidden rounded-3xl border border-border/60 bg-muted/30 shadow-md sm:aspect-4/3 {activeImage
					? 'cursor-zoom-in'
					: ''}"
			>
				{#if activeImage}
					<img
						src={activeImage}
						alt={data.product.name}
						class="h-full w-full object-cover object-center transition-all duration-300 group-hover/viewport:scale-[1.02]"
					/>
					<!-- Hover "Click for full view" prompt badge -->
					<div
						class="pointer-events-none absolute right-4 bottom-4 z-10 opacity-0 transition-opacity duration-200 group-hover/viewport:opacity-100"
					>
						<span
							class="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md"
						>
							<Maximize2 class="h-3.5 w-3.5" />
							<span>Click for full view</span>
						</span>
					</div>
				{:else}
					<div class="flex h-full w-full items-center justify-center text-muted-foreground/40">
						<ShoppingBag class="h-20 w-20 stroke-[1.2]" />
					</div>
				{/if}

				<!-- Stock / Discount Badges -->
				<div class="pointer-events-none absolute top-4 left-4 z-10 flex flex-col gap-2">
					{#if isUnavailable}
						<Badge
							variant="outline"
							class="border-amber-500/40 bg-background/90 px-3 py-1 text-xs font-bold text-amber-600 shadow-md"
						>
							Unavailable
						</Badge>
					{:else if isOutOfStock}
						<Badge variant="destructive" class="px-3 py-1 text-xs font-bold shadow-md">
							Out of Stock
						</Badge>
					{:else if isLowStock}
						<Badge
							class="bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-md hover:bg-amber-600"
						>
							Only {currentStock} left in stock
						</Badge>
					{/if}

					{#if !isUnavailable && currentCompareAt && currentCompareAt > currentPrice}
						<Badge
							class="bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
						>
							SAVE {Math.round(((currentCompareAt - currentPrice) / currentCompareAt) * 100)}%
						</Badge>
					{/if}
				</div>

				<!-- Active Image Variant Badge -->
				{#if activeImageVariantLabel}
					<div class="pointer-events-none absolute bottom-4 left-4 z-10">
						<Badge
							variant="secondary"
							class="gap-1.5 border-border/60 bg-background/85 px-3 py-1 text-xs font-semibold text-foreground shadow-md backdrop-blur-md"
						>
							<Sparkles class="h-3 w-3 text-primary" />
							<span>{activeImageVariantLabel}</span>
						</Badge>
					</div>
				{/if}

				<!-- Action Buttons (Expand & Share) -->
				<div class="absolute top-4 right-4 z-10 flex items-center gap-2">
					{#if activeImage}
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								isProductViewerOpen = true;
							}}
							aria-label="View full image"
							title="View full image"
							class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-background"
						>
							<Maximize2 class="h-4 w-4" />
						</button>
					{/if}
					<!-- Share Button -->
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							handleShare();
						}}
						aria-label="Share product"
						title="Share product"
						class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-background"
					>
						<Share2 class="h-4 w-4" />
					</button>
				</div>
			</div>

			<!-- Thumbnails Strip (if > 1 image) -->
			{#if data.product.images && data.product.images.length > 1}
				<div class="flex items-center gap-3 overflow-x-auto pb-2">
					{#each data.product.images as img, i}
						{@const isImgSelected = activeImageIndex === i}
						{@const isVariantImg = Boolean(img.variant_id)}
						{@const matchesCurrentVariant =
							img.variant_id && activeVariant && img.variant_id === activeVariant.id}
						<button
							onclick={() => handleThumbnailClick(img, i)}
							title={isVariantImg ? 'Click to select this variant' : undefined}
							class="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all {isImgSelected
								? 'scale-105 border-primary shadow-md ring-2 ring-primary/20'
								: 'border-border/60 opacity-70 hover:border-border hover:opacity-100'}"
						>
							<img src={img.url} alt="Thumbnail {i + 1}" class="h-full w-full object-cover" />
							{#if isVariantImg}
								<span
									class="absolute right-1 bottom-1 rounded-md px-1.5 py-0.5 text-[9px] leading-none font-bold backdrop-blur-md {matchesCurrentVariant
										? 'bg-primary text-primary-foreground'
										: 'bg-black/60 text-white'}"
								>
									Variant
								</span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Right: Product Info & Buy Box (Spans 5 cols) -->
		<div class="space-y-6 lg:col-span-5">
			<div class="space-y-2">
				{#if data.product.categories}
					<a
						href="/category/{data.product.categories.slug}"
						class="text-xs font-bold tracking-wider text-primary uppercase hover:underline"
					>
						{data.product.categories.name}
					</a>
				{/if}

				<h1
					class="text-2xl leading-tight font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl"
				>
					{data.product.name}
				</h1>

				<!-- Rating Summary Jump -->
				<div class="flex items-center gap-3 pt-1">
					<StarRating
						rating={data.averageRating}
						count={data.reviewCount}
						size="sm"
						showNumber={true}
						showCount={true}
					/>
					<a href="#reviews" class="text-xs text-muted-foreground underline hover:text-primary">
						See all reviews
					</a>
				</div>
			</div>

			<!-- Option Selectors (Color, Size, etc.) -->
			{#if data.options && data.options.length > 0}
				<div class="space-y-4 pt-1">
					{#each data.options as opt}
						<div class="space-y-2">
							<div class="flex items-center justify-between text-xs">
								<span class="font-bold tracking-wider text-foreground uppercase">{opt.name}:</span>
								<span class="font-medium text-muted-foreground"
									>{selectedOptions[opt.name] || 'Select'}</span
								>
							</div>
							<div class="flex flex-wrap gap-2">
								{#each opt.product_option_values as val}
									{@const isSelected = selectedOptions[opt.name] === val.value}
									{@const available = isOptionAvailable(opt.name, val.value)}
									<button
										type="button"
										onclick={() => selectOption(opt.name, val.value)}
										class="cursor-pointer rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all {isSelected
											? 'scale-105 border-primary bg-primary text-primary-foreground shadow-sm ring-2 shadow-primary/20 ring-primary/20'
											: 'border-border/60 bg-muted/30 text-foreground hover:border-border hover:bg-muted'} {!available &&
										!isSelected
											? 'line-through opacity-40'
											: ''}"
										title={!available ? 'Out of stock in all variations' : undefined}
									>
										{val.value}
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Price & Stock Status -->
			<div class="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-5">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<PriceDisplay
						price={currentPrice}
						compareAtPrice={currentCompareAt}
						size="xl"
						showDiscountBadge={true}
					/>
					{#if isOnSale && !isUnavailable}
						<Badge
							class="gap-1 bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-amber-600"
						>
							<Zap class="h-3.5 w-3.5 fill-current" /> FLASH SALE
						</Badge>
					{/if}
				</div>

				<div class="flex items-center gap-2 text-xs font-medium">
					{#if isUnavailable}
						<span class="h-2 w-2 rounded-full bg-amber-500"></span>
						<span class="font-semibold text-amber-600 dark:text-amber-400"
							>Unavailable Combination</span
						>
					{:else if isOutOfStock}
						<span class="h-2 w-2 rounded-full bg-red-500"></span>
						<span class="font-semibold text-destructive">Currently Out of Stock</span>
					{:else if isLowStock}
						<span class="h-2 w-2 rounded-full bg-amber-500"></span>
						<span class="font-semibold text-amber-600 dark:text-amber-400"
							>Low Stock — Only {currentStock} units remaining</span
						>
					{:else}
						<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
						<span class="font-semibold text-emerald-600 dark:text-emerald-400"
							>In Stock — Ready to ship</span
						>
					{/if}
				</div>

				<p class="text-xs text-muted-foreground">
					SKU: <span class="font-mono font-semibold text-foreground">{currentSku || '—'}</span>
				</p>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<h3 class="text-xs font-bold tracking-wider text-muted-foreground uppercase">Overview</h3>
				<p class="text-sm leading-relaxed text-foreground/80">
					{data.product.description}
				</p>
			</div>

			<!-- Quantity & Add to Cart Controls -->
			{#if isUnavailable}
				<div
					class="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-medium text-amber-700 dark:text-amber-400"
				>
					<AlertCircle class="h-4 w-4 shrink-0" />
					<span>This combination is currently unavailable. Please select another option above.</span
					>
				</div>
			{:else if isOutOfStock}
				<div
					class="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-medium text-destructive"
				>
					This item is currently out of stock. Check back soon or browse related alternatives below.
				</div>
			{:else}
				<div class="space-y-4 border-t border-border/40 pt-2">
					<!-- Quantity Selector -->
					<div class="flex items-center gap-4">
						<span class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
							>Quantity</span
						>
						<div class="inline-flex items-center rounded-xl border border-border bg-card p-1">
							<button
								type="button"
								onclick={handleDecrement}
								disabled={quantity <= 1}
								aria-label="Decrease quantity"
								class="flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
							>
								<Minus class="h-3.5 w-3.5" />
							</button>
							<span class="w-12 text-center font-mono text-sm font-bold">
								{quantity}
							</span>
							<button
								type="button"
								onclick={handleIncrement}
								disabled={quantity >= currentStock || currentStock <= 0}
								aria-label="Increase quantity"
								class="flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
							>
								<Plus class="h-3.5 w-3.5" />
							</button>
						</div>
					</div>

					<!-- Primary Buttons -->
					<div class="flex items-center gap-3">
						<Button
							size="lg"
							variant="outline"
							onclick={handleAddToCart}
							disabled={isAdding || isBuyingNow}
							class="h-12 flex-1 gap-2 border-primary/40 text-sm font-bold hover:bg-primary/5"
						>
							{#if isAdding}
								<LoaderCircle class="h-4 w-4 animate-spin" />
								<span>Adding...</span>
							{:else}
								<ShoppingBag class="h-4 w-4" />
								<span>Add to Cart</span>
							{/if}
						</Button>

						<Button
							size="lg"
							variant="default"
							onclick={handleBuyNow}
							disabled={isAdding || isBuyingNow}
							class="h-12 flex-1 gap-2 text-sm font-bold shadow-lg shadow-primary/20"
						>
							{#if isBuyingNow}
								<LoaderCircle class="h-4 w-4 animate-spin" />
								<span>Processing...</span>
							{:else}
								<span>Buy Now</span>
								<ArrowRight class="h-4 w-4" />
							{/if}
						</Button>

						<Button
							size="lg"
							variant="outline"
							onclick={handleToggleWishlist}
							class="h-12 w-12 rounded-xl border-border p-0 transition-colors hover:border-rose-400 hover:text-rose-500"
							aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
						>
							<Heart
								class="h-5 w-5 {isWishlisted ? 'fill-rose-500 stroke-rose-500 text-rose-500' : ''}"
							/>
						</Button>
					</div>
				</div>
			{/if}

			<!-- Trust Value Propositions -->
			<div
				class="grid grid-cols-3 gap-3 border-t border-border/40 pt-4 text-center text-[11px] text-muted-foreground"
			>
				<div class="flex flex-col items-center gap-1.5 rounded-xl bg-muted/30 p-2">
					<Truck class="h-4 w-4 text-primary" />
					<span class="font-semibold text-foreground">Free Shipping</span>
					<span>Orders over {currencyState.format(100)}</span>
				</div>
				<div class="flex flex-col items-center gap-1.5 rounded-xl bg-muted/30 p-2">
					<ShieldCheck class="h-4 w-4 text-primary" />
					<span class="font-semibold text-foreground">2-Yr Warranty</span>
					<span>Full manufacturer</span>
				</div>
				<div class="flex flex-col items-center gap-1.5 rounded-xl bg-muted/30 p-2">
					<RotateCcw class="h-4 w-4 text-primary" />
					<span class="font-semibold text-foreground">30 Days Return</span>
					<span>No questions asked</span>
				</div>
			</div>
		</div>
	</div>

	<!-- =========================================================================
	     CUSTOMER REVIEWS & RATINGS SECTION
	     ========================================================================= -->
	<section id="reviews" class="space-y-10 border-t border-border/40 pt-12">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<div>
				<h2 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
					Customer Reviews
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Verified feedback from certified hardware owners.
				</p>
			</div>

			{#if data.hasPurchased}
				<Button
					type="button"
					variant={isWriteReviewOpen ? 'outline' : 'default'}
					onclick={() => (isWriteReviewOpen = !isWriteReviewOpen)}
					class="cursor-pointer gap-2 self-start font-bold sm:self-auto"
				>
					{#if isWriteReviewOpen}
						<X class="h-4 w-4" />
						<span>Cancel</span>
					{:else}
						<Sparkles class="h-4 w-4" />
						<span>{data.userReview ? 'Update Your Review' : 'Write a Review'}</span>
					{/if}
				</Button>
			{/if}
		</div>

		<!-- Rating Overview & Breakdown -->
		<div
			class="grid grid-cols-1 items-center gap-8 rounded-3xl border border-border/60 bg-muted/20 p-6 sm:p-8 lg:grid-cols-12"
		>
			<!-- Overall Score (4 cols) -->
			<div
				class="space-y-2 border-border/40 text-center lg:col-span-4 lg:border-r lg:pr-8 lg:text-left"
			>
				<div class="text-5xl font-black tracking-tight text-foreground">
					{data.averageRating ? data.averageRating.toFixed(1) : '0.0'}
				</div>
				<StarRating rating={data.averageRating || 0} size="md" showCount={false} />
				<p class="text-xs text-muted-foreground">
					Based on {data.reviewCount} customer {data.reviewCount === 1 ? 'review' : 'reviews'}
				</p>
			</div>

			<!-- Breakdown Bars (8 cols) -->
			<div class="space-y-2 lg:col-span-8">
				{#each [5, 4, 3, 2, 1] as stars}
					{@const count = data.distribution[stars] || 0}
					{@const pct = data.reviewCount > 0 ? (count / data.reviewCount) * 100 : 0}
					<div class="flex items-center gap-3 text-xs">
						<span class="w-12 text-right font-medium text-muted-foreground">{stars} stars</span>
						<div class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								class="h-full rounded-full bg-amber-400 transition-all duration-500"
								style="width: {pct}%"
							></div>
						</div>
						<span class="w-8 text-left text-muted-foreground">{count}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Write a Review Form (Only shown if user has purchased this product and toggled open) -->
		{#if data.hasPurchased}
			{#if isWriteReviewOpen}
				<div class="space-y-4 rounded-3xl border border-border/60 bg-card p-6 sm:p-8 animate-in fade-in slide-in-from-top-2 duration-200">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Badge
								class="gap-1 border-emerald-600/20 bg-emerald-600/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600"
							>
								<ShieldCheck class="h-3.5 w-3.5" /> Verified Purchaser
							</Badge>
							<h3 class="text-lg font-bold text-foreground">
								{data.userReview ? 'Update Your Review' : 'Write a Product Review'}
							</h3>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onclick={() => (isWriteReviewOpen = false)}
							aria-label="Close review form"
							class="cursor-pointer text-muted-foreground hover:text-foreground"
						>
							<X class="h-4 w-4" />
						</Button>
					</div>

					{#if form?.message}
						<div
							class="rounded-xl p-3 {form?.success
								? 'bg-emerald-500/10 text-emerald-600'
								: 'bg-destructive/10 text-destructive'} text-xs font-semibold"
						>
							{form.message}
						</div>
					{/if}

					<form
						method="POST"
						action="?/submitReview"
						enctype="multipart/form-data"
						use:enhance
						class="space-y-4"
					>
						<input type="hidden" name="productId" value={data.product.id} />
						<input type="hidden" name="rating" value={newRating} />

						<!-- Interactive Star Picker -->
						<div>
							<p
								class="mb-2 block text-xs font-bold tracking-wider text-muted-foreground uppercase"
								id="rating-label"
							>
								Your Rating
							</p>
							<div class="flex items-center gap-1" aria-labelledby="rating-label">
								{#each [1, 2, 3, 4, 5] as starVal}
									<button
										type="button"
										onclick={() => (newRating = starVal)}
										onmouseenter={() => (hoverRating = starVal)}
										onmouseleave={() => (hoverRating = 0)}
										class="cursor-pointer rounded-md p-1 transition-colors hover:bg-muted focus:ring-2 focus:ring-ring focus:outline-none"
									>
										<Star
											class="h-6 w-6 {(hoverRating || newRating) >= starVal
												? 'fill-amber-400 text-amber-400'
												: 'text-muted-foreground/30'}"
										/>
									</button>
								{/each}
								<span class="ml-2 text-xs font-semibold text-muted-foreground">
									{newRating} of 5 stars
								</span>
							</div>
						</div>

						<!-- Comment Textarea -->
						<div>
							<label
								for="review-comment"
								class="mb-2 block text-xs font-bold tracking-wider text-muted-foreground uppercase"
							>
								Your Review
							</label>
							<textarea
								id="review-comment"
								name="comment"
								rows="4"
								required
								bind:value={reviewComment}
								placeholder="Share what you like about the sound quality, build, ergonomics, or battery life..."
								class="w-full rounded-xl border border-border bg-background p-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
							></textarea>
						</div>

						<!-- Photos Upload -->
						<div>
							<label
								for="review-photos"
								class="mb-1.5 block text-xs font-bold tracking-wider text-muted-foreground uppercase"
							>
								Upload Product Photos (Optional)
							</label>
							<input
								id="review-photos"
								name="images"
								type="file"
								accept="image/png,image/jpeg,image/webp"
								multiple
								class="cursor-pointer text-xs text-muted-foreground file:mr-3 file:rounded-xl file:border file:border-border file:bg-muted/60 file:px-3 file:py-1.5 file:text-xs file:font-semibold hover:file:bg-muted"
							/>
							<p class="mt-1 text-[11px] text-muted-foreground">
								Upload verified photos up to 5MB each (PNG, JPEG, WebP)
							</p>
						</div>

						<div class="flex items-center gap-3">
							<Button type="submit" class="font-bold">
								<span>Submit Review & Photos</span>
							</Button>
							<Button
								type="button"
								variant="outline"
								onclick={() => (isWriteReviewOpen = false)}
								class="cursor-pointer"
							>
								Cancel
							</Button>
						</div>
					</form>
				</div>
			{/if}
		{:else if !data.user}
			<div
				class="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border/40 bg-muted/20 p-5 sm:flex-row"
			>
				<div>
					<p class="text-sm font-semibold text-foreground">Have you purchased this product?</p>
					<p class="mt-0.5 text-xs text-muted-foreground">
						Please sign in to your account to leave a verified customer review.
					</p>
				</div>
				<Button
					href="/login?redirectTo={encodeURIComponent('/products/' + data.product.slug)}"
					size="sm"
					variant="outline"
				>
					<span>Sign In to Review</span>
				</Button>
			</div>
		{/if}

		<!-- Reviews List -->
		{#if data.reviews.length > 0}
			<div class="space-y-4">
				{#each data.reviews as rev}
					<div class="space-y-3 rounded-2xl border border-border/60 bg-card p-6">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<Avatar.Root class="h-9 w-9 border border-border">
									{#if rev.profiles?.avatar_url}
										<Avatar.Image
											src={rev.profiles.avatar_url}
											alt={rev.profiles.full_name || 'User'}
										/>
									{/if}
									<Avatar.Fallback class="bg-primary/10 font-mono text-xs font-bold text-primary">
										{(rev.profiles?.full_name?.[0] ?? 'U').toUpperCase()}
									</Avatar.Fallback>
								</Avatar.Root>
								<div>
									<h4 class="text-sm font-bold text-foreground">
										{rev.profiles?.full_name || 'Customer'}
									</h4>
									{#if rev.is_verified_purchase}
										<div
											class="mt-0.5 flex w-fit items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
										>
											<CheckCircle2 class="h-3 w-3" />
											<span>Verified Purchase</span>
										</div>
									{/if}
								</div>
							</div>

							<span class="text-xs text-muted-foreground">
								{new Date(rev.created_at || Date.now()).toLocaleDateString(undefined, {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})}
							</span>
						</div>

						<StarRating rating={rev.rating} size="xs" showCount={false} />

						<p class="text-sm leading-relaxed text-foreground/90">
							{rev.comment}
						</p>

						{#if rev.review_images && rev.review_images.length > 0}
							<div class="flex flex-wrap items-center gap-2 pt-2">
								{#each rev.review_images as img, imgIdx}
									<button
										type="button"
										onclick={() => openReviewImages(rev, imgIdx)}
										aria-label="View photo {imgIdx + 1} from {rev.profiles?.full_name ||
											'Customer'}'s review"
										title="Click to view full photo"
										class="group/img relative h-16 w-16 cursor-pointer overflow-hidden rounded-xl border border-border/80 shadow-sm transition-all hover:border-primary focus:ring-2 focus:ring-primary focus:outline-none sm:h-20 sm:w-20"
									>
										<img
											src={img.url}
											alt="Review attachment"
											class="h-full w-full object-cover transition-transform group-hover/img:scale-105"
										/>
										<div
											class="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 backdrop-blur-[1px] transition-opacity group-hover/img:opacity-100"
										>
											<Maximize2 class="h-4 w-4 text-white drop-shadow" />
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="space-y-3 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
				<p>No reviews yet. Be the first to share your experience with this product!</p>
				{#if data.hasPurchased && !isWriteReviewOpen}
					<Button
						type="button"
						size="sm"
						onclick={() => (isWriteReviewOpen = true)}
						class="cursor-pointer font-bold"
					>
						<Sparkles class="mr-1.5 h-4 w-4" />
						Write the First Review
					</Button>
				{/if}
			</div>
		{/if}
	</section>

	<!-- Related Products Section -->
	{#if data.relatedProducts.length > 0}
		<section class="space-y-6 border-t border-border/40 pt-12">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-black tracking-tight text-foreground">You Might Also Like</h2>
				{#if data.product.categories}
					<Button variant="ghost" size="sm" href="/category/{data.product.categories.slug}">
						<span>More {data.product.categories.name} →</span>
					</Button>
				{/if}
			</div>

			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each data.relatedProducts as relProduct}
					<ProductCard product={relProduct} />
				{/each}
			</div>
		</section>
	{/if}

	<!-- Full Image Lightbox for Product Gallery Images -->
	<ImageViewerModal
		bind:isOpen={isProductViewerOpen}
		images={productViewerImages}
		initialIndex={activeImageIndex}
		onClose={handleProductViewerClose}
	/>

	<!-- Full Image Lightbox for Review Images -->
	<ImageViewerModal
		bind:isOpen={isReviewViewerOpen}
		images={reviewViewerImages}
		initialIndex={reviewViewerIndex}
	/>
</div>
