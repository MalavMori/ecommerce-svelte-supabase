<script lang="ts">
	import { Heart, ShoppingBag, ArrowRight } from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import ProductCard from '#lib/components/ProductCard.svelte';
	import { wishlistState } from '#lib';

	let { data } = $props();

	// Initialize wishlist state with current wishlisted IDs
	$effect(() => {
		if (data.items) {
			wishlistState.productIds = data.items.map((i: any) => i.product.id);
			wishlistState.initialized = true;
		}
	});

	// Filter out items removed from the local state reactively
	const visibleItems = $derived(
		data.items.filter((item: any) => wishlistState.isWishlisted(item.product.id))
	);
</script>

<svelte:head>
	<title>My Wishlist | Nexus</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
		<div>
			<div class="flex items-center gap-2.5">
				<div class="p-2 rounded-xl bg-primary/10 text-primary">
					<Heart class="h-5 w-5 fill-primary/20 stroke-primary" />
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-foreground">My Wishlist</h1>
			</div>
			<p class="text-sm text-muted-foreground mt-1">
				Keep track of products you're interested in and receive updates on price drops.
			</p>
		</div>

		<div class="text-sm font-semibold text-muted-foreground">
			{visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'} saved
		</div>
	</div>

	<!-- Wishlist Grid or Empty State -->
	{#if visibleItems.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each visibleItems as item (item.product.id)}
				<ProductCard product={item.product} />
			{/each}
		</div>
	{:else}
		<div class="rounded-3xl border border-dashed border-border/80 p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8">
			<div class="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
				<Heart class="h-8 w-8 stroke-[1.5]" />
			</div>
			<h2 class="text-lg font-bold text-foreground">Your wishlist is empty</h2>
			<p class="text-sm text-muted-foreground mt-1 text-center max-w-sm mb-6">
				Explore our catalog and click the heart icon on any product to save it here for later.
			</p>
			<Button href="/products" class="rounded-xl gap-2 font-semibold shadow-sm">
				<ShoppingBag class="h-4 w-4" />
				<span>Explore Products</span>
				<ArrowRight class="h-4 w-4" />
			</Button>
		</div>
	{/if}
</div>
