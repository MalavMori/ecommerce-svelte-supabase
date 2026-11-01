<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { 
		SlidersHorizontal, 
		Search, 
		X, 
		ChevronLeft, 
		ChevronRight, 
		Filter, 
		Tag, 
		RotateCcw,
		Sparkles,
		Check,
		PackageCheck,
		ArrowUpDown
	} from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { Switch } from '@repo/ui/lib/components/ui/switch/index.js';
	import * as Sheet from '@repo/ui/lib/components/ui/sheet/index.js';
	import * as Breadcrumb from '@repo/ui/lib/components/ui/breadcrumb/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import ProductCard from '#lib/components/ProductCard.svelte';
	import CategoryIcon from '#lib/components/CategoryIcon.svelte';
	import { currencyState } from '#lib';

	let { data } = $props();

	let mobileFilterOpen = $state(false);
	let minPriceInput = $state('');
	let maxPriceInput = $state('');
	let selectedSort = $state('newest');

	// Synchronize local UI state with server-provided active filters and active currency
	$effect(() => {
		const curCode = currencyState.currentCurrency;
		const filterCurrency = data.filters.currency || curCode;

		// If user switched currency while price filters were active, adapt the filter bounds
		if (filterCurrency !== curCode && (data.filters.minPrice !== null || data.filters.maxPrice !== null)) {
			const oldRate = currencyState.rates[filterCurrency] ?? 1.0;
			const newRate = currencyState.rates[curCode] ?? 1.0;

			const newMin = data.filters.minPrice !== null ? Math.round((data.filters.minPrice / oldRate) * newRate * 100) / 100 : null;
			const newMax = data.filters.maxPrice !== null ? Math.round((data.filters.maxPrice / oldRate) * newRate * 100) / 100 : null;

			updateParams({
				minPrice: newMin !== null ? String(newMin) : null,
				maxPrice: newMax !== null ? String(newMax) : null,
				currency: curCode
			});
			return;
		}

		minPriceInput = data.filters.minPrice !== null && data.filters.minPrice !== undefined ? String(data.filters.minPrice) : '';
		maxPriceInput = data.filters.maxPrice !== null && data.filters.maxPrice !== undefined ? String(data.filters.maxPrice) : '';
		selectedSort = data.filters.sort || 'newest';
	});

	const currencySymbol = $derived(currencyState.getActiveCurrency().symbol);

	function getFilterUrl(newParams: Record<string, string | null>): string {
		const currentUrl = new URL(page.url.toString());
		for (const [key, value] of Object.entries(newParams)) {
			if (value === null || value === '' || value === 'false') {
				currentUrl.searchParams.delete(key);
			} else {
				currentUrl.searchParams.set(key, value);
			}
		}
		// Reset to page 1 whenever filters change (unless explicitly paging)
		if (!('page' in newParams)) {
			currentUrl.searchParams.delete('page');
		}
		return currentUrl.pathname + currentUrl.search;
	}

	async function updateParams(newParams: Record<string, string | null>) {
		const targetUrl = getFilterUrl(newParams);
		mobileFilterOpen = false;
		// Keep scroll and focus stable so filter clicks don't jump the screen
		await goto(targetUrl, { reset: false });
	}

	function toggleCategory(catSlug: string | null) {
		if (catSlug === null) {
			updateParams({ category: null });
			return;
		}
		const isCurrentlyActive = (data.filters.category || '').toLowerCase() === catSlug.toLowerCase();
		// If clicking an already selected category, toggle it off to All Departments
		updateParams({ category: isCurrentlyActive ? null : catSlug });
	}

	function toggleDeals() {
		updateParams({ deals: data.filters.deals ? null : 'true' });
	}

	function toggleInStock() {
		updateParams({ inStock: data.filters.inStock ? null : 'true' });
	}



	function handlePriceFilter(e?: SubmitEvent) {
		if (e) e.preventDefault();
		let min = minPriceInput ? parseFloat(minPriceInput) : null;
		let max = maxPriceInput ? parseFloat(maxPriceInput) : null;

		if (min !== null && isNaN(min)) min = null;
		if (max !== null && isNaN(max)) max = null;

		if (min !== null && max !== null && min > max) {
			const temp = min;
			min = max;
			max = temp;
			minPriceInput = String(min);
			maxPriceInput = String(max);
		}

		updateParams({
			minPrice: min !== null ? String(min) : null,
			maxPrice: max !== null ? String(max) : null,
			currency: currencyState.currentCurrency
		});
	}

	function isPresetActive(presetMin: number | null, presetMax: number | null) {
		const curMin = data.filters.minPrice;
		const curMax = data.filters.maxPrice;
		if (curMin === null && curMax === null) return false;
		const minMatch = (curMin === null && presetMin === null) || 
			(curMin !== null && presetMin !== null && Math.abs(curMin - presetMin) < 0.05);
		const maxMatch = (curMax === null && presetMax === null) || 
			(curMax !== null && presetMax !== null && Math.abs(curMax - presetMax) < 0.05);
		return minMatch && maxMatch;
	}

	function setPricePreset(min: number | null, max: number | null) {
		// Toggle off if clicking the active preset
		if (isPresetActive(min, max)) {
			minPriceInput = '';
			maxPriceInput = '';
			updateParams({ minPrice: null, maxPrice: null, currency: null });
			return;
		}
		minPriceInput = min !== null ? String(min) : '';
		maxPriceInput = max !== null ? String(max) : '';
		updateParams({
			minPrice: min !== null ? String(min) : null,
			maxPrice: max !== null ? String(max) : null,
			currency: currencyState.currentCurrency
		});
	}

	function clearPriceFilter() {
		minPriceInput = '';
		maxPriceInput = '';
		updateParams({ minPrice: null, maxPrice: null, currency: null });
	}

	async function clearAllFilters() {
		minPriceInput = '';
		maxPriceInput = '';
		mobileFilterOpen = false;
		await goto('/products', { reset: false });
	}

	// Dynamically compute price preset tiers according to the active currency rate
	const pricePresets = $derived.by(() => {
		const tiers = [
			{ minBase: null, maxBase: 50 },
			{ minBase: 50, maxBase: 150 },
			{ minBase: 150, maxBase: 300 },
			{ minBase: 300, maxBase: null }
		];

		const rate = currencyState.rates[currencyState.currentCurrency] ?? 1.0;
		const digits = currencyState.getActiveCurrency().decimal_digits;

		return tiers.map((t) => {
			const min = t.minBase !== null ? Math.round(t.minBase * rate * 100) / 100 : null;
			const max = t.maxBase !== null ? Math.round(t.maxBase * rate * 100) / 100 : null;

			let label = '';
			if (min === null && max !== null) {
				const maxStr = max % 1 === 0 ? String(max) : max.toFixed(digits);
				label = `Under ${currencySymbol}${maxStr}`;
			} else if (min !== null && max !== null) {
				const minStr = min % 1 === 0 ? String(min) : min.toFixed(digits);
				const maxStr = max % 1 === 0 ? String(max) : max.toFixed(digits);
				label = `${currencySymbol}${minStr} – ${currencySymbol}${maxStr}`;
			} else {
				const minStr = (min ?? 0) % 1 === 0 ? String(min) : (min ?? 0).toFixed(digits);
				label = `${currencySymbol}${minStr}+`;
			}

			return { label, min, max };
		});
	});

	const sortOptions = [
		{ value: 'newest', label: 'Newest Arrivals' },
		{ value: 'price_asc', label: 'Price: Low to High' },
		{ value: 'price_desc', label: 'Price: High to Low' },
		{ value: 'rating', label: 'Highest Rated' },
		{ value: 'name_asc', label: 'Name: A to Z' },
		{ value: 'name_desc', label: 'Name: Z to A' }
	];

	function getSortLabel(val: string): string {
		return sortOptions.find(o => o.value === val)?.label || 'Newest Arrivals';
	}

	const hasActiveFilters = $derived(
		Boolean(
			data.filters.search ||
			data.filters.category ||
			data.filters.deals ||
			data.filters.inStock ||
			data.filters.minPrice !== null ||
			data.filters.maxPrice !== null ||
			(data.filters.sort && data.filters.sort !== 'newest')
		)
	);

	const activeFilterCount = $derived(
		(data.filters.search ? 1 : 0) +
		(data.filters.category ? 1 : 0) +
		(data.filters.deals ? 1 : 0) +
		(data.filters.inStock ? 1 : 0) +
		(data.filters.minPrice !== null || data.filters.maxPrice !== null ? 1 : 0) +
		(data.filters.sort && data.filters.sort !== 'newest' ? 1 : 0)
	);

	const activeCategory = $derived(
		data.categories.find(
			(c: any) =>
				c.slug.toLowerCase() === (data.filters.category || '').toLowerCase() ||
				c.name.toLowerCase() === (data.filters.category || '').toLowerCase()
		)
	);
</script>

<svelte:head>
	<title>{activeCategory ? activeCategory.name : 'All Products'} — Nexus Catalog</title>
	<meta name="description" content="Browse our catalog of precision hardware, audio monitors, mechanical gear, and accessories." />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
	
	<!-- Breadcrumb & Header Bar -->
	<div class="space-y-4">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				{#if activeCategory}
					<Breadcrumb.Item>
						<Breadcrumb.Link href="/products" onclick={(e) => { e.preventDefault(); updateParams({ category: null }); }}>
							Products
						</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Page>{activeCategory.name}</Breadcrumb.Page>
					</Breadcrumb.Item>
				{:else}
					<Breadcrumb.Item>
						<Breadcrumb.Page>All Products</Breadcrumb.Page>
					</Breadcrumb.Item>
				{/if}
			</Breadcrumb.List>
		</Breadcrumb.Root>

		<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
			<div>
				<h1 class="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
					{activeCategory ? activeCategory.name : 'All Hardware & Gear'}
				</h1>
				<p class="text-sm text-muted-foreground mt-1">
					Showing <span class="font-semibold text-foreground">{data.total}</span> {data.total === 1 ? 'item' : 'items'} in catalog
				</p>
			</div>

			<!-- Mobile Filter Sheet Trigger & Sort Select -->
			<div class="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
				<!-- Mobile Filter Sheet Trigger -->
				<Sheet.Root bind:open={mobileFilterOpen}>
					<Sheet.Trigger class="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-accent cursor-pointer transition-colors shadow-xs">
						<Filter class="h-4 w-4 text-primary" />
						<span>Filters</span>
						{#if activeFilterCount > 0}
							<span class="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
								{activeFilterCount}
							</span>
						{/if}
					</Sheet.Trigger>
					<Sheet.Content side="left" class="w-80 sm:w-96 p-0 flex flex-col justify-between overflow-hidden">
						<!-- Mobile Sheet Header -->
						<div class="p-6 border-b border-border/50 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<SlidersHorizontal class="h-4 w-4 text-primary" />
								<Sheet.Title class="text-base font-bold">Filters</Sheet.Title>
								{#if activeFilterCount > 0}
									<Badge variant="secondary" class="text-xs px-2 py-0.5">
										{activeFilterCount} active
									</Badge>
								{/if}
							</div>
							{#if hasActiveFilters}
								<Button variant="ghost" size="sm" onclick={clearAllFilters} class="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
									Reset
								</Button>
							{/if}
						</div>

						<!-- Mobile Filters Scrollable Body -->
						<div class="p-6 space-y-6 overflow-y-auto flex-1">
							<!-- Availability & Deals Toggles -->
							<div class="space-y-3">
								<h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Status</h4>
								<div class="space-y-2">
									<!-- On Sale Toggle -->
									<label class="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-accent/40 cursor-pointer transition-colors">
										<div class="flex items-center gap-2.5">
											<Sparkles class="h-4 w-4 text-amber-500" />
											<div class="text-xs font-semibold">On Sale & Deals</div>
										</div>
										<Switch checked={data.filters.deals} onCheckedChange={toggleDeals} />
									</label>

									<!-- In Stock Toggle -->
									<label class="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-accent/40 cursor-pointer transition-colors">
										<div class="flex items-center gap-2.5">
											<PackageCheck class="h-4 w-4 text-emerald-500" />
											<div class="text-xs font-semibold">In Stock Only</div>
										</div>
										<Switch checked={data.filters.inStock} onCheckedChange={toggleInStock} />
									</label>
								</div>
							</div>

							<!-- Category Filter -->
							<div class="space-y-3 pt-2 border-t border-border/40">
								<h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</h4>
								<div class="space-y-1">
									<button
										type="button"
										onclick={() => toggleCategory(null)}
										class="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors {!data.filters.category ? 'bg-primary text-primary-foreground shadow-xs' : 'hover:bg-accent text-foreground'}"
									>
										<span>All Departments</span>
										{#if !data.filters.category}
											<Check class="h-3.5 w-3.5" />
										{/if}
									</button>
									{#each data.categories as cat}
										{@const isActive = data.filters.category?.toLowerCase() === cat.slug.toLowerCase()}
										<button
											type="button"
											onclick={() => toggleCategory(cat.slug)}
											class="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors {isActive ? 'bg-primary text-primary-foreground shadow-xs' : 'hover:bg-accent text-foreground'}"
										>
											<div class="flex items-center gap-2.5 truncate">
												<CategoryIcon slug={cat.slug} class="h-3.5 w-3.5 shrink-0" />
												<span class="truncate">{cat.name}</span>
											</div>
											{#if isActive}
												<Check class="h-3.5 w-3.5 shrink-0" />
											{/if}
										</button>
									{/each}
								</div>
							</div>

							<!-- Price Range Filter -->
							<div class="space-y-3 pt-2 border-t border-border/40">
								<div class="flex items-center justify-between">
									<h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Range</h4>
									{#if data.filters.minPrice !== null || data.filters.maxPrice !== null}
										<button
											type="button"
											onclick={clearPriceFilter}
											class="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
										>
											Clear
										</button>
									{/if}
								</div>

								<!-- Quick Price Preset Chips -->
								<div class="grid grid-cols-2 gap-1.5">
									{#each pricePresets as preset}
										{@const isPresetSelected = isPresetActive(preset.min, preset.max)}
										<button
											type="button"
											onclick={() => setPricePreset(preset.min, preset.max)}
											class="px-2.5 py-1.5 rounded-lg border text-xs font-medium text-center transition-colors cursor-pointer {isPresetSelected ? 'bg-primary text-primary-foreground border-primary font-bold' : 'border-border/70 hover:bg-accent text-muted-foreground hover:text-foreground'}"
										>
											{preset.label}
										</button>
									{/each}
								</div>

								<!-- Custom Min / Max Inputs -->
								<form onsubmit={handlePriceFilter} class="space-y-2 pt-1">
									<div class="grid grid-cols-2 gap-2">
										<div class="relative">
											<span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
												{currencySymbol}
											</span>
											<Input
												type="number"
												placeholder="Min"
												min="0"
												bind:value={minPriceInput}
												class="pl-6 h-9 text-xs"
											/>
										</div>
										<div class="relative">
											<span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
												{currencySymbol}
											</span>
											<Input
												type="number"
												placeholder="Max"
												min="0"
												bind:value={maxPriceInput}
												class="pl-6 h-9 text-xs"
											/>
										</div>
									</div>
									<Button type="submit" size="sm" class="w-full h-8 text-xs font-semibold cursor-pointer">
										Apply Price
									</Button>
								</form>
							</div>
						</div>

						<!-- Mobile Sheet Bottom Bar -->
						<div class="p-4 border-t border-border/50 bg-background/95 backdrop-blur-xs">
							<Button onclick={() => { mobileFilterOpen = false; }} class="w-full font-bold shadow-md cursor-pointer">
								Show {data.total} {data.total === 1 ? 'Product' : 'Products'}
							</Button>
						</div>
					</Sheet.Content>
				</Sheet.Root>

				<!-- Sort Dropdown Select -->
				<div class="flex items-center gap-2">
					<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:inline">
						Sort:
					</span>
					<Select.Root
						type="single"
						bind:value={selectedSort}
						onValueChange={(val: string) => {
							if (val && val !== data.filters.sort) {
								updateParams({ sort: val });
							}
						}}
					>
						<Select.Trigger class="h-9 w-44 sm:w-48 text-xs sm:text-sm font-medium">
							<span class="truncate">
								{getSortLabel(data.filters.sort)}
							</span>
						</Select.Trigger>
						<Select.Content align="end">
							{#each sortOptions as opt}
								<Select.Item value={opt.value} label={opt.label}>
									{opt.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>
		</div>

		<!-- Active Filter Badges Bar -->
		{#if hasActiveFilters}
			<div class="flex items-center flex-wrap gap-1.5 pt-1">
				{#if data.filters.search}
					<Badge variant="secondary" class="gap-1.5 text-xs py-1 px-2.5 shadow-2xs">
						<span>Search: "{data.filters.search}"</span>
						<button 
							type="button" 
							onclick={() => updateParams({ search: null })} 
							class="hover:text-destructive cursor-pointer"
							aria-label="Remove search filter"
						>
							<X class="h-3 w-3" />
						</button>
					</Badge>
				{/if}

					{#if activeCategory}
						<Badge variant="secondary" class="gap-1.5 text-xs py-1 px-2.5 shadow-2xs">
							<span>Dept: {activeCategory.name}</span>
							<button 
								type="button" 
								onclick={() => toggleCategory(null)} 
								class="hover:text-destructive cursor-pointer"
								aria-label="Remove category filter"
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					{/if}

					{#if data.filters.deals}
						<Badge variant="secondary" class="gap-1.5 text-xs py-1 px-2.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-2xs">
							<Sparkles class="h-3 w-3" />
							<span>On Sale Only</span>
							<button 
								type="button" 
								onclick={toggleDeals} 
								class="hover:text-destructive cursor-pointer"
								aria-label="Remove deals filter"
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					{/if}

					{#if data.filters.inStock}
						<Badge variant="secondary" class="gap-1.5 text-xs py-1 px-2.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-2xs">
							<PackageCheck class="h-3 w-3" />
							<span>In Stock Only</span>
							<button 
								type="button" 
								onclick={toggleInStock} 
								class="hover:text-destructive cursor-pointer"
								aria-label="Remove in stock filter"
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					{/if}

					{#if data.filters.minPrice !== null || data.filters.maxPrice !== null}
						<Badge variant="secondary" class="gap-1.5 text-xs py-1 px-2.5 shadow-2xs">
							<span>
								{currencySymbol}{data.filters.minPrice ?? 0} – {data.filters.maxPrice ? `${currencySymbol}${data.filters.maxPrice}` : 'Any'}
							</span>
							<button 
								type="button" 
								onclick={clearPriceFilter} 
								class="hover:text-destructive cursor-pointer"
								aria-label="Remove price filter"
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					{/if}

					{#if data.filters.sort && data.filters.sort !== 'newest'}
						<Badge variant="secondary" class="gap-1.5 text-xs py-1 px-2.5 shadow-2xs">
							<span>Sort: {getSortLabel(data.filters.sort)}</span>
							<button 
								type="button" 
								onclick={() => updateParams({ sort: 'newest' })} 
								class="hover:text-destructive cursor-pointer"
								aria-label="Reset sort"
							>
								<X class="h-3 w-3" />
							</button>
						</Badge>
					{/if}

					<Button 
						variant="ghost" 
						size="sm" 
						onclick={clearAllFilters} 
						class="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
					>
						Reset All
					</Button>
				</div>
			{/if}
	</div>

	<!-- Main Catalog Body (Sidebar + Product Grid) -->
	<div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
		
		<!-- Desktop Filter Sidebar -->
		<aside class="hidden lg:block lg:col-span-1 space-y-6 sticky top-24 rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
			<div class="flex items-center justify-between pb-3 border-b border-border/40">
				<div class="flex items-center gap-2 text-sm font-bold text-foreground">
					<SlidersHorizontal class="h-4 w-4 text-primary" />
					<span>Filters</span>
					{#if activeFilterCount > 0}
						<span class="inline-flex items-center justify-center h-4.5 min-w-4.5 px-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
							{activeFilterCount}
						</span>
					{/if}
				</div>
				{#if hasActiveFilters}
					<button 
						type="button" 
						onclick={clearAllFilters} 
						class="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
					>
						Reset All
					</button>
				{/if}
			</div>

			<!-- Product Status Switches (On Sale & In Stock) -->
			<div class="space-y-2.5">
				<h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Status</h4>
				<div class="space-y-2">
					<!-- On Sale Switch -->
					<label class="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-card/50 hover:bg-accent/40 cursor-pointer transition-colors">
						<div class="flex items-center gap-2">
							<Sparkles class="h-3.5 w-3.5 text-amber-500" />
							<span class="text-xs font-semibold">On Sale & Deals</span>
						</div>
						<Switch checked={data.filters.deals} onCheckedChange={toggleDeals} size="sm" />
					</label>

					<!-- In Stock Switch -->
					<label class="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-card/50 hover:bg-accent/40 cursor-pointer transition-colors">
						<div class="flex items-center gap-2">
							<PackageCheck class="h-3.5 w-3.5 text-emerald-500" />
							<span class="text-xs font-semibold">In Stock Only</span>
						</div>
						<Switch checked={data.filters.inStock} onCheckedChange={toggleInStock} size="sm" />
					</label>
				</div>
			</div>

			<!-- Categories List -->
			<div class="space-y-2 pt-4 border-t border-border/40">
				<h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Departments</h4>
				<div class="space-y-1">
					<button
						type="button"
						onclick={() => toggleCategory(null)}
						class="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer {!data.filters.category ? 'bg-primary text-primary-foreground shadow-xs' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}"
					>
						<span>All Departments</span>
						{#if !data.filters.category}
							<Check class="h-3 w-3" />
						{/if}
					</button>
					{#each data.categories as cat}
						{@const isSelected = data.filters.category?.toLowerCase() === cat.slug.toLowerCase()}
						<button
							type="button"
							onclick={() => toggleCategory(cat.slug)}
							class="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer {isSelected ? 'bg-primary text-primary-foreground shadow-xs' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}"
						>
							<div class="flex items-center gap-2 truncate">
								<CategoryIcon slug={cat.slug} class="h-3.5 w-3.5 shrink-0" />
								<span class="truncate">{cat.name}</span>
							</div>
							{#if isSelected}
								<Check class="h-3 w-3 shrink-0" />
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Price Range -->
			<div class="space-y-3 pt-4 border-t border-border/40">
				<div class="flex items-center justify-between">
					<h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Range</h4>
					{#if data.filters.minPrice !== null || data.filters.maxPrice !== null}
						<button
							type="button"
							onclick={clearPriceFilter}
							class="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
						>
							Clear
						</button>
					{/if}
				</div>

				<!-- Quick Preset Chips -->
				<div class="grid grid-cols-2 gap-1.5">
					{#each pricePresets as preset}
						{@const isPresetSelected = isPresetActive(preset.min, preset.max)}
						<button
							type="button"
							onclick={() => setPricePreset(preset.min, preset.max)}
							class="px-2 py-1.5 rounded-lg border text-[11px] font-medium text-center transition-colors cursor-pointer {isPresetSelected ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs' : 'border-border/60 hover:bg-accent text-muted-foreground hover:text-foreground'}"
						>
							{preset.label}
						</button>
					{/each}
				</div>

				<!-- Custom Numeric Range Form -->
				<form onsubmit={handlePriceFilter} class="space-y-2 pt-1">
					<div class="grid grid-cols-2 gap-2">
						<div class="relative">
							<span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
								{currencySymbol}
							</span>
							<Input
								type="number"
								placeholder="Min"
								min="0"
								bind:value={minPriceInput}
								class="pl-6 h-8 text-xs"
							/>
						</div>
						<div class="relative">
							<span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
								{currencySymbol}
							</span>
							<Input
								type="number"
								placeholder="Max"
								min="0"
								bind:value={maxPriceInput}
								class="pl-6 h-8 text-xs"
							/>
						</div>
					</div>
					<Button type="submit" size="sm" variant="outline" class="w-full h-8 text-xs font-semibold cursor-pointer">
						Filter Price
					</Button>
				</form>
			</div>
		</aside>

		<!-- Product Grid (Spans 3 cols on lg) -->
		<div class="lg:col-span-3 space-y-8">
			{#if data.products.length > 0}
				<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
					{#each data.products as product (product.id)}
						<ProductCard {product} />
					{/each}
				</div>

				<!-- Pagination Controls -->
				{#if data.totalPages > 1}
					<div class="pt-8 border-t border-border/40 flex items-center justify-between gap-4">
						<Button
							variant="outline"
							size="sm"
							disabled={data.page <= 1}
							onclick={() => updateParams({ page: String(data.page - 1) })}
							class="gap-1.5 cursor-pointer"
						>
							<ChevronLeft class="h-4 w-4" />
							<span>Previous</span>
						</Button>

						<div class="flex items-center gap-1">
							{#each Array.from({ length: data.totalPages }, (_, i) => i + 1) as pageNum}
								<Button
									variant={pageNum === data.page ? 'default' : 'ghost'}
									size="sm"
									onclick={() => updateParams({ page: String(pageNum) })}
									class="h-8 w-8 p-0 text-xs font-semibold cursor-pointer"
								>
									{pageNum}
								</Button>
							{/each}
						</div>

						<Button
							variant="outline"
							size="sm"
							disabled={data.page >= data.totalPages}
							onclick={() => updateParams({ page: String(data.page + 1) })}
							class="gap-1.5 cursor-pointer"
						>
							<span>Next</span>
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				{/if}
			{:else}
				<!-- Empty Catalog State with Intelligent Recovery Actions -->
				<div class="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 space-y-4">
					<div class="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
						<Search class="h-6 w-6 stroke-[1.5]" />
					</div>
					<div class="space-y-1">
						<h3 class="text-lg font-bold text-foreground">No products match your criteria</h3>
						<p class="text-sm text-muted-foreground max-w-sm">
							{#if data.filters.search}
								No results found for "<span class="font-medium text-foreground">{data.filters.search}</span>". Try another search term or remove some filters.
							{:else}
								Try adjusting or clearing your price, status, or department filters to see more items.
							{/if}
						</p>
					</div>
					<div class="flex items-center gap-2 pt-2">
						{#if data.filters.minPrice !== null || data.filters.maxPrice !== null}
							<Button variant="outline" size="sm" onclick={clearPriceFilter} class="text-xs cursor-pointer">
								Clear Price Filter
							</Button>
						{/if}
						{#if data.filters.category}
							<Button variant="outline" size="sm" onclick={() => toggleCategory(null)} class="text-xs cursor-pointer">
								All Departments
							</Button>
						{/if}
						<Button onclick={clearAllFilters} variant="default" size="sm" class="text-xs cursor-pointer">
							<RotateCcw class="h-3.5 w-3.5 mr-1.5" />
							<span>Reset All Filters</span>
						</Button>
					</div>
				</div>
			{/if}
		</div>

	</div>
</div>
