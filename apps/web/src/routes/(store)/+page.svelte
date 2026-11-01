<script lang="ts">
	import { 
		ArrowRight, 
		Sparkles, 
		Zap, 
		ShieldCheck, 
		Truck, 
		Award, 
		Flame,
		ChevronRight,
		ChevronLeft,
		SlidersHorizontal,
		Layers
	} from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import ProductCard from '#lib/components/ProductCard.svelte';
	import CategoryIcon from '#lib/components/CategoryIcon.svelte';
	import { currencyState } from '#lib';

	let { data } = $props();

	// Active banner carousel slide
	let activeBannerIndex = $state(0);
	const banners = $derived(data.homepageContent?.banners || []);

	function nextBanner() {
		if (banners.length > 0) {
			activeBannerIndex = (activeBannerIndex + 1) % banners.length;
		}
	}

	function prevBanner() {
		if (banners.length > 0) {
			activeBannerIndex = (activeBannerIndex - 1 + banners.length) % banners.length;
		}
	}

	// Active product section tab
	type SectionKey = 'featured' | 'new_arrivals' | 'best_sellers' | 'trending';
	let activeSection = $state<SectionKey>('featured');

	const sectionTabs: { key: SectionKey; label: string; icon: any }[] = [
		{ key: 'featured', label: 'Featured Gear', icon: Sparkles },
		{ key: 'new_arrivals', label: 'New Arrivals', icon: Zap },
		{ key: 'best_sellers', label: 'Best Sellers', icon: Award },
		{ key: 'trending', label: 'Trending Deals', icon: Flame }
	];

	const currentSectionProducts = $derived(
		data.homepageContent?.featuredProductSections?.[activeSection] || []
	);

	const featuredCollections = $derived(
		data.homepageContent?.featuredCollections || []
	);

	const currentBanner = $derived(banners[activeBannerIndex] || null);
</script>

<svelte:head>
	<title>Nexus — Next-Gen Audio, Wearables & Hardware Gear</title>
	<meta name="description" content="Discover premium wireless audio, smart wearables, tactical gaming gear, and modern workstation accessories engineered for creators." />
</svelte:head>

<!-- =========================================================================
     1. HERO BANNER CAROUSEL / SHOWCASE
     ========================================================================= -->
{#if banners.length > 0 && currentBanner}
	<section class="relative overflow-hidden border-b border-border/40 bg-card">
		<div class="relative min-h-[420px] sm:min-h-[500px] lg:min-h-[560px] flex items-center">
			<!-- Background Image with dynamic overlays -->
			<div class="absolute inset-0 z-0">
				<img
					src={currentBanner.image_url}
					alt={currentBanner.title}
					class="w-full h-full object-cover object-center transform scale-100 transition-all duration-700"
				/>
				<div class="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
				<div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
			</div>

			<!-- Slide Content -->
			<div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
				<div class="max-w-2xl space-y-6">
					<div class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/80 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
						<Sparkles class="h-3.5 w-3.5" />
						<span>Featured Showcase</span>
					</div>

					<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.08]">
						{currentBanner.title}
					</h1>

					{#if currentBanner.subtitle}
						<p class="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
							{currentBanner.subtitle}
						</p>
					{/if}

					<div class="flex flex-wrap items-center gap-4 pt-2">
						{#if currentBanner.link_url}
							<Button size="lg" href={currentBanner.link_url} class="h-12 px-7 text-sm font-bold shadow-lg shadow-primary/20 gap-2">
								<span>Shop Now</span>
								<ArrowRight class="h-4 w-4" />
							</Button>
						{:else}
							<Button size="lg" href="/products" class="h-12 px-7 text-sm font-bold shadow-lg shadow-primary/20 gap-2">
								<span>Explore Gear</span>
								<ArrowRight class="h-4 w-4" />
							</Button>
						{/if}
						<Button variant="outline" size="lg" href="/products?deals=true" class="h-12 px-6 text-sm font-semibold border-border/80 bg-background/60 backdrop-blur-xs hover:bg-accent gap-2">
							<Flame class="h-4 w-4 text-orange-500" />
							<span>Flash Sales</span>
						</Button>
					</div>
				</div>
			</div>

			<!-- Carousel Navigation Arrows -->
			{#if banners.length > 1}
				<div class="absolute bottom-6 right-6 z-20 flex items-center gap-2">
					<button
						type="button"
						onclick={prevBanner}
						aria-label="Previous Slide"
						class="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors shadow-sm cursor-pointer"
					>
						<ChevronLeft class="h-5 w-5" />
					</button>
					<div class="px-3 py-1 rounded-full bg-background/80 backdrop-blur-md text-xs font-mono font-bold text-foreground border border-border shadow-sm">
						{activeBannerIndex + 1} / {banners.length}
					</div>
					<button
						type="button"
						onclick={nextBanner}
						aria-label="Next Slide"
						class="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors shadow-sm cursor-pointer"
					>
						<ChevronRight class="h-5 w-5" />
					</button>
				</div>
			{/if}
		</div>
	</section>
{:else}
	<!-- Default Fallback Hero -->
	<section class="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-border/40">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="max-w-3xl space-y-6 text-center sm:text-left">
				<div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
					<Sparkles class="h-3.5 w-3.5" />
					<span>New Autumn Hardware Collection 2026</span>
				</div>

				<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.08]">
					Engineered For Precision. <br class="hidden sm:inline" />
					<span class="bg-gradient-to-r from-primary via-emerald-500 to-teal-500 bg-clip-text text-transparent">
						Built For Pure Sound.
					</span>
				</h1>

				<p class="text-base sm:text-lg text-muted-foreground leading-relaxed">
					Experience studio-grade active noise cancelling headphones, titanium smartwatches, and tactile mechanical gaming gear designed for creators.
				</p>

				<div class="flex flex-wrap items-center gap-4 pt-2">
					<Button size="lg" href="/products" class="h-12 px-7 text-sm font-bold shadow-lg shadow-primary/20 gap-2">
						<span>Explore Catalog</span>
						<ArrowRight class="h-4 w-4" />
					</Button>
					<Button variant="outline" size="lg" href="/products?deals=true" class="h-12 px-6 text-sm font-semibold border-border/80 hover:bg-accent gap-2">
						<Flame class="h-4 w-4 text-orange-500" />
						<span>Limited Deals</span>
					</Button>
				</div>
			</div>
		</div>
	</section>
{/if}

<!-- =========================================================================
     2. CURATED FEATURED COLLECTIONS
     ========================================================================= -->
{#if featuredCollections.length > 0}
	<section class="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border/40">
		<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
			<div>
				<div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-2">
					<Layers class="h-3.5 w-3.5" />
					<span>Curated Collections</span>
				</div>
				<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
					Featured Lines
				</h2>
			</div>
			<Button variant="ghost" href="/products" class="text-sm font-semibold text-primary hover:text-primary gap-1">
				<span>All Categories</span>
				<ChevronRight class="h-4 w-4" />
			</Button>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each featuredCollections as fc}
				<a
					href="/category/{fc.category.slug}"
					class="group relative aspect-4/3 sm:aspect-3/4 rounded-3xl overflow-hidden border border-border/60 bg-muted/40 shadow-xs hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-6"
				>
					{#if fc.image_url}
						<img
							src={fc.image_url}
							alt={fc.label || fc.category.name}
							class="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
						/>
					{/if}
					<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

					<div class="relative z-10 text-white space-y-1">
						<span class="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Collection</span>
						<h3 class="text-xl font-bold">{fc.label || fc.category.name}</h3>
						<div class="inline-flex items-center gap-1 text-xs font-semibold text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all pt-1">
							<span>Explore line</span>
							<ArrowRight class="h-3.5 w-3.5" />
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}

<!-- =========================================================================
     3. DYNAMIC PRODUCT SECTIONS WITH TABS
     ========================================================================= -->
<section class="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
		<div>
			<div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-2">
				<Sparkles class="h-3.5 w-3.5" />
				<span>Curated Selection</span>
			</div>
			<h2 class="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
				Discover The Lineup
			</h2>
		</div>

		<!-- Section Tabs -->
		<div class="flex items-center gap-1.5 p-1.5 rounded-2xl bg-muted/60 border border-border/60 overflow-x-auto">
			{#each sectionTabs as tab}
				<button
					type="button"
					onclick={() => (activeSection = tab.key)}
					class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer {activeSection === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
				>
					<tab.icon class="h-3.5 w-3.5 {activeSection === tab.key ? 'text-primary' : ''}" />
					<span>{tab.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Product Grid -->
	{#if currentSectionProducts.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each currentSectionProducts as product (product.id)}
				<ProductCard {product} />
			{/each}
		</div>
	{:else}
		<div class="text-center py-16 border border-dashed rounded-3xl text-muted-foreground text-sm">
			No products currently assigned to this section. Check back soon!
		</div>
	{/if}

	<div class="text-center pt-12">
		<Button size="lg" variant="outline" href="/products" class="h-12 px-8 font-bold rounded-xl gap-2 shadow-xs">
			<span>View All {data.categories.length > 0 ? 'Catalog' : 'Products'}</span>
			<ArrowRight class="h-4 w-4" />
		</Button>
	</div>
</section>

<!-- =========================================================================
     4. TRUST & GUARANTEE BANNER
     ========================================================================= -->
<section class="border-t border-border/40 bg-muted/20 py-12">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			<div class="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60">
				<div class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
					<Truck class="h-6 w-6" />
				</div>
				<div>
					<h4 class="font-bold text-sm text-foreground">Global Express</h4>
					<p class="text-xs text-muted-foreground mt-0.5">Free shipping on orders over {currencyState.format(100)}</p>
				</div>
			</div>

			<div class="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60">
				<div class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
					<ShieldCheck class="h-6 w-6" />
				</div>
				<div>
					<h4 class="font-bold text-sm text-foreground">2-Year Warranty</h4>
					<p class="text-xs text-muted-foreground mt-0.5">Official manufacturer coverage</p>
				</div>
			</div>

			<div class="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60">
				<div class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
					<Flame class="h-6 w-6 text-orange-500" />
				</div>
				<div>
					<h4 class="font-bold text-sm text-foreground">Flash Deals</h4>
					<p class="text-xs text-muted-foreground mt-0.5">Limited-time verified pricing</p>
				</div>
			</div>

			<div class="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60">
				<div class="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
					<Award class="h-6 w-6" />
				</div>
				<div>
					<h4 class="font-bold text-sm text-foreground">Easy Returns</h4>
					<p class="text-xs text-muted-foreground mt-0.5">30-day hassle-free returns policy</p>
				</div>
			</div>
		</div>
	</div>
</section>
