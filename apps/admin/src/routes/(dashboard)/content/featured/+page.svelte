<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Table from '@repo/ui/lib/components/ui/table/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import { Layers, Sparkles, Plus, Trash2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import ImagePicker from '#lib/components/ImagePicker.svelte';

	let { data, form } = $props();

	let showAddCollection = $state(false);
	let showAddProduct = $state(false);

	let selectedCategoryId = $state(data.allCategories[0]?.id ?? '');
	let selectedCategoryLabel = $derived(
		data.allCategories.find((c: any) => c.id === selectedCategoryId)?.name ?? 'Select a category'
	);

	let selectedProductId = $state(data.allProducts[0]?.id ?? '');
	let selectedProductLabel = $derived(
		data.allProducts.find((p: any) => p.id === selectedProductId)?.name ?? 'Select a product'
	);

	const SECTION_OPTIONS = [
		{ value: 'featured', label: 'Featured Gear' },
		{ value: 'new_arrivals', label: 'New Arrivals' },
		{ value: 'best_sellers', label: 'Best Sellers' },
		{ value: 'trending', label: 'Trending Deals' }
	];

	let selectedSection = $state('featured');
	let selectedSectionLabel = $derived(
		SECTION_OPTIONS.find((s) => s.value === selectedSection)?.label ?? 'Featured Gear'
	);
</script>

<div class="mx-auto max-w-6xl space-y-8 py-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Homepage Curated Content</h1>
		<p class="mt-1 text-xs text-muted-foreground">
			Assign featured categories and curated product showcases across the storefront.
		</p>
	</div>

	{#if form?.message}
		<div
			class="rounded-xl p-4 {form.success
				? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
				: 'border border-destructive/20 bg-destructive/10 text-destructive'} text-xs font-semibold"
		>
			{form.message}
		</div>
	{/if}

	<!-- Section 1: Featured Collections -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Layers class="h-4 w-4 text-primary" />
				<h2 class="text-lg font-bold text-foreground">Featured Collections</h2>
			</div>
			<Button
				size="sm"
				variant="outline"
				onclick={() => (showAddCollection = !showAddCollection)}
				class="gap-1.5 text-xs"
			>
				<Plus class="h-3.5 w-3.5" />
				<span>{showAddCollection ? 'Cancel' : 'Add Collection'}</span>
			</Button>
		</div>

		{#if showAddCollection}
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-sm font-bold">Add Featured Collection</Card.Title>
				</Card.Header>
				<Card.Content>
					<form action="?/addCollection" method="POST" use:enhance class="space-y-3">
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<div>
								<label
									for="category_id"
									class="mb-1 block text-xs font-semibold text-muted-foreground">Category</label
								>
								<input type="hidden" name="category_id" value={selectedCategoryId} />
								<Select.Root type="single" bind:value={selectedCategoryId}>
									<Select.Trigger class="w-full text-xs">
										<span class="truncate">{selectedCategoryLabel}</span>
									</Select.Trigger>
									<Select.Content>
										{#each data.allCategories as cat}
											<Select.Item value={cat.id} label={cat.name} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div>
								<label for="label" class="mb-1 block text-xs font-semibold text-muted-foreground"
									>Custom Label (Optional)</label
								>
								<Input id="label" name="label" placeholder="Custom heading" />
							</div>
							<div class="sm:col-span-3">
								<ImagePicker
									name="image_url"
									folder="featured"
									label="Featured Collection Background Image"
									description="Upload or pick a cover image for the curated collection card (recommended: 800x600 or 4:3)"
									required
								/>
							</div>
						</div>
						<div class="flex items-center justify-between pt-2">
							<label class="flex cursor-pointer items-center gap-2 text-xs">
								<input type="checkbox" name="is_active" checked class="rounded border-border" />
								<span>Active on Homepage</span>
							</label>
							<Button type="submit" size="sm" class="text-xs font-bold">Save Collection</Button>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		{/if}

		<Card.Root>
			<Card.Content class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Category</Table.Head>
							<Table.Head>Custom Label</Table.Head>
							<Table.Head class="text-center">Position</Table.Head>
							<Table.Head class="text-center">Status</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.collections as col}
							<Table.Row>
								<Table.Cell class="text-xs font-bold">{col.category?.name || 'Category'}</Table.Cell
								>
								<Table.Cell class="text-xs text-muted-foreground">{col.label || '—'}</Table.Cell>
								<Table.Cell class="text-center font-mono text-xs">{col.position}</Table.Cell>
								<Table.Cell class="text-center">
									<form action="?/toggleCollectionActive" method="POST" use:enhance class="inline">
										<input type="hidden" name="id" value={col.id} />
										<input type="hidden" name="is_active" value={String(col.is_active)} />
										<button
											type="submit"
											class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase transition-colors {col.is_active
												? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
												: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
										>
											{col.is_active ? 'Active' : 'Inactive'}
										</button>
									</form>
								</Table.Cell>
								<Table.Cell class="text-right">
									<form action="?/deleteCollection" method="POST" use:enhance class="inline">
										<input type="hidden" name="id" value={col.id} />
										<Button
											type="submit"
											variant="ghost"
											size="icon"
											class="h-8 w-8 text-destructive hover:bg-destructive/10"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</form>
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={5} class="py-6 text-center text-xs text-muted-foreground">
									No featured collections configured yet.
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Section 2: Featured Products by Section -->
	<div class="space-y-4 border-t border-border/40 pt-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Sparkles class="h-4 w-4 text-primary" />
				<h2 class="text-lg font-bold text-foreground">Featured Products by Section</h2>
			</div>
			<Button
				size="sm"
				variant="outline"
				onclick={() => (showAddProduct = !showAddProduct)}
				class="gap-1.5 text-xs"
			>
				<Plus class="h-3.5 w-3.5" />
				<span>{showAddProduct ? 'Cancel' : 'Assign Product'}</span>
			</Button>
		</div>

		{#if showAddProduct}
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-sm font-bold">Assign Product to Section</Card.Title>
				</Card.Header>
				<Card.Content>
					<form action="?/addFeaturedProduct" method="POST" use:enhance class="space-y-3">
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<div>
								<label
									for="product_id"
									class="mb-1 block text-xs font-semibold text-muted-foreground">Product</label
								>
								<input type="hidden" name="product_id" value={selectedProductId} />
								<Select.Root type="single" bind:value={selectedProductId}>
									<Select.Trigger class="w-full text-xs">
										<span class="truncate">{selectedProductLabel}</span>
									</Select.Trigger>
									<Select.Content>
										{#each data.allProducts as p}
											<Select.Item value={p.id} label={p.name} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div>
								<label for="section" class="mb-1 block text-xs font-semibold text-muted-foreground"
									>Homepage Section</label
								>
								<input type="hidden" name="section" value={selectedSection} />
								<Select.Root type="single" bind:value={selectedSection}>
									<Select.Trigger class="w-full text-xs">
										<span class="truncate">{selectedSectionLabel}</span>
									</Select.Trigger>
									<Select.Content>
										{#each SECTION_OPTIONS as s}
											<Select.Item value={s.value} label={s.label} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div>
								<label
									for="prod_position"
									class="mb-1 block text-xs font-semibold text-muted-foreground"
									>Sort Position</label
								>
								<Input id="prod_position" name="position" type="number" value="0" />
							</div>
						</div>
						<div class="flex items-center justify-between pt-2">
							<label class="flex cursor-pointer items-center gap-2 text-xs">
								<input type="checkbox" name="is_active" checked class="rounded border-border" />
								<span>Active in Section</span>
							</label>
							<Button type="submit" size="sm" class="text-xs font-bold">Assign Product</Button>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		{/if}

		<Card.Root>
			<Card.Content class="p-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Section</Table.Head>
							<Table.Head>Product</Table.Head>
							<Table.Head class="text-center">Position</Table.Head>
							<Table.Head class="text-center">Status</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.featuredProducts as fp}
							<Table.Row>
								<Table.Cell>
									<Badge variant="outline" class="text-[10px] font-bold uppercase">
										{fp.section.replace('_', ' ')}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-xs font-bold">{fp.product?.name || 'Product'}</Table.Cell>
								<Table.Cell class="text-center font-mono text-xs">{fp.position}</Table.Cell>
								<Table.Cell class="text-center">
									<form action="?/toggleProductActive" method="POST" use:enhance class="inline">
										<input type="hidden" name="id" value={fp.id} />
										<input type="hidden" name="is_active" value={String(fp.is_active)} />
										<button
											type="submit"
											class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase transition-colors {fp.is_active
												? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
												: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
										>
											{fp.is_active ? 'Active' : 'Inactive'}
										</button>
									</form>
								</Table.Cell>
								<Table.Cell class="text-right">
									<form action="?/deleteFeaturedProduct" method="POST" use:enhance class="inline">
										<input type="hidden" name="id" value={fp.id} />
										<Button
											type="submit"
											variant="ghost"
											size="icon"
											class="h-8 w-8 text-destructive hover:bg-destructive/10"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</form>
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={5} class="py-6 text-center text-xs text-muted-foreground">
									No products assigned to sections yet.
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</div>
</div>
