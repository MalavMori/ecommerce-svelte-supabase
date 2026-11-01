<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Table from '@repo/ui/lib/components/ui/table/index.js';
	import * as Dialog from '@repo/ui/lib/components/ui/dialog/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Label } from '@repo/ui/lib/components/ui/label/index.js';
	import { Textarea } from '@repo/ui/lib/components/ui/textarea/index.js';
	import { Checkbox } from '@repo/ui/lib/components/ui/checkbox/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import {
		LoaderCircle,
		ChevronLeft,
		ImagePlus,
		X,
		CheckCircle2,
		Plus,
		Trash2,
		Pencil,
		Layers,
		Zap,
		Tag,
		Sparkles,
		RefreshCw
	} from 'lucide-svelte';
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { slugify } from '@repo/utils';
	import { updateProduct } from '../products.remote';
	import ImagePicker from '#lib/components/ImagePicker.svelte';
	import { formatBasePrice } from '#lib';

	let { data, form } = $props();

	function generateSlugFromName() {
		slug = slugify(name);
	}

	// Show success banner when redirected from product creation
	let justCreated = $derived(page.url.searchParams.get('created') === '1');
	let bannerDismissed = $state(false);
	let showSuccessBanner = $derived(justCreated && !bannerDismissed);

	// Local state for product editing
	let name = $state(data.product.name ?? '');
	let slug = $state(data.product.slug ?? '');
	let description = $state(data.product.description ?? '');
	let price = $state(data.product.price ?? '');
	let compare_at_price = $state(data.product.compare_at_price ?? '');
	let stock_quantity = $state(data.product.stock_quantity ?? '');
	let sku = $state(data.product.sku ?? '');
	let category_id = $state(data.product.category_id ?? '');
	let is_active = $state(data.product.is_active ?? false);
	let meta_title = $state(data.product.meta_title ?? '');
	let meta_description = $state(data.product.meta_description ?? '');
	let og_image_url = $state(data.product.og_image_url ?? '');

	let selectedCategoryLabel = $derived(
		data.categories.find((c: any) => c.id === category_id)?.name ?? 'Select a category'
	);

	function fp(field: Record<string, unknown>) {
		const { value: _v, checked: _c, ...rest } = field;
		return rest;
	}

	// Image upload & management state
	let uploadInput: HTMLInputElement | null = $state(null);
	let uploading = $state(false);
	let deletingId = $state<string | null>(null);
	let showAddImageModal = $state(false);
	let newGalleryImageUrl = $state('');
	let replacingImage = $state<any | null>(null);
	let replacementImageUrl = $state('');

	// Option creation state
	let showAddOptionDialog = $state(false);
	let newOptionName = $state('');

	// Variant modal state
	let showVariantDialog = $state(false);
	let editingVariant = $state<any | null>(null);
	let variantSku = $state('');
	let variantPrice = $state<string | number>('');
	let variantComparePrice = $state<string | number>('');
	let variantStock = $state<string | number>(0);
	let variantIsActive = $state(true);
	let variantSalePrice = $state<string | number>('');
	let variantSaleStartsAt = $state('');
	let variantSaleEndsAt = $state('');
	let variantSelectedOptionValues = $state<Record<string, string>>({}); // optionId -> optionValueId

	function openAddVariant() {
		editingVariant = null;
		variantSku = '';
		variantPrice = data.product.price ?? '';
		variantComparePrice = data.product.compare_at_price ?? '';
		variantStock = data.product.stock_quantity ?? 0;
		variantIsActive = true;
		variantSalePrice = '';
		variantSaleStartsAt = '';
		variantSaleEndsAt = '';
		variantSelectedOptionValues = {};
		// Default to first value of each option
		for (const opt of data.options) {
			if (opt.product_option_values.length > 0) {
				variantSelectedOptionValues[opt.id] = opt.product_option_values[0].id;
			}
		}
		showVariantDialog = true;
	}

	function openEditVariant(v: any) {
		editingVariant = v;
		variantSku = v.sku ?? '';
		variantPrice = v.price ?? '';
		variantComparePrice = v.compare_at_price ?? '';
		variantStock = v.stock_quantity ?? 0;
		variantIsActive = v.is_active ?? true;
		variantSalePrice = v.sale_price ?? '';
		variantSaleStartsAt = v.sale_starts_at
			? new Date(v.sale_starts_at).toISOString().slice(0, 16)
			: '';
		variantSaleEndsAt = v.sale_ends_at ? new Date(v.sale_ends_at).toISOString().slice(0, 16) : '';

		const map: Record<string, string> = {};
		for (const link of v.variant_option_values || []) {
			const pov = link.product_option_values;
			if (pov) {
				map[pov.option_id] = pov.id;
			}
		}
		variantSelectedOptionValues = map;
		showVariantDialog = true;
	}

	function isFlashSaleActive(v: any) {
		if (v.sale_price == null) return false;
		const now = new Date();
		if (v.sale_starts_at && now < new Date(v.sale_starts_at)) return false;
		if (v.sale_ends_at && now > new Date(v.sale_ends_at)) return false;
		return true;
	}

	function getVariantLabel(v: any) {
		const parts: string[] = [];
		for (const link of v.variant_option_values || []) {
			const pov = link.product_option_values;
			if (pov) {
				const opt = data.options.find((o: any) => o.id === pov.option_id);
				parts.push(`${opt ? opt.name : 'Option'}: ${pov.value}`);
			}
		}
		return parts.length > 0 ? parts.join(' / ') : 'Default Variant';
	}

	function getVariantDisplay(v: any) {
		if (!v || !v.id) return 'All Variants (General)';
		return `${getVariantLabel(v)} (${v.sku || 'No SKU'})`;
	}

	let inlineVariantId = $state('');
	let inlineVariantLabel = $derived(
		inlineVariantId
			? getVariantDisplay(data.variants.find((v: any) => v.id === inlineVariantId))
			: 'All Variants (General photo)'
	);

	let modalVariantId = $state('');
	let modalVariantLabel = $derived(
		modalVariantId
			? (() => {
					const v = data.variants.find((v: any) => v.id === modalVariantId);
					return v
						? `${v.sku || 'Variant'} — ${formatBasePrice(v.price, data.baseCurrency)}`
						: 'All Variants (General gallery photo)';
				})()
			: 'All Variants (General gallery photo)'
	);

	let selectedImageVariants = $state<Record<string, string>>({});

	function getVariantLabelForId(id: string) {
		if (!id) return 'All Variants (General)';
		const v = data.variants.find((v: any) => v.id === id);
		return v ? getVariantDisplay(v) : 'All Variants (General)';
	}
</script>

<div class="mx-auto max-w-5xl space-y-8 py-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button href="/products" variant="outline" size="icon">
			<ChevronLeft class="h-4 w-4" />
		</Button>
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Edit Product</h2>
			<p class="text-muted-foreground">
				Manage product details, pricing, options, variants, and SEO.
			</p>
		</div>
	</div>

	<!-- Alert Messages -->
	{#if showSuccessBanner}
		<div
			class="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-xs"
		>
			<div class="flex items-center gap-3.5">
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
				>
					<CheckCircle2 class="h-5 w-5" />
				</div>
				<div>
					<p class="text-sm font-semibold text-foreground">Product created successfully!</p>
					<p class="text-xs text-muted-foreground">
						You can now configure options, variants, and upload photos below.
					</p>
				</div>
			</div>
			<button
				type="button"
				onclick={() => {
					bannerDismissed = true;
				}}
				class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-label="Dismiss message"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	{/if}

	{#if form?.error}
		<div
			class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs font-semibold text-destructive"
		>
			{form.error}
		</div>
	{/if}

	<!-- ─── Core Product Form ─── -->
	<form {...updateProduct}>
		<input type="hidden" {...fp(updateProduct.fields.id.as('text'))} value={data.product.id} />

		<div class="grid gap-6 md:grid-cols-[2fr_1fr]">
			<!-- Left Column: Details & Pricing -->
			<div class="space-y-6">
				<!-- Basic Info -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Product Information</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="grid gap-2">
							<Label for="name">Product Name</Label>
							<Input
								id="name"
								required
								{...fp(updateProduct.fields.name.as('text'))}
								bind:value={name}
							/>
							{#if updateProduct.fields.name.issues()?.length}
								<div class="text-xs text-destructive">
									{updateProduct.fields.name.issues()?.[0]?.message}
								</div>
							{/if}
						</div>

						<div class="grid gap-2">
							<div class="flex items-center justify-between">
								<Label for="slug">URL Slug</Label>
								<button
									type="button"
									class="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
									onclick={generateSlugFromName}
									title="Regenerate slug from current product name"
								>
									<Sparkles class="h-3 w-3 text-amber-500" />
									<span>Generate from Name</span>
								</button>
							</div>
							<div class="relative flex items-center">
								<Input
									id="slug"
									required
									class="pr-10 font-mono text-sm"
									{...fp(updateProduct.fields.slug.as('text'))}
									bind:value={slug}
								/>
								<button
									type="button"
									class="absolute right-2.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer p-0.5"
									title="Regenerate slug from product name"
									onclick={generateSlugFromName}
								>
									<RefreshCw class="h-3.5 w-3.5" />
								</button>
							</div>
							<p class="text-xs text-muted-foreground">
								Storefront URL: <span class="font-mono text-foreground/80">/products/{slug || '...'}</span>
							</p>
							{#if updateProduct.fields.slug.issues()?.length}
								<div class="text-xs text-destructive">
									{updateProduct.fields.slug.issues()?.[0]?.message}
								</div>
							{/if}
						</div>

						<div class="grid gap-2">
							<Label for="description">Description</Label>
							<Textarea
								id="description"
								rows={4}
								{...fp(updateProduct.fields.description.as('text'))}
								bind:value={description}
							/>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- Base Pricing & Inventory (Informational fallback) -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Base Pricing & Inventory</Card.Title>
						<Card.Description
							>Default values used when no specific variant price is set.</Card.Description
						>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="grid grid-cols-2 gap-4">
							<div class="grid gap-2">
								<Label for="price">Base Price ({data.baseCurrency?.symbol ?? '₹'})</Label>
								<Input
									id="price"
									step="0.01"
									min="0"
									required
									{...fp(updateProduct.fields.price.as('number'))}
									bind:value={price}
								/>
							</div>
							<div class="grid gap-2">
								<Label for="compare_at_price">Compare-at Price ({data.baseCurrency?.symbol ?? '₹'})</Label>
								<Input
									id="compare_at_price"
									step="0.01"
									min="0"
									{...fp(updateProduct.fields.compare_at_price.as('number'))}
									bind:value={compare_at_price}
								/>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="grid gap-2">
								<Label for="stock_quantity">Total Stock</Label>
								<Input
									id="stock_quantity"
									min="0"
									required
									{...fp(updateProduct.fields.stock_quantity.as('number'))}
									bind:value={stock_quantity}
								/>
							</div>
							<div class="grid gap-2">
								<Label for="sku">Base SKU</Label>
								<Input
									id="sku"
									placeholder="e.g. PRD-001"
									{...fp(updateProduct.fields.sku.as('text'))}
									bind:value={sku}
								/>
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<!-- SEO Metadata -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Search Engine Optimization (SEO)</Card.Title>
						<Card.Description
							>Configure title, meta description, and social share image tags.</Card.Description
						>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="grid gap-2">
							<Label for="meta_title">Meta Title</Label>
							<Input
								id="meta_title"
								placeholder="Custom page title tag"
								{...fp(updateProduct.fields.meta_title.as('text'))}
								bind:value={meta_title}
							/>
						</div>
						<div class="grid gap-2">
							<Label for="meta_description">Meta Description</Label>
							<Textarea
								id="meta_description"
								rows={3}
								placeholder="Brief summary displayed in search engines"
								{...fp(updateProduct.fields.meta_description.as('text'))}
								bind:value={meta_description}
							/>
						</div>
						<div class="grid gap-2">
							<ImagePicker
								field={updateProduct.fields.og_image_url}
								folder="products/og"
								label="OpenGraph Social Share Image"
								description="Social preview image used for Twitter Cards, Facebook, and link sharing (1200x630px recommended)"
								bind:value={og_image_url}
							/>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Right Column: Status & Category -->
			<div class="space-y-6">
				<Card.Root>
					<Card.Header>
						<Card.Title>Status & Organization</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="flex items-center space-x-2">
							<Checkbox
								id="is_active"
								{...fp(updateProduct.fields.is_active.as('checkbox'))}
								bind:checked={is_active}
							/>
							<Label for="is_active" class="cursor-pointer font-medium"
								>Active (Visible in Store)</Label
							>
						</div>

						<div class="grid gap-2">
							<Label for="category">Category</Label>
							<Select.Root type="single" bind:value={category_id}>
								<Select.Trigger class="w-full">
									<span>{selectedCategoryLabel}</span>
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="">None</Select.Item>
									{#each data.categories as cat}
										<Select.Item value={cat.id}>{cat.name}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<input
								type="hidden"
								{...fp(updateProduct.fields.category_id.as('text'))}
								value={category_id}
							/>
						</div>
					</Card.Content>
				</Card.Root>

				<div class="flex justify-end gap-3">
					<Button type="button" variant="outline" href="/products">Cancel</Button>
					<Button type="submit" disabled={updateProduct.pending > 0} class="font-bold">
						{#if updateProduct.pending > 0}
							<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Save Product
					</Button>
				</div>
			</div>
		</div>
	</form>

	<!-- ─── Product Options Manager ─── -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<div>
				<div class="flex items-center gap-2">
					<Layers class="h-4 w-4 text-primary" />
					<Card.Title>Product Options (e.g. Color, Size, Storage)</Card.Title>
				</div>
				<Card.Description>Define the option dimensions used to construct variants.</Card.Description
				>
			</div>
			<Button
				variant="outline"
				size="sm"
				onclick={() => (showAddOptionDialog = true)}
				class="gap-1.5 font-bold"
			>
				<Plus class="h-4 w-4" /> Add Option
			</Button>
		</Card.Header>
		<Card.Content>
			{#if data.options.length === 0}
				<div
					class="rounded-lg border border-dashed bg-muted/20 py-6 text-center text-xs text-muted-foreground"
				>
					No options defined yet. Click "Add Option" to define dimensions like Color or Size.
				</div>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2">
					{#each data.options as opt}
						<div class="space-y-3 rounded-xl border border-border bg-card p-4">
							<div class="flex items-center justify-between">
								<span class="flex items-center gap-1.5 text-sm font-bold text-foreground">
									<Tag class="h-3.5 w-3.5 text-muted-foreground" />
									{opt.name}
								</span>
								<form method="POST" action="?/deleteOption" use:enhance>
									<input type="hidden" name="optionId" value={opt.id} />
									<Button
										type="submit"
										variant="ghost"
										size="icon"
										class="h-7 w-7 text-muted-foreground hover:text-destructive"
									>
										<Trash2 class="h-3.5 w-3.5" />
									</Button>
								</form>
							</div>

							<!-- Values Chips -->
							<div class="flex flex-wrap gap-1.5">
								{#each opt.product_option_values as val}
									<div
										class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-semibold text-foreground"
									>
										<span>{val.value}</span>
										<form method="POST" action="?/deleteOptionValue" use:enhance class="inline">
											<input type="hidden" name="valueId" value={val.id} />
											<button
												type="submit"
												class="ml-0.5 text-muted-foreground hover:text-destructive"
												aria-label="Delete value"
											>
												<X class="h-3 w-3" />
											</button>
										</form>
									</div>
								{/each}
								{#if opt.product_option_values.length === 0}
									<span class="text-xs text-muted-foreground italic">No values added yet.</span>
								{/if}
							</div>

							<!-- Add Value Form -->
							<form
								method="POST"
								action="?/addOptionValue"
								use:enhance
								class="flex items-center gap-2 border-t border-border/40 pt-1"
							>
								<input type="hidden" name="optionId" value={opt.id} />
								<Input
									name="value"
									placeholder="Add value (e.g. Red, XL)..."
									class="h-8 flex-1 text-xs"
									required
								/>
								<Button
									type="submit"
									size="sm"
									variant="secondary"
									class="h-8 px-2.5 text-xs font-bold"
								>
									<Plus class="mr-1 h-3 w-3" /> Add
								</Button>
							</form>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- ─── Product Variants & Flash Sales Table ─── -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between pb-3">
			<div>
				<div class="flex items-center gap-2">
					<Zap class="h-4 w-4 text-amber-500" />
					<Card.Title>Purchasable Variants & Flash Sales</Card.Title>
				</div>
				<Card.Description
					>Manage individual SKUs, stock levels, regular prices, and flash sale date windows.</Card.Description
				>
			</div>
			<Button onclick={openAddVariant} size="sm" class="gap-1.5 font-bold">
				<Plus class="h-4 w-4" /> Add Variant
			</Button>
		</Card.Header>
		<Card.Content class="p-0">
			{#if data.variants.length === 0}
				<div class="py-10 text-center text-xs text-muted-foreground">
					No variants created yet. Click "Add Variant" to create a purchasable SKU.
				</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Options</Table.Head>
							<Table.Head>SKU</Table.Head>
							<Table.Head class="text-right">Price ({data.baseCurrency?.symbol ?? '₹'})</Table.Head>
							<Table.Head class="text-right">Flash Sale</Table.Head>
							<Table.Head class="text-right">Stock</Table.Head>
							<Table.Head class="text-center">Status</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.variants as v}
							{@const onSale = isFlashSaleActive(v)}
							<Table.Row>
								<Table.Cell class="text-xs font-medium">
									<span class="font-semibold text-foreground">{getVariantLabel(v)}</span>
								</Table.Cell>
								<Table.Cell class="font-mono text-xs text-muted-foreground"
									>{v.sku || '—'}</Table.Cell
								>
								<Table.Cell class="text-right text-xs">
									<div class="font-bold text-foreground">{formatBasePrice(v.price, data.baseCurrency)}</div>
									{#if v.compare_at_price}
										<div class="text-[10px] text-muted-foreground line-through">
											{formatBasePrice(v.compare_at_price, data.baseCurrency)}
										</div>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right text-xs">
									{#if v.sale_price != null}
										<div class="space-y-0.5">
											<span class="font-black text-emerald-600 dark:text-emerald-400"
												>{formatBasePrice(v.sale_price, data.baseCurrency)}</span
											>
											{#if onSale}
												<Badge
													class="ml-1 bg-amber-500 px-1.5 py-0 text-[10px] font-bold text-white hover:bg-amber-600"
												>
													LIVE SALE
												</Badge>
											{:else}
												<span class="block text-[10px] text-muted-foreground">Scheduled/Ended</span>
											{/if}
										</div>
									{:else}
										<span class="text-xs text-muted-foreground">—</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right font-mono text-xs">
									<span
										class={v.stock_quantity <= 0 ? 'font-bold text-destructive' : 'text-foreground'}
									>
										{v.stock_quantity}
									</span>
								</Table.Cell>
								<Table.Cell class="text-center">
									{#if v.is_active}
										<Badge
											variant="outline"
											class="border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600"
											>Active</Badge
										>
									{:else}
										<Badge variant="outline" class="text-[11px] text-muted-foreground"
											>Inactive</Badge
										>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-1">
										<Button
											variant="ghost"
											size="icon"
											class="h-7 w-7"
											onclick={() => openEditVariant(v)}
										>
											<Pencil class="h-3.5 w-3.5" />
										</Button>
										<form method="POST" action="?/deleteVariant" use:enhance>
											<input type="hidden" name="variantId" value={v.id} />
											<Button
												type="submit"
												variant="ghost"
												size="icon"
												class="h-7 w-7 text-muted-foreground hover:text-destructive"
											>
												<Trash2 class="h-3.5 w-3.5" />
											</Button>
										</form>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- ─── Product Images Gallery & Variant Association ─── -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title>Product Images & Variant Mapping</Card.Title>
					<Card.Description
						>Upload gallery photos and link them to specific product variants.</Card.Description
					>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onclick={() => (showAddImageModal = true)}
					class="gap-1.5 font-bold"
				>
					<ImagePlus class="h-4 w-4" />
					<span>Add Photo</span>
				</Button>
			</div>
		</Card.Header>
		<Card.Content class="space-y-6">
			<!-- Direct Quick Add Dropzone via ImagePicker -->
			<div class="rounded-xl border border-dashed border-border/80 bg-muted/10 p-4 transition-all hover:bg-muted/20">
				<form
					method="POST"
					action="?/uploadImage"
					use:enhance={() => {
						uploading = true;
						return async ({ update }) => {
							await update({ reset: false });
							newGalleryImageUrl = '';
							inlineVariantId = '';
							uploading = false;
						};
					}}
					class="space-y-3"
				>
					<ImagePicker
						name="url"
						bucket="product-images"
						folder={data.product.id}
						label="Add Image to Gallery"
						description="Drag and drop photo here, browse files, or choose from Media Library"
						bind:value={newGalleryImageUrl}
					/>

					{#if newGalleryImageUrl}
						<div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/40">
							<div class="flex items-center gap-2 w-full sm:w-auto">
								<Label for="inline-gallery-variant" class="text-xs font-semibold text-muted-foreground shrink-0">
									Link Variant:
								</Label>
								<input type="hidden" name="variant_id" value={inlineVariantId} />
								<Select.Root type="single" bind:value={inlineVariantId}>
									<Select.Trigger id="inline-gallery-variant" size="sm" class="h-8 min-w-[200px] text-xs font-normal">
										<span class="truncate">{inlineVariantLabel}</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="" label="All Variants (General photo)" />
										{#each data.variants as v}
											<Select.Item value={v.id} label={getVariantDisplay(v)} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div class="flex items-center gap-2 ml-auto">
								<Button type="button" variant="ghost" size="sm" onclick={() => { newGalleryImageUrl = ''; inlineVariantId = ''; }}>
									Cancel
								</Button>
								<Button type="submit" size="sm" disabled={uploading} class="font-bold gap-1.5">
									{#if uploading}
										<LoaderCircle class="h-4 w-4 animate-spin" />
										<span>Saving…</span>
									{:else}
										<Plus class="h-4 w-4" />
										<span>Save to Gallery</span>
									{/if}
								</Button>
							</div>
						</div>
					{/if}
				</form>
			</div>

			<!-- Current Gallery Photos -->
			{#if data.images.length === 0}
				<div class="py-6 text-center text-xs text-muted-foreground">
					No photos in gallery yet. Use the upload area above to add your first product image.
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
					{#each data.images as img, index (img.id)}
						<div
							class="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs"
						>
							<div class="relative aspect-square w-full overflow-hidden bg-muted">
								<img
									src={img.url}
									alt="Product"
									class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
								/>
								{#if index === 0}
									<span class="absolute top-2 left-2 rounded-md bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground uppercase tracking-wider shadow-xs">
										Primary
									</span>
								{/if}

								<div class="absolute top-2 right-2 flex items-center gap-1 opacity-0 shadow-xs transition-opacity group-hover:opacity-100">
									<Button
										type="button"
										variant="secondary"
										size="icon"
										class="h-7 w-7 rounded-full bg-background/90 text-foreground hover:bg-background"
										title="Replace photo"
										onclick={() => {
											replacingImage = img;
											replacementImageUrl = img.url;
										}}
									>
										<RefreshCw class="h-3 w-3" />
									</Button>
									<form
										method="POST"
										action="?/deleteImage"
										use:enhance={() => {
											deletingId = img.id;
											return async ({ update }) => {
												await update({ reset: false });
												deletingId = null;
											};
										}}
									>
										<input type="hidden" name="id" value={img.id} />
										<input type="hidden" name="url" value={img.url} />
										<button
											type="submit"
											disabled={deletingId === img.id}
											class="flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
											aria-label="Delete image"
										>
											{#if deletingId === img.id}
												<LoaderCircle class="h-3.5 w-3.5 animate-spin" />
											{:else}
												<X class="h-3.5 w-3.5" />
											{/if}
										</button>
									</form>
								</div>
							</div>

							<!-- Variant Selector Dropdown -->
							<div class="border-t border-border/40 bg-muted/30 p-2">
								<form id="image-form-{img.id}" method="POST" action="?/updateImageVariant" use:enhance class="space-y-1">
									<input type="hidden" name="imageId" value={img.id} />
									<input
										type="hidden"
										name="variantId"
										value={selectedImageVariants[img.id] ?? (img.variant_id || '')}
									/>
									<span class="block text-[10px] font-bold text-muted-foreground uppercase">
										Linked Variant
									</span>
									<Select.Root
										type="single"
										value={selectedImageVariants[img.id] ?? (img.variant_id || '')}
										onValueChange={(val: string) => {
											selectedImageVariants[img.id] = val ?? '';
											tick().then(() => {
												const form = document.getElementById(`image-form-${img.id}`) as HTMLFormElement | null;
												form?.requestSubmit();
											});
										}}
									>
										<Select.Trigger id="img-variant-{img.id}" size="sm" class="h-7 w-full text-xs font-normal">
											<span class="truncate">
												{getVariantLabelForId(selectedImageVariants[img.id] ?? (img.variant_id || ''))}
											</span>
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="" label="All Variants (General)" />
											{#each data.variants as v}
												<Select.Item value={v.id} label={getVariantDisplay(v)} />
											{/each}
										</Select.Content>
									</Select.Root>
								</form>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- ─── Dialog: Add Product Option ─── -->
<Dialog.Root bind:open={showAddOptionDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add Product Option</Dialog.Title>
			<Dialog.Description
				>Create an option dimension like "Color", "Size", or "Storage Capacity".</Dialog.Description
			>
		</Dialog.Header>
		<form
			method="POST"
			action="?/addOption"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') {
						showAddOptionDialog = false;
						newOptionName = '';
					}
				};
			}}
			class="space-y-4 pt-2"
		>
			<div class="grid gap-2">
				<Label for="opt_name">Option Name</Label>
				<Input
					id="opt_name"
					name="name"
					bind:value={newOptionName}
					placeholder="e.g. Color, Size, Material"
					required
				/>
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (showAddOptionDialog = false)}
					>Cancel</Button
				>
				<Button type="submit" class="font-bold">Create Option</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- ─── Dialog: Add / Edit Variant & Flash Sales ─── -->
<Dialog.Root bind:open={showVariantDialog}>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</Dialog.Title>
			<Dialog.Description
				>Configure options, pricing, stock, and optional flash sale date windows.</Dialog.Description
			>
		</Dialog.Header>

		<form
			method="POST"
			action="?/saveVariant"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') {
						showVariantDialog = false;
					}
				};
			}}
			class="space-y-5 pt-2"
		>
			{#if editingVariant}
				<input type="hidden" name="variantId" value={editingVariant.id} />
			{/if}

			<!-- Option Values Selectors -->
			{#if data.options.length > 0}
				<div class="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
					<h4
						class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase"
					>
						<Tag class="h-3.5 w-3.5" /> Option Assignment
					</h4>
					<div class="grid gap-3 sm:grid-cols-2">
						{#each data.options as opt}
							<div class="grid gap-1.5">
								<Label class="text-xs font-semibold">{opt.name}</Label>
								{#if opt.product_option_values.length > 0}
									<Select.Root
										type="single"
										bind:value={variantSelectedOptionValues[opt.id]}
									>
										<Select.Trigger class="w-full text-xs">
											<span class="truncate">
												{opt.product_option_values.find(
													(val: any) => val.id === variantSelectedOptionValues[opt.id]
												)?.value ?? 'Select a value'}
											</span>
										</Select.Trigger>
										<Select.Content>
											{#each opt.product_option_values as val}
												<Select.Item value={val.id} label={val.value} />
											{/each}
										</Select.Content>
									</Select.Root>
									<input
										type="hidden"
										name="optionValueIds"
										value={variantSelectedOptionValues[opt.id] || ''}
									/>
								{:else}
									<p class="text-[11px] text-muted-foreground italic">
										No values added yet for this option.
									</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- SKU, Price, Compare-At, Stock -->
			<div class="grid grid-cols-2 gap-4">
				<div class="grid gap-2">
					<Label for="v_sku">SKU</Label>
					<Input id="v_sku" name="sku" bind:value={variantSku} placeholder="e.g. IP15-BLK-256" />
				</div>
				<div class="grid gap-2">
					<Label for="v_stock">Stock Quantity</Label>
					<Input
						id="v_stock"
						name="stock_quantity"
						type="number"
						min="0"
						bind:value={variantStock}
						required
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="grid gap-2">
					<Label for="v_price">Regular Price ({data.baseCurrency?.symbol ?? '₹'})</Label>
					<Input
						id="v_price"
						name="price"
						type="number"
						step="0.01"
						min="0"
						bind:value={variantPrice}
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="v_compare">Compare-at Price ({data.baseCurrency?.symbol ?? '₹'})</Label>
					<Input
						id="v_compare"
						name="compare_at_price"
						type="number"
						step="0.01"
						min="0"
						bind:value={variantComparePrice}
					/>
				</div>
			</div>

			<!-- Flash Sale Section -->
			<div class="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
				<div class="flex items-center gap-2">
					<Zap class="h-4 w-4 text-amber-500" />
					<h4 class="text-xs font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400">
						Flash Sale Configuration (Optional)
					</h4>
				</div>
				<div class="grid gap-3 sm:grid-cols-3">
					<div class="grid gap-1.5">
						<Label for="v_sale_price" class="text-xs">Sale Price ({data.baseCurrency?.symbol ?? '₹'})</Label>
						<Input
							id="v_sale_price"
							name="sale_price"
							type="number"
							step="0.01"
							min="0"
							bind:value={variantSalePrice}
							placeholder="e.g. 799.00"
							class="bg-background text-xs"
						/>
					</div>
					<div class="grid gap-1.5">
						<Label for="v_sale_start" class="text-xs">Starts At</Label>
						<Input
							id="v_sale_start"
							name="sale_starts_at"
							type="datetime-local"
							bind:value={variantSaleStartsAt}
							class="bg-background text-xs"
						/>
					</div>
					<div class="grid gap-1.5">
						<Label for="v_sale_end" class="text-xs">Ends At</Label>
						<Input
							id="v_sale_end"
							name="sale_ends_at"
							type="datetime-local"
							bind:value={variantSaleEndsAt}
							class="bg-background text-xs"
						/>
					</div>
				</div>
				<p class="text-[11px] text-muted-foreground">
					Sale price must be strictly lower than the regular price. If dates are set, ends_at must
					be after starts_at.
				</p>
			</div>

			<div class="flex items-center space-x-2 pt-1">
				<Checkbox id="v_active" name="is_active" bind:checked={variantIsActive} />
				<Label for="v_active" class="cursor-pointer text-xs font-medium"
					>Active variant (available for purchase)</Label
				>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (showVariantDialog = false)}
					>Cancel</Button
				>
				<Button type="submit" class="font-bold"
					>{editingVariant ? 'Update Variant' : 'Create Variant'}</Button
				>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- ─── Dialog: Add Gallery Image with ImagePicker ─── -->
<Dialog.Root bind:open={showAddImageModal}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add Gallery Image</Dialog.Title>
			<Dialog.Description>
				Upload a new photo or select from the media library to add to this product's gallery.
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action="?/uploadImage"
			use:enhance={() => {
				uploading = true;
				return async ({ update }) => {
					await update({ reset: false });
					showAddImageModal = false;
					newGalleryImageUrl = '';
					modalVariantId = '';
					uploading = false;
				};
			}}
			class="space-y-4 pt-2"
		>
			<ImagePicker
				name="url"
				bucket="product-images"
				folder={data.product.id}
				label="Product Photo"
				description="Upload a photo (1:1 or 4:3 recommended) or pick from bucket"
				bind:value={newGalleryImageUrl}
				required
			/>

			<div>
				<Label
					for="new-gallery-variant"
					class="mb-1.5 block text-xs font-semibold text-muted-foreground"
				>
					Link to Specific Variant (Optional)
				</Label>
				<input type="hidden" name="variant_id" value={modalVariantId} />
				<Select.Root type="single" bind:value={modalVariantId}>
					<Select.Trigger id="new-gallery-variant" size="sm" class="w-full text-xs font-normal">
						<span class="truncate">{modalVariantLabel}</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="" label="All Variants (General gallery photo)" />
						{#each data.variants as v}
							<Select.Item
								value={v.id}
								label={`${v.sku || 'Variant'} — ${formatBasePrice(v.price, data.baseCurrency)}`}
							/>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<Dialog.Footer class="pt-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onclick={() => {
						showAddImageModal = false;
						newGalleryImageUrl = '';
						modalVariantId = '';
					}}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					size="sm"
					disabled={uploading || !newGalleryImageUrl}
					class="font-bold gap-1.5"
				>
					{#if uploading}
						<LoaderCircle class="h-4 w-4 animate-spin" />
						<span>Saving…</span>
					{:else}
						<Plus class="h-4 w-4" />
						<span>Add to Gallery</span>
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- ─── Dialog: Replace Gallery Image with ImagePicker ─── -->
<Dialog.Root
	open={Boolean(replacingImage)}
	onOpenChange={(open) => {
		if (!open) {
			replacingImage = null;
			replacementImageUrl = '';
		}
	}}
>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Replace Gallery Image</Dialog.Title>
			<Dialog.Description>
				Upload a replacement photo or pick one from your media library.
			</Dialog.Description>
		</Dialog.Header>

		{#if replacingImage}
			<form
				method="POST"
				action="?/replaceImage"
				use:enhance={() => {
					uploading = true;
					return async ({ update }) => {
						await update({ reset: false });
						replacingImage = null;
						replacementImageUrl = '';
						uploading = false;
					};
				}}
				class="space-y-4 pt-2"
			>
				<input type="hidden" name="imageId" value={replacingImage.id} />

				<ImagePicker
					name="url"
					bucket="product-images"
					folder={data.product.id}
					label="Replacement Photo"
					description="Choose a new file or select from media library"
					bind:value={replacementImageUrl}
					required
				/>

				<Dialog.Footer class="pt-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={() => {
							replacingImage = null;
							replacementImageUrl = '';
						}}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						size="sm"
						disabled={uploading || !replacementImageUrl || replacementImageUrl === replacingImage.url}
						class="font-bold gap-1.5"
					>
						{#if uploading}
							<LoaderCircle class="h-4 w-4 animate-spin" />
							<span>Updating…</span>
						{:else}
							<RefreshCw class="h-4 w-4" />
							<span>Replace Photo</span>
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
