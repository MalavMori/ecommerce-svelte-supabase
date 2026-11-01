<script lang="ts">
	import { 
		Package, 
		Calendar, 
		ArrowRight, 
		ShoppingBag,
		Clock,
		CheckCircle2,
		Truck,
		AlertCircle,
		RotateCcw
	} from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { currencyState } from '#lib';

	let { data } = $props();

	function getStatusBadgeClass(status: string | null | undefined) {
		switch (status?.toLowerCase()) {
			case 'paid':
				return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
			case 'shipped':
				return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
			case 'delivered':
				return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
			case 'pending':
				return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
			case 'cancelled':
				return 'bg-destructive/10 text-destructive border-destructive/20';
			default:
				return 'bg-muted text-muted-foreground';
		}
	}
</script>

<svelte:head>
	<title>Order History — Nexus</title>
</svelte:head>

<div class="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-6">
	
	<div class="border-b border-border/40 pb-4">
		<h1 class="text-xl sm:text-2xl font-black tracking-tight text-foreground">
			Order History
		</h1>
		<p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
			Track your past hardware purchases, invoices, and shipment tracking.
		</p>
	</div>

	{#if data.orders.length > 0}
		<div class="space-y-4">
			{#each data.orders as order}
				<div class="p-5 sm:p-6 rounded-2xl border border-border/60 bg-card hover:border-border transition-all space-y-4">
					
					<!-- Top Bar: Order ID, Date, Status -->
					<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40 text-xs">
						<div class="flex items-center gap-3">
							<span class="font-mono font-bold text-foreground">
								#{order.id.slice(0, 8).toUpperCase()}
							</span>
							<span class="text-muted-foreground">•</span>
							<span class="text-muted-foreground">
								{order.created_at ? new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
							</span>
						</div>

						<div class="flex items-center gap-2 flex-wrap">
							{#if order.returns && order.returns.length > 0}
								{@const ret = order.returns[0]}
								<span class="px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase flex items-center gap-1">
									<RotateCcw class="h-3 w-3" />
									<span>Return: {ret.status}</span>
								</span>
							{/if}

							{#if order.shipments && order.shipments.length > 0}
								{@const shp = order.shipments[0]}
								<span class="px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase flex items-center gap-1">
									<Truck class="h-3 w-3" />
									<span>{shp.carrier || 'Tracking'}: {shp.tracking_number}</span>
								</span>
							{/if}

							<span class="px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider {getStatusBadgeClass(order.status)}">
								{order.status}
							</span>
						</div>
					</div>

					<!-- Middle: Items Snippet -->
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div class="space-y-1">
							<p class="text-sm font-bold text-foreground">
								{order.order_items?.[0]?.product_name || 'Hardware item'}
								{#if (order.order_items?.length || 0) > 1}
									<span class="text-muted-foreground font-normal">
										+ {(order.order_items?.length || 1) - 1} more {(order.order_items?.length || 1) - 1 === 1 ? 'item' : 'items'}
									</span>
								{/if}
							</p>
							<p class="text-xs text-muted-foreground">
								Total Units: {order.order_items?.reduce((sum: number, it: any) => sum + it.quantity, 0) || 1}
							</p>
						</div>

						<div class="flex items-center justify-between sm:justify-end gap-4">
							<div class="text-left sm:text-right">
								<p class="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
								<p class="text-base font-black text-foreground">
									{#if order.display_currency_code && order.display_total != null}
										{currencyState.formatAmount(order.display_total, order.display_currency_code)}
										{#if order.display_currency_code !== currencyState.baseCurrency}
											<span class="text-xs font-mono font-medium text-muted-foreground ml-1">
												{order.display_currency_code}
											</span>
										{/if}
									{:else}
										{currencyState.format(Number(order.total))}
									{/if}
								</p>
							</div>

							<Button size="sm" variant="outline" href="/account/orders/{order.id}" class="gap-1.5 text-xs font-semibold">
								<span>View Details</span>
								<ArrowRight class="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>

				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center p-12 border border-dashed rounded-3xl space-y-3">
			<div class="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mx-auto">
				<Package class="h-6 w-6 stroke-[1.5]" />
			</div>
			<div class="space-y-1">
				<h3 class="text-base font-bold text-foreground">No orders yet</h3>
				<p class="text-xs text-muted-foreground max-w-xs mx-auto">
					When you place an order, it will appear here with live tracking details.
				</p>
			</div>
			<Button size="sm" href="/products" class="mt-2 font-bold">
				<span>Explore Products</span>
				<ArrowRight class="h-4 w-4 ml-1" />
			</Button>
		</div>
	{/if}

</div>
