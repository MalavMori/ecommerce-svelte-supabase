<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Label } from '@repo/ui/lib/components/ui/label/index.js';
	import { Textarea } from '@repo/ui/lib/components/ui/textarea/index.js';
	import { Checkbox } from '@repo/ui/lib/components/ui/checkbox/index.js';
	import { LoaderCircle, ChevronLeft, Sparkles, RefreshCw } from 'lucide-svelte';
	import { slugify } from '@repo/utils';
	import { createProduct } from '../products.remote';
	import ImagePicker from '#lib/components/ImagePicker.svelte';

	let { data } = $props();

	let name = $state('');
	let slug = $state('');
	let isCustomSlug = $state(false);
	let category_id = $state('');
	let is_active = $state(true);
	let og_image_url = $state('');

	function handleNameInput(e: Event) {
		name = (e.target as HTMLInputElement).value;
		if (!isCustomSlug) {
			slug = slugify(name);
		}
	}

	function handleSlugInput(e: Event) {
		slug = (e.target as HTMLInputElement).value;
		isCustomSlug = true;
	}

	function regenerateSlug() {
		slug = slugify(name);
		isCustomSlug = false;
	}

	let selectedCategoryLabel = $derived(
		data.categories.find((c) => c.id === category_id)?.name ?? 'Select a category'
	);

	function fp(field: Record<string, unknown>) {
		const { value: _v, checked: _c, ...rest } = field;
		return rest;
	}
</script>

<div class="mx-auto max-w-4xl space-y-6 py-6">
	<div class="flex items-center gap-4">
		<Button href="/products" variant="outline" size="icon">
			<ChevronLeft class="h-4 w-4" />
		</Button>
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Create Product</h2>
			<p class="text-muted-foreground">Add a new product to your store.</p>
		</div>
	</div>

	<form {...createProduct}>
		<div class="grid gap-6 md:grid-cols-[2fr_1fr]">
			<div class="space-y-6">
				<Card.Root>
					<Card.Header>
						<Card.Title>General Information</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="grid gap-2">
							<Label for="name">Name</Label>
							<Input
								id="name"
								placeholder="e.g. Wireless Headphones"
								required
								{...fp(createProduct.fields.name.as('text'))}
								bind:value={name}
								oninput={handleNameInput}
							/>
							{#if createProduct.fields.name.issues()?.length}
								<div class="text-xs text-destructive">
									{createProduct.fields.name.issues()?.[0]?.message}
								</div>
							{/if}
						</div>

						<div class="grid gap-2">
							<div class="flex items-center justify-between">
								<Label for="slug">Slug</Label>
								<button
									type="button"
									class="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
									onclick={regenerateSlug}
									title="Auto-generate slug from name"
								>
									<Sparkles class="h-3 w-3 text-amber-500" />
									<span>Auto-generate</span>
									{#if !isCustomSlug}
										<span class="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Live</span>
									{:else}
										<span class="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Custom</span>
									{/if}
								</button>
							</div>
							<div class="relative flex items-center">
								<Input
									id="slug"
									placeholder="e.g. wireless-headphones"
									required
									class="pr-10 font-mono text-sm"
									{...fp(createProduct.fields.slug.as('text'))}
									bind:value={slug}
									oninput={handleSlugInput}
								/>
								<button
									type="button"
									class="absolute right-2.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer p-0.5"
									title="Generate slug from name"
									onclick={regenerateSlug}
								>
									<RefreshCw class="h-3.5 w-3.5" />
								</button>
							</div>
							<p class="text-xs text-muted-foreground">
								Storefront URL: <span class="font-mono text-foreground/80">/products/{slug || '...'}</span>
							</p>
							{#if createProduct.fields.slug.issues()?.length}
								<div class="text-xs text-destructive">
									{createProduct.fields.slug.issues()?.[0]?.message}
								</div>
							{/if}
						</div>

						<div class="grid gap-2">
							<Label for="description">Description</Label>
							<Textarea
								id="description"
								placeholder="Product description..."
								rows={4}
								{...createProduct.fields.description.as('text')}
							/>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Pricing & Inventory</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="grid grid-cols-2 gap-4">
							<div class="grid gap-2">
								<Label for="price">Price ({data.baseCurrency?.symbol ?? '₹'})</Label>
								<Input
									id="price"
									step="0.01"
									min="0"
									required
									placeholder="0.00"
									{...createProduct.fields.price.as('number')}
								/>
								{#if createProduct.fields.price.issues()?.length}
									<div class="text-xs text-destructive">
										{createProduct.fields.price.issues()?.[0]?.message}
									</div>
								{/if}
							</div>
							<div class="grid gap-2">
								<Label for="compare_at_price">Compare at Price ({data.baseCurrency?.symbol ?? '₹'})</Label>
								<Input
									id="compare_at_price"
									step="0.01"
									min="0"
									placeholder="0.00"
									{...createProduct.fields.compare_at_price.as('number')}
								/>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="grid gap-2">
								<Label for="stock_quantity">Stock Quantity</Label>
								<Input
									id="stock_quantity"
									min="0"
									required
									placeholder="0"
									{...createProduct.fields.stock_quantity.as('number')}
								/>
								{#if createProduct.fields.stock_quantity.issues()?.length}
									<div class="text-xs text-destructive">
										{createProduct.fields.stock_quantity.issues()?.[0]?.message}
									</div>
								{/if}
							</div>
							<div class="grid gap-2">
								<Label for="sku">SKU (Optional)</Label>
								<Input
									id="sku"
									placeholder="e.g. WH-001"
									{...createProduct.fields.sku.as('text')}
								/>
								{#if createProduct.fields.sku.issues()?.length}
									<div class="text-xs text-destructive">
										{createProduct.fields.sku.issues()?.[0]?.message}
									</div>
								{/if}
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Search Engine & Social Media (SEO)</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="grid gap-2">
							<Label for="meta_title">SEO Meta Title</Label>
							<Input
								id="meta_title"
								placeholder="e.g. Wireless Pro Headset — Premium Noise Cancelling"
								{...createProduct.fields.meta_title.as('text')}
							/>
						</div>

						<div class="grid gap-2">
							<Label for="meta_description">SEO Meta Description</Label>
							<Textarea
								id="meta_description"
								placeholder="Brief summary for search engine snippet..."
								rows={3}
								{...createProduct.fields.meta_description.as('text')}
							/>
						</div>

						<div class="grid gap-2">
							<ImagePicker
								field={createProduct.fields.og_image_url}
								folder="products/og"
								label="Social Share (OG) Image"
								description="Preview card image for social shares (1200x630px recommended)"
								bind:value={og_image_url}
							/>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="space-y-6">
				<Card.Root>
					<Card.Header>
						<Card.Title>Organization</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="grid gap-2">
							<Label for="category_id">Category</Label>
							<input
								type="hidden"
								{...fp(createProduct.fields.category_id.as('select'))}
								value={category_id}
							/>
							<Select.Root type="single" bind:value={category_id}>
								<Select.Trigger class="w-full">
									{selectedCategoryLabel}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="" label="No category" />
									{#each data.categories as cat}
										<Select.Item value={cat.id} label={cat.name} />
									{/each}
								</Select.Content>
							</Select.Root>
							{#if createProduct.fields.category_id.issues()?.length}
								<div class="text-xs text-destructive">
									{createProduct.fields.category_id.issues()?.[0]?.message}
								</div>
							{/if}
						</div>

						<div class="grid gap-2">
							<Label class="mt-4 flex cursor-pointer items-center gap-2">
								<Checkbox
									id="is_active"
									{...fp(createProduct.fields.is_active.as('checkbox'))}
									bind:checked={is_active}
								/>
								<span>Active (Visible in store)</span>
							</Label>
						</div>
					</Card.Content>
				</Card.Root>

				<div class="flex justify-end gap-4">
					<Button type="button" variant="outline" href="/products">Cancel</Button>
					<Button type="submit" disabled={createProduct.pending > 0}>
						{#if createProduct.pending > 0}
							<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Save Product
					</Button>
				</div>
			</div>
		</div>
	</form>
</div>
