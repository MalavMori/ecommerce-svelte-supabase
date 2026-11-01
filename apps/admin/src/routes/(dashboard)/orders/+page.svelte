<script lang="ts">
	import * as Table from '@repo/ui/lib/components/ui/table/index.js';
	import * as DropdownMenu from '@repo/ui/lib/components/ui/dropdown-menu/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import { Button, buttonVariants } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import {
		Search,
		Eye,
		MoreHorizontal,
		ChevronLeft,
		ChevronRight,
		Truck,
		RotateCcw,
		CreditCard
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { formatBasePrice, formatOrderCurrency } from '#lib';

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

	function setStatusFilter(status: string) {
		const params = new URLSearchParams(page.url.search);
		params.set('page', '1');
		if (status === 'all') params.delete('status');
		else params.set('status', status);
		goto(`?${params}`, { reset: false });
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

	function getStatusColor(status: string) {
		switch (status.toLowerCase()) {
			case 'delivered':
				return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30';
			case 'processing':
			case 'paid':
				return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
			case 'shipped':
				return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30';
			case 'cancelled':
				return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30';
			default:
				return 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30';
		}
	}

	function getPaymentStatusColor(status: string | null) {
		switch (status?.toLowerCase()) {
			case 'paid':
				return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
			case 'refunded':
				return 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20';
			case 'unpaid':
			default:
				return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Orders & Shipments</h2>
			<p class="mt-0.5 text-xs text-muted-foreground">
				Manage customer orders, track payments, shipments, and fulfillments.
			</p>
		</div>
	</div>

	<!-- Status Filter Tabs -->
	<div class="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3 text-xs">
		{#each ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'] as s}
			<button
				type="button"
				onclick={() => setStatusFilter(s)}
				class="rounded-lg px-3 py-1.5 font-semibold capitalize transition-colors {data.statusFilter ===
				s
					? 'bg-primary text-primary-foreground shadow-xs'
					: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}"
			>
				{s}
			</button>
		{/each}
	</div>

	<div class="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
		<!-- Search bar -->
		<div class="flex items-center gap-3 border-b border-border/60 px-4 py-3">
			<Search class="h-4 w-4 shrink-0 text-muted-foreground" />
			<Input
				class="h-8 flex-1 border-0 text-xs shadow-none focus-visible:ring-0"
				placeholder="Search orders by status or UUID…"
				value={searchValue}
				oninput={onSearchInput}
			/>
			{#if data.total > 0}
				<span class="shrink-0 text-xs text-muted-foreground">
					{data.total} order{data.total === 1 ? '' : 's'}
				</span>
			{/if}
		</div>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Order ID</Table.Head>
					<Table.Head>Customer</Table.Head>
					<Table.Head>Date</Table.Head>
					<Table.Head>Order Status</Table.Head>
					<Table.Head>Payment</Table.Head>
					<Table.Head>Fulfillment</Table.Head>
					<Table.Head class="text-right">Total ({data.baseCurrency?.symbol ?? '₹'})</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.orders as order (order.id)}
					{@const hasReturn = order.returns && order.returns.length > 0}
					{@const hasShipment = order.shipments && order.shipments.length > 0}
					<Table.Row class="align-middle">
						<Table.Cell class="font-mono text-xs font-medium">
							<a href="/orders/{order.id}" class="font-bold text-primary hover:underline">
								#{order.id.split('-')[0]}
							</a>
						</Table.Cell>
						<Table.Cell>
							<p class="text-xs font-medium text-foreground">
								{order.profiles?.full_name || 'Guest User'}
							</p>
							{#if order.profiles?.phone}
								<p class="text-[11px] text-muted-foreground">{order.profiles.phone}</p>
							{/if}
						</Table.Cell>
						<Table.Cell class="font-mono text-xs text-muted-foreground">
							{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
						</Table.Cell>
						<Table.Cell>
							<div
								class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase {getStatusColor(
									order.status
								)}"
							>
								{order.status}
							</div>
						</Table.Cell>
						<Table.Cell>
							<Badge
								variant="outline"
								class="text-[10px] font-bold tracking-wider uppercase {getPaymentStatusColor(
									order.payment_status
								)}"
							>
								{order.payment_status || 'Paid'}
							</Badge>
						</Table.Cell>
						<Table.Cell>
							<div class="flex items-center gap-1.5">
								{#if hasShipment}
									<span
										class="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400"
										title="Shipment recorded"
									>
										<Truck class="h-3 w-3" />
										<span class="capitalize">{order.shipments[0]?.status || 'Shipped'}</span>
									</span>
								{:else}
									<span class="text-[11px] text-muted-foreground italic">No shipment</span>
								{/if}

								{#if hasReturn}
									<span
										class="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600"
										title="Return requested"
									>
										<RotateCcw class="h-3 w-3" /> RMA
									</span>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell class="text-right text-xs font-medium">
							<p class="font-mono font-bold text-foreground">
								{formatBasePrice(order.total, data.baseCurrency)}
							</p>
							{#if order.display_currency_code && order.display_total && order.display_currency_code !== data.baseCurrency?.code}
								<p class="font-mono text-[10px] text-muted-foreground" title="Customer checked out in this currency">
									Paid: {formatOrderCurrency(order.display_total, order.display_currency_code, data.currencies)}
								</p>
							{/if}
						</Table.Cell>
						<Table.Cell class="text-right">
							<Button
								href="/orders/{order.id}"
								variant="ghost"
								size="sm"
								class="h-7 text-xs font-semibold"
							>
								<Eye class="mr-1.5 h-3.5 w-3.5" /> Details
							</Button>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={8} class="h-24 text-center text-xs text-muted-foreground">
							{data.search ? `No orders matching "${data.search}".` : 'No orders found.'}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<!-- Pagination bar -->
		<div
			class="flex flex-col items-center justify-between gap-4 border-t border-border/60 px-4 py-3 text-xs sm:flex-row"
		>
			<div class="flex flex-wrap items-center gap-4 text-muted-foreground">
				<span>
					{#if data.total > 0}
						Showing {(currentPage - 1) * data.perPage + 1}–{Math.min(
							currentPage * data.perPage,
							data.total
						)} of {data.total}
					{:else}
						0 orders
					{/if}
				</span>

				<div class="flex items-center gap-2">
					<span>Rows per page:</span>
					<Select.Root
						type="single"
						value={String(data.perPage)}
						onValueChange={(val) => {
							if (val) onPerPageChange(val);
						}}
					>
						<Select.Trigger class="h-7 w-[68px] text-xs">
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

			{#if totalPages > 1}
				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						class="h-7 w-7"
						disabled={!hasPrev}
						onclick={() => goToPage(currentPage - 1)}
						aria-label="Previous page"
					>
						<ChevronLeft class="h-3.5 w-3.5" />
					</Button>

					{#each pageNumbers as p}
						{#if p === '...'}
							<span class="px-2 text-muted-foreground select-none">…</span>
						{:else}
							<Button
								variant={p === currentPage ? 'default' : 'outline'}
								size="icon"
								class="h-7 w-7 text-xs font-semibold"
								onclick={() => goToPage(Number(p))}
							>
								{p}
							</Button>
						{/if}
					{/each}

					<Button
						variant="outline"
						size="icon"
						class="h-7 w-7"
						disabled={!hasNext}
						onclick={() => goToPage(currentPage + 1)}
						aria-label="Next page"
					>
						<ChevronRight class="h-3.5 w-3.5" />
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>
