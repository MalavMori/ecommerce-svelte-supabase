<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import { Button, buttonVariants } from '@repo/ui/lib/components/ui/button/index.js';
	import { refreshAll } from '$app/navigation';
	import {
		Coins,
		ShoppingCart,
		Users,
		Package,
		TrendingUp,
		TrendingDown,
		ArrowUpRight,
		ArrowRight,
		CheckCircle2,
		Clock,
		Truck,
		Plus,
		Tag,
		Star,
		Layers,
		RefreshCw,
		DollarSign
	} from 'lucide-svelte';
	import { formatBasePrice } from '#lib';

	let { data } = $props();

	// Interactive hover state for the bar chart
	let hoveredMonthIndex = $state<number | null>(null);

	// Data refetching state without page reload
	let isRefreshing = $state(false);

	async function handleRefresh() {
		if (isRefreshing) return;
		isRefreshing = true;
		try {
			await refreshAll();
		} finally {
			setTimeout(() => {
				isRefreshing = false;
			}, 350);
		}
	}

	const avatarPalette = [
		'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
		'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
		'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
		'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
		'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
	];

	function getStatusBadge(status: string) {
		switch (status.toLowerCase()) {
			case 'delivered':
				return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20';
			case 'paid':
			case 'processing':
				return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20';
			case 'shipped':
				return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20';
			case 'cancelled':
				return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20';
			default:
				return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20';
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex items-center gap-3">
				<h2 class="text-2xl font-bold tracking-tight">Dashboard</h2>
			</div>
			<p class="text-sm text-muted-foreground">
				Overview of your store's sales, catalog, and fulfillments for {data.stats.currentYear}.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				class="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground transition-all hover:text-foreground"
				disabled={isRefreshing}
				onclick={handleRefresh}
				aria-label="Refresh data"
				title="Refresh dashboard data without page reload"
			>
				<RefreshCw class="h-2.5 w-2.5 {isRefreshing ? 'animate-spin text-primary' : ''}" />
			</Button>
			<a href="/products/new" class={buttonVariants({ variant: 'outline', size: 'sm' })}>
				<Plus class="mr-1.5 h-4 w-4" />
				New Product
			</a>
			<a href="/orders" class={buttonVariants({ variant: 'default', size: 'sm' })}>
				<ShoppingCart class="mr-1.5 h-4 w-4" />
				Manage Orders
			</a>
		</div>
	</div>

	<!-- 4 Stat Summary Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Total Revenue -->
		<Card.Root class="overflow-hidden border-border/80 shadow-xs transition-all hover:shadow-sm">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground">
					Total Revenue ({data.baseCurrency?.code ?? 'INR'})
				</Card.Title>
				<div class="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
					<Coins class="h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-2xl font-bold tracking-tight">
					{formatBasePrice(data.stats.totalRevenue, data.baseCurrency)}
				</div>
				<div class="flex items-center gap-1 text-xs">
					{#if data.stats.revenueGrowth >= 0}
						<span
							class="inline-flex items-center font-medium text-emerald-600 dark:text-emerald-400"
						>
							<TrendingUp class="mr-1 h-3.5 w-3.5" />
							+{data.stats.revenueGrowth}%
						</span>
					{:else}
						<span class="inline-flex items-center font-medium text-rose-600 dark:text-rose-400">
							<TrendingDown class="mr-1 h-3.5 w-3.5" />
							{data.stats.revenueGrowth}%
						</span>
					{/if}
					<span class="text-muted-foreground">from last month</span>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Sales / Orders -->
		<Card.Root class="overflow-hidden border-border/80 shadow-xs transition-all hover:shadow-sm">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground">Total Orders</Card.Title>
				<div class="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
					<ShoppingCart class="h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-2xl font-bold tracking-tight">
					+{data.stats.totalSales}
				</div>
				<div class="flex items-center gap-1 text-xs">
					{#if data.stats.salesGrowth >= 0}
						<span
							class="inline-flex items-center font-medium text-emerald-600 dark:text-emerald-400"
						>
							<TrendingUp class="mr-1 h-3.5 w-3.5" />
							+{data.stats.salesGrowth}%
						</span>
					{:else}
						<span class="inline-flex items-center font-medium text-rose-600 dark:text-rose-400">
							<TrendingDown class="mr-1 h-3.5 w-3.5" />
							{data.stats.salesGrowth}%
						</span>
					{/if}
					<span class="text-muted-foreground">({data.stats.currentMonthSales} this month)</span>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Active Products -->
		<Card.Root class="overflow-hidden border-border/80 shadow-xs transition-all hover:shadow-sm">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground">Active Catalog</Card.Title>
				<div class="rounded-xl bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400">
					<Package class="h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-2xl font-bold tracking-tight">
					{data.stats.activeProducts}
				</div>
				<p class="text-xs text-muted-foreground">
					{data.stats.activeProducts} active of {data.stats.totalProducts} products
					{#if data.stats.lowStockCount > 0}
						<span class="text-amber-600 dark:text-amber-400">
							• {data.stats.lowStockCount} low stock
						</span>
					{/if}
				</p>
			</Card.Content>
		</Card.Root>

		<!-- Customers -->
		<Card.Root class="overflow-hidden border-border/80 shadow-xs transition-all hover:shadow-sm">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium text-muted-foreground">Customers</Card.Title>
				<div class="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
					<Users class="h-4 w-4" />
				</div>
			</Card.Header>
			<Card.Content class="space-y-1">
				<div class="text-2xl font-bold tracking-tight">
					+{data.stats.activeUsers}
				</div>
				<p class="text-xs text-muted-foreground">
					{data.stats.activeUsers} registered store customers
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Middle Section: Revenue Overview Chart & Recent Sales List -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
		<!-- Interactive Monthly Revenue Chart (4 cols) -->
		<Card.Root class="col-span-4 border-border/80 shadow-xs">
			<Card.Header class="flex flex-row items-start justify-between pb-4">
				<div class="space-y-1">
					<Card.Title class="text-base font-semibold">Revenue Overview</Card.Title>
					<Card.Description>
						Monthly performance for {data.stats.currentYear}.
					</Card.Description>
				</div>
				<div class="flex items-center gap-3 text-xs">
					<div
						class="hidden items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 text-muted-foreground sm:flex"
					>
						<span>Peak:</span>
						<span class="font-semibold text-foreground">
							{data.stats.peakMonthName} ({formatBasePrice(
								data.stats.peakMonthRevenue,
								data.baseCurrency
							)})
						</span>
					</div>
					<div class="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-primary">
						<span class="font-medium">Current:</span>
						<span class="font-bold"
							>{formatBasePrice(data.stats.currentMonthRevenue, data.baseCurrency)}</span
						>
					</div>
				</div>
			</Card.Header>

			<Card.Content>
				<!-- Responsive Custom SVG / CSS Bar Chart with Guide lines -->
				<div class="relative flex flex-col pt-2 pb-1">
					<!-- Guide lines with Y-axis markers -->
					<div
						class="pointer-events-none absolute inset-x-0 top-2 bottom-8 flex flex-col justify-between text-[11px] text-muted-foreground/60"
					>
						<div class="flex items-center gap-2 border-b border-dashed border-border/50 pb-0.5">
							<span class="w-14 text-right font-mono text-[10px]">
								{formatBasePrice(Math.round(data.maxMonthlyRevenue), data.baseCurrency)}
							</span>
						</div>
						<div class="flex items-center gap-2 border-b border-dashed border-border/50 pb-0.5">
							<span class="w-14 text-right font-mono text-[10px]">
								{formatBasePrice(Math.round((data.maxMonthlyRevenue * 3) / 4), data.baseCurrency)}
							</span>
						</div>
						<div class="flex items-center gap-2 border-b border-dashed border-border/50 pb-0.5">
							<span class="w-14 text-right font-mono text-[10px]">
								{formatBasePrice(Math.round(data.maxMonthlyRevenue / 2), data.baseCurrency)}
							</span>
						</div>
						<div class="flex items-center gap-2 border-b border-dashed border-border/50 pb-0.5">
							<span class="w-14 text-right font-mono text-[10px]">
								{formatBasePrice(Math.round(data.maxMonthlyRevenue / 4), data.baseCurrency)}
							</span>
						</div>
						<div class="flex items-center gap-2 border-b border-border/60 pb-0.5">
							<span class="w-14 text-right font-mono text-[10px]"
								>{formatBasePrice(0, data.baseCurrency)}</span
							>
						</div>
					</div>

					<!-- Bar Columns Container -->
					<div class="relative z-10 flex h-[230px] items-end gap-1 pr-2 pl-14 sm:gap-2">
						{#each data.monthlyRevenue as item, i}
							{@const heightPct =
								item.revenue > 0
									? Math.max(6, Math.round((item.revenue / data.maxMonthlyRevenue) * 100))
									: 0}
							{@const isCurrentMonth = item.month === 'Sep'}
							{@const isHovered = hoveredMonthIndex === i}

							<div
								class="group relative flex h-full flex-1 flex-col items-center justify-end"
								role="region"
								aria-label="{item.month} {data.stats.currentYear}: {formatBasePrice(
									item.revenue,
									data.baseCurrency
								)}"
								onmouseenter={() => (hoveredMonthIndex = i)}
								onmouseleave={() => (hoveredMonthIndex = null)}
							>
								<!-- Tooltip on Hover -->
								{#if isHovered}
									<div
										class="absolute -top-12 z-30 flex flex-col items-center rounded-lg border border-border bg-popover px-2.5 py-1 text-xs shadow-lg"
									>
										<span class="font-medium text-popover-foreground"
											>{item.month} {data.stats.currentYear}</span
										>
										<span class="font-mono font-bold text-primary"
											>{formatBasePrice(item.revenue, data.baseCurrency)}</span
										>
										<span class="text-[10px] text-muted-foreground"
											>{item.orders} order{item.orders === 1 ? '' : 's'}</span
										>
										<div
											class="absolute -bottom-1 h-2 w-2 rotate-45 border-r border-b border-border bg-popover"
										></div>
									</div>
								{/if}

								<!-- Background Column Slot -->
								<div
									class="relative flex h-full w-full max-w-[28px] flex-col justify-end rounded-t-sm bg-muted/40 transition-colors group-hover:bg-muted/70"
								>
									<!-- Filled Bar -->
									<div
										class="w-full rounded-t-sm transition-all duration-300 {isCurrentMonth
											? 'bg-primary shadow-xs'
											: item.revenue > 0
												? 'bg-primary/75 group-hover:bg-primary'
												: 'bg-transparent'}"
										style="height: {heightPct}%;"
									></div>
								</div>
							</div>
						{/each}
					</div>

					<!-- X-axis Month Labels -->
					<div class="flex items-center gap-1 pt-2 pr-2 pl-14 sm:gap-2">
						{#each data.monthlyRevenue as item}
							{@const isCurrent = item.month === 'Sep'}
							<div class="flex flex-1 flex-col items-center">
								<span
									class="text-[11px] font-medium {isCurrent
										? 'font-bold text-primary'
										: item.revenue > 0
											? 'text-foreground'
											: 'text-muted-foreground'}"
								>
									{item.month}
								</span>
								{#if isCurrent}
									<span class="mt-0.5 h-1 w-1 rounded-full bg-primary"></span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Recent Sales List (3 cols) -->
		<Card.Root class="col-span-3 border-border/80 shadow-xs">
			<Card.Header class="flex flex-row items-center justify-between pb-3">
				<div class="space-y-1">
					<Card.Title class="text-base font-semibold">Recent Sales</Card.Title>
					<Card.Description>
						Latest {data.recentSales.length} store orders.
					</Card.Description>
				</div>
				<a
					href="/orders"
					class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
				>
					View all
					<ArrowUpRight class="h-3.5 w-3.5" />
				</a>
			</Card.Header>

			<Card.Content>
				<div class="space-y-3">
					{#each data.recentSales as sale, idx}
						<div
							class="-mx-2 flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
						>
							<div class="flex min-w-0 items-center gap-3">
								<!-- Customer Avatar Initials -->
								<div
									class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold {avatarPalette[
										idx % avatarPalette.length
									]}"
								>
									{sale.initials}
								</div>

								<div class="min-w-0 space-y-0.5">
									<p class="truncate text-sm leading-none font-medium text-foreground">
										{sale.customerName}
									</p>
									<p class="truncate text-xs text-muted-foreground">
										{sale.customerPhone}
									</p>
								</div>
							</div>

							<div class="ml-3 flex shrink-0 flex-col items-end gap-1">
								<span class="font-mono text-sm font-semibold tracking-tight text-foreground">
									+{formatBasePrice(sale.total, data.baseCurrency)}
								</span>
								<div class="flex items-center gap-1.5">
									<span
										class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase {getStatusBadge(
											sale.status
										)}"
									>
										{sale.status}
									</span>
									<span class="text-[11px] text-muted-foreground">
										{sale.createdAt
											? new Date(sale.createdAt).toLocaleDateString('en-US', {
													month: 'short',
													day: 'numeric'
												})
											: '—'}
									</span>
								</div>
							</div>
						</div>
					{:else}
						<p class="py-8 text-center text-sm text-muted-foreground">No recent sales found.</p>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Lower Section: Fulfillment Pipeline, Catalog Health, & Quick Shortcuts -->
	<div class="grid gap-6 md:grid-cols-3">
		<!-- Order Fulfillment Pipeline -->
		<Card.Root class="border-border/80 shadow-xs">
			<Card.Header class="pb-3">
				<div class="flex items-center justify-between">
					<Card.Title class="text-sm font-semibold">Fulfillment Pipeline</Card.Title>
					<span class="font-mono text-xs text-muted-foreground">
						{data.totalOrdersCount} orders
					</span>
				</div>
				<Card.Description>Status breakdown across all store orders</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- Distribution Bar -->
				<div class="flex h-2 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="bg-emerald-500"
						style="width: {(data.statusBreakdown.delivered / (data.totalOrdersCount || 1)) * 100}%;"
						title="Delivered: {data.statusBreakdown.delivered}"
					></div>
					<div
						class="bg-blue-500"
						style="width: {(data.statusBreakdown.paid / (data.totalOrdersCount || 1)) * 100}%;"
						title="Paid: {data.statusBreakdown.paid}"
					></div>
					<div
						class="bg-indigo-500"
						style="width: {(data.statusBreakdown.shipped / (data.totalOrdersCount || 1)) * 100}%;"
						title="Shipped: {data.statusBreakdown.shipped}"
					></div>
					<div
						class="bg-amber-500"
						style="width: {(data.statusBreakdown.pending / (data.totalOrdersCount || 1)) * 100}%;"
						title="Pending: {data.statusBreakdown.pending}"
					></div>
				</div>

				<!-- Breakdown Pills Grid -->
				<div class="grid grid-cols-2 gap-2 text-xs">
					<div
						class="flex items-center justify-between rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5"
					>
						<span
							class="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400"
						>
							<CheckCircle2 class="h-3.5 w-3.5" />
							Delivered
						</span>
						<span class="font-mono font-bold text-emerald-800 dark:text-emerald-300">
							{data.statusBreakdown.delivered}
						</span>
					</div>

					<div
						class="flex items-center justify-between rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1.5"
					>
						<span class="flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-400">
							<DollarSign class="h-3.5 w-3.5" />
							Paid
						</span>
						<span class="font-mono font-bold text-blue-800 dark:text-blue-300">
							{data.statusBreakdown.paid}
						</span>
					</div>

					<div
						class="flex items-center justify-between rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1.5"
					>
						<span
							class="flex items-center gap-1.5 font-medium text-indigo-700 dark:text-indigo-400"
						>
							<Truck class="h-3.5 w-3.5" />
							Shipped
						</span>
						<span class="font-mono font-bold text-indigo-800 dark:text-indigo-300">
							{data.statusBreakdown.shipped}
						</span>
					</div>

					<div
						class="flex items-center justify-between rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5"
					>
						<span class="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
							<Clock class="h-3.5 w-3.5" />
							Pending
						</span>
						<span class="font-mono font-bold text-amber-800 dark:text-amber-300">
							{data.statusBreakdown.pending}
						</span>
					</div>
				</div>

				<a
					href="/orders"
					class="inline-flex items-center gap-1.5 pt-1 text-xs font-medium text-primary hover:underline"
				>
					Manage all fulfillments
					<ArrowRight class="h-3.5 w-3.5" />
				</a>
			</Card.Content>
		</Card.Root>

		<!-- Catalog & Inventory Status -->
		<Card.Root class="border-border/80 shadow-xs">
			<Card.Header class="pb-3">
				<div class="flex items-center justify-between">
					<Card.Title class="text-sm font-semibold">Catalog Health</Card.Title>
					<span class="font-mono text-xs text-muted-foreground">
						{data.stats.totalProducts} total
					</span>
				</div>
				<Card.Description>Inventory and category distribution</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-2 text-sm">
					<div class="flex items-center justify-between">
						<span class="flex items-center gap-1.5 text-muted-foreground">
							<Package class="h-4 w-4 text-purple-500" />
							Active Listing Rate
						</span>
						<span class="font-mono font-medium">
							{Math.round((data.stats.activeProducts / data.stats.totalProducts) * 100)}% ({data
								.stats.activeProducts}/{data.stats.totalProducts})
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="flex items-center gap-1.5 text-muted-foreground">
							<Layers class="h-4 w-4 text-blue-500" />
							Active Categories
						</span>
						<span class="font-mono font-medium">
							{data.categoriesCount} categories
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="flex items-center gap-1.5 text-muted-foreground">
							<Clock class="h-4 w-4 text-amber-500" />
							Low Stock Alert (&le;10)
						</span>
						<span
							class="font-mono font-medium {data.stats.lowStockCount > 0
								? 'font-semibold text-amber-600 dark:text-amber-400'
								: ''}"
						>
							{data.stats.lowStockCount} items
						</span>
					</div>
				</div>

				<a
					href="/products"
					class="inline-flex items-center gap-1.5 pt-1 text-xs font-medium text-primary hover:underline"
				>
					Browse product catalog
					<ArrowRight class="h-3.5 w-3.5" />
				</a>
			</Card.Content>
		</Card.Root>

		<!-- Quick Navigation Shortcuts -->
		<Card.Root class="border-border/80 shadow-xs">
			<Card.Header class="pb-3">
				<Card.Title class="text-sm font-semibold">Quick Actions</Card.Title>
				<Card.Description>Common store management workflows</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-2">
				<a
					href="/products/new"
					class="flex items-center justify-between rounded-lg border border-border/60 p-2.5 text-sm font-medium transition-colors hover:bg-muted/60"
				>
					<span class="flex items-center gap-2">
						<Plus class="h-4 w-4 text-emerald-600" />
						Create New Product
					</span>
					<ArrowRight class="h-3.5 w-3.5 text-muted-foreground" />
				</a>

				<a
					href="/coupons/new"
					class="flex items-center justify-between rounded-lg border border-border/60 p-2.5 text-sm font-medium transition-colors hover:bg-muted/60"
				>
					<span class="flex items-center gap-2">
						<Tag class="h-4 w-4 text-purple-600" />
						Create Discount Coupon
					</span>
					<ArrowRight class="h-3.5 w-3.5 text-muted-foreground" />
				</a>

				<a
					href="/reviews"
					class="flex items-center justify-between rounded-lg border border-border/60 p-2.5 text-sm font-medium transition-colors hover:bg-muted/60"
				>
					<span class="flex items-center gap-2">
						<Star class="h-4 w-4 text-amber-600" />
						Moderate Reviews
					</span>
					<ArrowRight class="h-3.5 w-3.5 text-muted-foreground" />
				</a>

				<a
					href="/users"
					class="flex items-center justify-between rounded-lg border border-border/60 p-2.5 text-sm font-medium transition-colors hover:bg-muted/60"
				>
					<span class="flex items-center gap-2">
						<Users class="h-4 w-4 text-blue-600" />
						Customer Directory
					</span>
					<ArrowRight class="h-3.5 w-3.5 text-muted-foreground" />
				</a>
			</Card.Content>
		</Card.Root>
	</div>
</div>
