<script lang="ts">
	import * as Table from '@repo/ui/lib/components/ui/table/index.js';
	import * as DropdownMenu from '@repo/ui/lib/components/ui/dropdown-menu/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import { Button, buttonVariants } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import {
		Plus,
		Search,
		Trash2,
		Pencil,
		MoreHorizontal,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';
	import { deleteCoupon } from './coupons.remote';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { formatBasePrice } from '#lib';

	let { data } = $props();

	// Derived pagination values
	let totalPages = $derived(Math.max(1, Math.ceil(data.total / data.perPage)));
	let currentPage = $derived(data.page);
	let hasPrev = $derived(currentPage > 1);
	let hasNext = $derived(currentPage < totalPages);

	// Search state — debounced navigate
	let searchValue = $state(data.search);
	let searchTimer: ReturnType<typeof setTimeout>;

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

	// Build page number array for the paginator (max 5 visible)
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
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Coupons</h2>
			<p class="text-muted-foreground">Manage discount codes and promotions.</p>
		</div>
		<Button href="/coupons/new">
			<Plus class="mr-2 h-4 w-4" /> Create Coupon
		</Button>
	</div>

	<div class="rounded-lg border">
		<!-- Search bar -->
		<div class="flex items-center gap-3 border-b px-4 py-3">
			<Search class="h-4 w-4 shrink-0 text-muted-foreground" />
			<Input
				class="h-8 flex-1 border-0 shadow-none focus-visible:ring-0"
				placeholder="Search coupons by code…"
				value={searchValue}
				oninput={onSearchInput}
			/>
			{#if data.total > 0}
				<span class="shrink-0 text-sm text-muted-foreground">
					{data.total} coupon{data.total === 1 ? '' : 's'}
				</span>
			{/if}
		</div>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Code</Table.Head>
					<Table.Head>Discount</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head class="text-right">Usage</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.coupons as coupon (coupon.id)}
					<Table.Row>
						<Table.Cell class="font-mono text-sm font-medium tracking-wide"
							>{coupon.code}</Table.Cell
						>
						<Table.Cell>
							{coupon.discount_type === 'percentage'
								? `${coupon.discount_value}% off`
								: `${formatBasePrice(coupon.discount_value, data.baseCurrency)} off`}
						</Table.Cell>
						<Table.Cell>
							<div
								class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none {coupon.is_active
									? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'
									: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80'}"
							>
								{coupon.is_active ? 'Active' : 'Inactive'}
							</div>
						</Table.Cell>
						<Table.Cell class="text-right text-muted-foreground">
							{coupon.used_count || 0} / {coupon.max_uses ? coupon.max_uses : 'Unlimited'}
						</Table.Cell>
						<Table.Cell class="text-right">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
									<span class="sr-only">Open actions</span>
									<MoreHorizontal class="h-4 w-4" />
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Label>Actions</DropdownMenu.Label>
									<DropdownMenu.Item onclick={() => goto(`/coupons/${coupon.id}`)}>
										<Pencil class="mr-2 h-4 w-4" /> Edit
									</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<form {...deleteCoupon.for(coupon.id)}>
										<input
											bind:value={coupon.id}
											{...deleteCoupon.fields.id.as('text')}
											class="hidden"
										/>
										<DropdownMenu.Item
											variant="destructive"
											onclick={(e) => {
												const form = (e.currentTarget as HTMLElement).closest('form');
												if (form) form.requestSubmit();
											}}
										>
											<Trash2 class="mr-2 h-4 w-4" /> Delete
										</DropdownMenu.Item>
									</form>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={5} class="h-24 text-center text-muted-foreground">
							{data.search ? `No coupons matching "${data.search}".` : 'No coupons found.'}
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
						0 coupons
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

			<div class="flex flex-wrap items-center gap-3">
				<span class="text-xs text-muted-foreground">
					Page {currentPage} of {totalPages}
				</span>

				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="sm"
						class="h-8 gap-1 px-2.5 text-xs"
						disabled={!hasPrev}
						onclick={() => goToPage(currentPage - 1)}
						aria-label="Previous page"
					>
						<ChevronLeft class="h-4 w-4" />
						<span>Previous</span>
					</Button>

					{#each pageNumbers as p}
						{#if p === '...'}
							<span class="px-1 text-sm text-muted-foreground">…</span>
						{:else}
							<Button
								variant={p === currentPage ? 'default' : 'outline'}
								size="icon"
								class="h-8 w-8 text-xs"
								onclick={() => goToPage(p as number)}
								aria-label="Page {p}"
								aria-current={p === currentPage ? 'page' : undefined}
							>
								{p}
							</Button>
						{/if}
					{/each}

					<Button
						variant="outline"
						size="sm"
						class="h-8 gap-1 px-2.5 text-xs"
						disabled={!hasNext}
						onclick={() => goToPage(currentPage + 1)}
						aria-label="Next page"
					>
						<span>Next</span>
						<ChevronRight class="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>
