<script lang="ts">
	import * as Table from '@repo/ui/lib/components/ui/table/index.js';
	import * as DropdownMenu from '@repo/ui/lib/components/ui/dropdown-menu/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import * as Dialog from '@repo/ui/lib/components/ui/dialog/index.js';
	import { Button, buttonVariants } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import {
		Search,
		Star,
		Trash2,
		MoreHorizontal,
		ChevronLeft,
		ChevronRight,
		CheckCircle2,
		X,
		Image as ImageIcon,
		LoaderCircle
	} from 'lucide-svelte';
	import { deleteReview } from './reviews.remote';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';

	let { data } = $props();

	// Derived pagination values
	let totalPages = $derived(Math.max(1, Math.ceil(data.total / data.perPage)));
	let currentPage = $derived(data.page);
	let hasPrev = $derived(currentPage > 1);
	let hasNext = $derived(currentPage < totalPages);

	// Search state — debounced navigate
	let searchValue = $state(data.search);
	let searchTimer: ReturnType<typeof setTimeout>;

	// Lightbox preview state
	let previewImageUrl = $state<string | null>(null);
	let deletingImageId = $state<string | null>(null);

	function onSearchInput(e: Event) {
		searchValue = (e.currentTarget as HTMLInputElement).value;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			const params = new URLSearchParams(page.url.search);
			params.set('page', '1');
			if (searchValue) params.set('q', searchValue);
			else params.delete('q');
			goto(`?${params}`, { reset: false });
		}, 400);
	}

	function goToPage(p: number) {
		if (p < 1 || p > totalPages || p === currentPage) return;
		const params = new URLSearchParams(page.url.search);
		params.set('page', String(p));
		goto(`?${params}`, { reset: false });
	}

	function onPerPageChange(val: string) {
		const params = new URLSearchParams(page.url.search);
		params.set('perPage', val);
		params.set('page', '1');
		goto(`?${params}`, { reset: false });
	}

	let pageNumbers = $derived.by(() => {
		const delta = 1;
		const pages: (number | '...')[] = [];
		const left = Math.max(1, currentPage - delta);
		const right = Math.min(totalPages, currentPage + delta);
		if (left > 1) {
			pages.push(1);
			if (left > 2) pages.push('...');
		}
		for (let i = left; i <= right; i++) pages.push(i);
		if (right < totalPages) {
			if (right < totalPages - 1) pages.push('...');
			pages.push(totalPages);
		}
		return pages;
	});
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold tracking-tight">Reviews & Photo Moderation</h2>
		<p class="text-muted-foreground">
			Moderate customer ratings, verified purchases, and submitted product photos.
		</p>
	</div>

	<div class="rounded-lg border">
		<!-- Search bar -->
		<div class="flex items-center gap-3 border-b px-4 py-3">
			<Search class="h-4 w-4 shrink-0 text-muted-foreground" />
			<Input
				class="h-8 flex-1 border-0 shadow-none focus-visible:ring-0"
				placeholder="Search reviews by comment text…"
				value={searchValue}
				oninput={onSearchInput}
			/>
			{#if data.total > 0}
				<span class="shrink-0 text-sm text-muted-foreground">
					{data.total} review{data.total === 1 ? '' : 's'}
				</span>
			{/if}
		</div>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Product</Table.Head>
					<Table.Head>Customer</Table.Head>
					<Table.Head>Rating</Table.Head>
					<Table.Head>Comment & Photos</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.reviews as review (review.id)}
					<Table.Row class="align-top">
						<!-- Product Name -->
						<Table.Cell class="max-w-[180px] text-xs font-medium">
							<span class="line-clamp-2 font-semibold text-foreground">
								{review.products?.name || 'Unknown Product'}
							</span>
						</Table.Cell>

						<!-- Customer Info & Verified Badge -->
						<Table.Cell class="text-xs">
							<div class="space-y-1">
								<p class="font-semibold text-foreground">
									{review.profiles?.full_name || 'Guest User'}
								</p>
								{#if review.is_verified_purchase}
									<Badge
										class="inline-flex items-center gap-1 border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[10px] font-bold text-emerald-600"
									>
										<CheckCircle2 class="h-3 w-3 text-emerald-600" /> Verified Purchase
									</Badge>
								{/if}
							</div>
						</Table.Cell>

						<!-- Star Rating -->
						<Table.Cell>
							<div class="flex items-center gap-0.5">
								{#each Array(5) as _, i}
									<Star
										class="h-3.5 w-3.5 {i < review.rating
											? 'fill-amber-400 text-amber-400'
											: 'text-muted-foreground/30'}"
									/>
								{/each}
							</div>
							<span class="mt-0.5 block font-mono text-[10px] text-muted-foreground">
								{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
							</span>
						</Table.Cell>

						<!-- Comment & Attached Photos -->
						<Table.Cell class="max-w-[400px] space-y-2 text-xs">
							{#if review.comment}
								<p class="leading-relaxed text-foreground/90">{review.comment}</p>
							{:else}
								<p class="text-muted-foreground italic">No written comment.</p>
							{/if}

							<!-- Review Images -->
							{#if review.review_images && review.review_images.length > 0}
								<div class="pt-1">
									<div
										class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground"
									>
										<ImageIcon class="h-3 w-3" /> Attached Photos ({review.review_images.length}):
									</div>
									<div class="flex flex-wrap gap-2">
										{#each review.review_images as img}
											<div
												class="group relative h-14 w-14 overflow-hidden rounded-lg border border-border bg-muted shadow-xs"
											>
												<button
													type="button"
													onclick={() => (previewImageUrl = img.url)}
													class="h-full w-full cursor-pointer focus:outline-none"
													aria-label="View photo"
												>
													<img
														src={img.url}
														alt="Review attachment"
														class="h-full w-full object-cover transition-transform group-hover:scale-105"
													/>
												</button>

												<!-- Delete photo action -->
												<form
													method="POST"
													action="?/deleteReviewImage"
													use:enhance={() => {
														deletingImageId = img.id;
														return async ({ update }) => {
															await update({ reset: false });
															deletingImageId = null;
														};
													}}
													class="absolute inset-0"
												>
													<input type="hidden" name="imageId" value={img.id} />
													<input type="hidden" name="imageUrl" value={img.url} />
													<button
														type="submit"
														disabled={deletingImageId === img.id}
														class="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
														title="Delete inappropriate image"
														aria-label="Delete image"
													>
														{#if deletingImageId === img.id}
															<LoaderCircle class="h-3 w-3 animate-spin" />
														{:else}
															<X class="h-3 w-3" />
														{/if}
													</button>
												</form>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</Table.Cell>

						<!-- Actions Menu -->
						<Table.Cell class="text-right">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
									<span class="sr-only">Open actions</span>
									<MoreHorizontal class="h-4 w-4" />
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Label>Actions</DropdownMenu.Label>
									<form {...deleteReview.for(review.id)}>
										<input
											bind:value={review.id}
											{...deleteReview.fields.id.as('text')}
											class="hidden"
										/>
										<DropdownMenu.Item
											variant="destructive"
											onclick={(e) => {
												const form = (e.currentTarget as HTMLElement).closest('form');
												if (form) form.requestSubmit();
											}}
										>
											<Trash2 class="mr-2 h-4 w-4" /> Delete Entire Review
										</DropdownMenu.Item>
									</form>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={5} class="h-24 text-center text-muted-foreground">
							{data.search ? `No reviews matching "${data.search}".` : 'No reviews found.'}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<!-- Pagination bar -->
		<div class="flex flex-col items-center justify-between gap-4 border-t px-4 py-3 sm:flex-row">
			<div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
				<span>
					{#if data.total > 0}
						Showing {(currentPage - 1) * data.perPage + 1}–{Math.min(
							currentPage * data.perPage,
							data.total
						)} of {data.total}
					{:else}
						0 reviews
					{/if}
				</span>

				<div class="flex items-center gap-2">
					<span class="text-xs">Rows per page:</span>
					<Select.Root
						type="single"
						value={String(data.perPage)}
						onValueChange={(val) => {
							if (val) onPerPageChange(val);
						}}
					>
						<Select.Trigger class="h-8 w-[72px] text-xs">
							{data.perPage}
						</Select.Trigger>
						<Select.Content side="top">
							<Select.Item value="10" label="10" />
							<Select.Item value="20" label="20" />
							<Select.Item value="50" label="50" />
							<Select.Item value="100" label="100" />
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<!-- Pagination controls -->
			{#if totalPages > 1}
				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						class="h-8 w-8"
						disabled={!hasPrev}
						onclick={() => goToPage(currentPage - 1)}
						aria-label="Previous page"
					>
						<ChevronLeft class="h-4 w-4" />
					</Button>

					{#each pageNumbers as p}
						{#if p === '...'}
							<span class="px-2 text-xs text-muted-foreground">…</span>
						{:else}
							<Button
								variant={p === currentPage ? 'default' : 'outline'}
								size="icon"
								class="h-8 w-8 text-xs"
								onclick={() => goToPage(p as number)}
							>
								{p}
							</Button>
						{/if}
					{/each}

					<Button
						variant="outline"
						size="icon"
						class="h-8 w-8"
						disabled={!hasNext}
						onclick={() => goToPage(currentPage + 1)}
						aria-label="Next page"
					>
						<ChevronRight class="h-4 w-4" />
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- ─── Dialog: Image Lightbox Preview ─── -->
<Dialog.Root
	open={Boolean(previewImageUrl)}
	onOpenChange={(open) => {
		if (!open) previewImageUrl = null;
	}}
>
	<Dialog.Content class="bg-background/95 p-2 backdrop-blur-md sm:max-w-2xl">
		<div
			class="relative flex aspect-auto max-h-[80vh] items-center justify-center overflow-hidden rounded-lg"
		>
			{#if previewImageUrl}
				<img
					src={previewImageUrl}
					alt="Review attachment enlarged"
					class="max-h-[75vh] w-auto rounded-md object-contain"
				/>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
