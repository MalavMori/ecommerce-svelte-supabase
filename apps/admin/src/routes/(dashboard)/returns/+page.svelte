<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Table from '@repo/ui/lib/components/ui/table/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import {
		RotateCcw,
		Search,
		CheckCircle2,
		XCircle,
		DollarSign,
		ExternalLink,
		ChevronLeft,
		ChevronRight,
		Clock
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { formatBasePrice } from '#lib';

	let { data, form } = $props();

	let searchValue = $state(data.search);
	let searchTimer: ReturnType<typeof setTimeout>;

	let totalPages = $derived(Math.max(1, Math.ceil(data.total / data.perPage)));
	let currentPage = $derived(data.page);
	let hasPrev = $derived(currentPage > 1);
	let hasNext = $derived(currentPage < totalPages);

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

	function getStatusBadge(status: string) {
		switch (status) {
			case 'requested':
				return {
					label: 'Requested',
					class: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
				};
			case 'approved':
				return {
					label: 'Approved',
					class: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
				};
			case 'rejected':
				return {
					label: 'Rejected',
					class: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30'
				};
			case 'refunded':
				return {
					label: 'Refunded',
					class: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
				};
			default:
				return { label: status, class: 'bg-muted text-muted-foreground' };
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
				<RotateCcw class="h-6 w-6 text-primary" />
				<span>Customer Returns & Refunds</span>
			</h1>
			<p class="mt-1 text-xs text-muted-foreground">
				Review and process return requests, manage RMA approvals, and record customer refunds.
			</p>
		</div>

		{#if data.counts.requested > 0}
			<div
				class="inline-flex items-center gap-2 self-start rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400"
			>
				<Clock class="h-4 w-4" />
				<span>{data.counts.requested} Pending Request{data.counts.requested === 1 ? '' : 's'}</span>
			</div>
		{/if}
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

	<!-- Status Filter Tabs -->
	<div class="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
		<button
			type="button"
			onclick={() => setStatusFilter('all')}
			class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors {data.statusFilter ===
			'all'
				? 'bg-primary text-primary-foreground shadow-xs'
				: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			All ({data.counts.all})
		</button>
		<button
			type="button"
			onclick={() => setStatusFilter('requested')}
			class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors {data.statusFilter ===
			'requested'
				? 'bg-amber-600 text-white shadow-xs'
				: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			Pending Approval ({data.counts.requested})
		</button>
		<button
			type="button"
			onclick={() => setStatusFilter('approved')}
			class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors {data.statusFilter ===
			'approved'
				? 'bg-blue-600 text-white shadow-xs'
				: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			Approved ({data.counts.approved})
		</button>
		<button
			type="button"
			onclick={() => setStatusFilter('refunded')}
			class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors {data.statusFilter ===
			'refunded'
				? 'bg-emerald-600 text-white shadow-xs'
				: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			Refunded ({data.counts.refunded})
		</button>
		<button
			type="button"
			onclick={() => setStatusFilter('rejected')}
			class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors {data.statusFilter ===
			'rejected'
				? 'bg-red-600 text-white shadow-xs'
				: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}"
		>
			Rejected ({data.counts.rejected})
		</button>
	</div>

	<!-- Main Returns Card & Table -->
	<div class="rounded-xl border border-border bg-card shadow-xs">
		<!-- Search Header -->
		<div class="flex items-center gap-3 border-b border-border/60 px-4 py-3">
			<Search class="h-4 w-4 shrink-0 text-muted-foreground" />
			<Input
				class="h-8 flex-1 border-0 text-xs shadow-none focus-visible:ring-0"
				placeholder="Search returns by reason…"
				value={searchValue}
				oninput={onSearchInput}
			/>
			{#if data.total > 0}
				<span class="shrink-0 text-xs text-muted-foreground">
					{data.total} record{data.total === 1 ? '' : 's'}
				</span>
			{/if}
		</div>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Order</Table.Head>
					<Table.Head>Customer</Table.Head>
					<Table.Head>Reason</Table.Head>
					<Table.Head class="text-right">Refund Amount ({data.baseCurrency?.symbol ?? '₹'})</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Requested Date</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.returns as ret (ret.id)}
					{@const badge = getStatusBadge(ret.status)}
					<Table.Row class="align-top">
						<!-- Order Link -->
						<Table.Cell class="font-mono text-xs font-semibold">
							<a
								href="/orders/{ret.order_id}"
								class="inline-flex items-center gap-1 text-primary hover:underline"
							>
								<span>#{ret.order_id.split('-')[0]}</span>
								<ExternalLink class="h-3 w-3" />
							</a>
						</Table.Cell>

						<!-- Customer Info -->
						<Table.Cell class="text-xs">
							<p class="font-semibold text-foreground">{ret.profiles?.full_name || 'Customer'}</p>
							<p class="text-[11px] text-muted-foreground">{ret.profiles?.phone || 'No phone'}</p>
						</Table.Cell>

						<!-- Reason -->
						<Table.Cell class="max-w-[260px] text-xs">
							<p class="leading-relaxed text-foreground/90">{ret.reason}</p>
							{#if ret.stripe_refund_id}
								<p class="mt-1 font-mono text-[10px] text-muted-foreground">
									Stripe Refund: {ret.stripe_refund_id}
								</p>
							{/if}
						</Table.Cell>

						<!-- Refund Amount -->
						<Table.Cell class="text-right font-mono text-xs font-semibold">
							{formatBasePrice(ret.refund_amount || ret.orders?.total || 0, data.baseCurrency)}
						</Table.Cell>

						<!-- Status Badge -->
						<Table.Cell>
							<Badge class="{badge.class} text-[10px] font-bold tracking-wider uppercase">
								{badge.label}
							</Badge>
						</Table.Cell>

						<!-- Requested Date -->
						<Table.Cell class="font-mono text-xs text-muted-foreground">
							{ret.requested_at ? new Date(ret.requested_at).toLocaleDateString() : '—'}
						</Table.Cell>

						<!-- Actions -->
						<Table.Cell class="text-right">
							<div class="flex items-center justify-end gap-1.5">
								{#if ret.status === 'requested'}
									<form action="?/updateStatus" method="POST" use:enhance class="inline">
										<input type="hidden" name="returnId" value={ret.id} />
										<input type="hidden" name="status" value="approved" />
										<Button
											type="submit"
											size="sm"
											class="h-7 bg-emerald-600 px-2.5 text-xs font-bold text-white hover:bg-emerald-700"
										>
											Approve
										</Button>
									</form>
									<form action="?/updateStatus" method="POST" use:enhance class="inline">
										<input type="hidden" name="returnId" value={ret.id} />
										<input type="hidden" name="status" value="rejected" />
										<Button
											type="submit"
											variant="outline"
											size="sm"
											class="h-7 px-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
										>
											Reject
										</Button>
									</form>
								{:else if ret.status === 'approved'}
									<form action="?/updateStatus" method="POST" use:enhance class="inline">
										<input type="hidden" name="returnId" value={ret.id} />
										<input type="hidden" name="status" value="refunded" />
										<Button
											type="submit"
											size="sm"
											class="h-7 bg-purple-600 px-2.5 text-xs font-bold text-white hover:bg-purple-700"
										>
											Mark Refunded
										</Button>
									</form>
								{:else}
									<Button
										href="/orders/{ret.order_id}"
										variant="ghost"
										size="sm"
										class="h-7 text-xs font-semibold text-muted-foreground"
									>
										View Order
									</Button>
								{/if}
							</div>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={7} class="py-10 text-center text-xs text-muted-foreground">
							No returns found matching the current criteria.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<!-- Pagination Footer -->
		{#if totalPages > 1}
			<div class="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs">
				<span class="text-muted-foreground">
					Page {currentPage} of {totalPages} ({data.total} total)
				</span>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!hasPrev}
						onclick={() => goToPage(currentPage - 1)}
						class="h-7 gap-1 text-xs"
					>
						<ChevronLeft class="h-3.5 w-3.5" /> Prev
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!hasNext}
						onclick={() => goToPage(currentPage + 1)}
						class="h-7 gap-1 text-xs"
					>
						Next <ChevronRight class="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
