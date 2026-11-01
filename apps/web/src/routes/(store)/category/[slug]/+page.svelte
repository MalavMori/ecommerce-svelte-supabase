<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { 
		ChevronLeft, 
		ChevronRight, 
		Search, 
		SlidersHorizontal, 
		ArrowLeft,
		Package
	} from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import * as Breadcrumb from '@repo/ui/lib/components/ui/breadcrumb/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import ProductCard from '#lib/components/ProductCard.svelte';
	import CategoryIcon from '#lib/components/CategoryIcon.svelte';

	let { data } = $props();

	async function updateSort(newSort: string) {
		const currentUrl = new URL(page.url.toString());
		currentUrl.searchParams.set('sort', newSort);
		currentUrl.searchParams.delete('page');
		await goto(currentUrl.pathname + currentUrl.search);
		await invalidateAll();
	}

	async function updatePage(newPage: number) {
		const currentUrl = new URL(page.url.toString());
		currentUrl.searchParams.set('page', String(newPage));
		await goto(currentUrl.pathname + currentUrl.search);
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>{data.category.name} — Nexus</title>
	<meta name="description" content="Shop the complete {data.category.name} collection at Nexus." />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
	
	<!-- Breadcrumbs -->
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/products">Products</Breadcrumb.Link>
			</Breadcrumb.Item>
			{#if data.ancestors && data.ancestors.length > 0}
				{#each data.ancestors as ancestor}
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Link href="/category/{ancestor.slug}">{ancestor.name}</Breadcrumb.Link>
					</Breadcrumb.Item>
				{/each}
			{/if}
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>{data.category.name}</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!-- Category Hero Banner -->
	<div class="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card/80 to-muted/40 p-8 sm:p-12 shadow-xs">
		<div class="relative z-10 max-w-2xl space-y-4">
			<div class="inline-flex items-center gap-2 rounded-xl bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold">
				<CategoryIcon slug={data.category.slug} class="h-4 w-4" />
				<span>Department</span>
			</div>

			<h1 class="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
				{data.category.name}
			</h1>

			<p class="text-sm sm:text-base text-muted-foreground leading-relaxed">
				Explore our precision-engineered collection of {data.category.name.toLowerCase()} featuring high-performance specifications, ergonomic materials, and official 2-year warranty coverage.
			</p>

			<div class="flex items-center gap-2">
				<span class="text-xs font-semibold text-primary">
					{data.total} {data.total === 1 ? 'Product Available' : 'Products Available'}
				</span>
				{#if data.subcategories && data.subcategories.length > 0}
					<span class="text-xs text-muted-foreground">
						• Across {data.subcategories.length} {data.subcategories.length === 1 ? 'subcategory' : 'subcategories'}
					</span>
				{/if}
			</div>
		</div>

		<div class="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
	</div>

	<!-- Subcategories Navigation (when parent category) -->
	{#if data.subcategories && data.subcategories.length > 0}
		<div class="rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5 backdrop-blur-xs space-y-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<SlidersHorizontal class="h-3.5 w-3.5 text-primary" />
					<h2 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
						Subcategories
					</h2>
				</div>
				<span class="text-xs text-muted-foreground">
					{data.subcategories.length} {data.subcategories.length === 1 ? 'department' : 'departments'}
				</span>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<a
					href="/category/{data.category.slug}"
					class="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-colors"
				>
					<span>All {data.category.name}</span>
					<span class="rounded-full bg-primary-foreground/20 px-1.5 py-0.2 text-[10px] font-bold">
						{data.total}
					</span>
				</a>
				{#each data.subcategories as sub}
					<a
						href="/category/{sub.slug}"
						class="group inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3.5 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/50 hover:bg-muted hover:text-primary"
					>
						<CategoryIcon slug={sub.slug} class="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
						<span>{sub.name}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Filter & Sort Bar -->
	<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
		<div class="flex items-center gap-2">
			{#if data.ancestors && data.ancestors.length > 0}
				{@const parent = data.ancestors[data.ancestors.length - 1]}
				<Button variant="ghost" size="sm" href="/category/{parent.slug}" class="text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground">
					<ArrowLeft class="h-3.5 w-3.5" />
					<span>Back to {parent.name}</span>
				</Button>
			{:else}
				<Button variant="ghost" size="sm" href="/products" class="text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground">
					<ArrowLeft class="h-3.5 w-3.5" />
					<span>All Products</span>
				</Button>
			{/if}
		</div>

		<!-- Sort Select -->
		<div class="flex items-center gap-2 self-end sm:self-auto">
			<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
				Sort:
			</span>
			<Select.Root
				type="single"
				value={data.filters.sort}
				onValueChange={(val: string) => {
					if (val) updateSort(val);
				}}
			>
				<Select.Trigger class="h-9 w-44 text-xs font-semibold">
					<span class="truncate">
						{data.filters.sort === 'price_asc'
							? 'Price: Low to High'
							: data.filters.sort === 'price_desc'
								? 'Price: High to Low'
								: data.filters.sort === 'rating'
									? 'Highest Rated'
									: 'Newest Arrivals'}
					</span>
				</Select.Trigger>
				<Select.Content align="end">
					<Select.Item value="newest" label="Newest Arrivals">Newest Arrivals</Select.Item>
					<Select.Item value="price_asc" label="Price: Low to High">Price: Low to High</Select.Item>
					<Select.Item value="price_desc" label="Price: High to Low">Price: High to Low</Select.Item>
					<Select.Item value="rating" label="Highest Rated">Highest Rated</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<!-- Product Grid -->
	{#if data.products.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{#each data.products as product}
				<ProductCard {product} />
			{/each}
		</div>

		<!-- Pagination -->
		{#if data.totalPages > 1}
			<div class="pt-8 border-t border-border/40 flex items-center justify-between gap-4">
				<Button
					variant="outline"
					size="sm"
					disabled={data.page <= 1}
					onclick={() => updatePage(data.page - 1)}
					class="gap-1.5"
				>
					<ChevronLeft class="h-4 w-4" />
					<span>Previous</span>
				</Button>

				<div class="flex items-center gap-1">
					{#each Array.from({ length: data.totalPages }, (_, i) => i + 1) as pageNum}
						<Button
							variant={pageNum === data.page ? 'default' : 'ghost'}
							size="sm"
							onclick={() => updatePage(pageNum)}
							class="h-8 w-8 p-0 text-xs font-semibold"
						>
							{pageNum}
						</Button>
					{/each}
				</div>

				<Button
					variant="outline"
					size="sm"
					disabled={data.page >= data.totalPages}
					onclick={() => updatePage(data.page + 1)}
					class="gap-1.5"
				>
					<span>Next</span>
					<ChevronRight class="h-4 w-4" />
				</Button>
			</div>
		{/if}
	{:else}
		<div class="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 space-y-4">
			<div class="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
				<Package class="h-6 w-6 stroke-[1.5]" />
			</div>
			<div class="space-y-1">
				<h3 class="text-lg font-bold text-foreground">No products in this category yet</h3>
				<p class="text-sm text-muted-foreground max-w-sm">
					We are continuously restocking new hardware. Check back soon or explore other departments.
				</p>
			</div>
			<Button href="/products" variant="default" class="mt-2">
				<span>Explore All Products</span>
			</Button>
		</div>
	{/if}

</div>
