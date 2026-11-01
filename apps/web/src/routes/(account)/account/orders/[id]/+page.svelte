<script lang="ts">
	import { 
		ArrowLeft, 
		CheckCircle2, 
		Clock, 
		Truck, 
		PackageCheck, 
		MapPin, 
		Receipt,
		RotateCcw,
		AlertCircle,
		Check,
		XCircle,
		History,
		ExternalLink,
		LoaderCircle
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import * as Breadcrumb from '@repo/ui/lib/components/ui/breadcrumb/index.js';
	import { currencyState } from '#lib';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	const impliedRate = $derived.by(() => {
		if (data.order.display_total != null && Number(data.order.total) > 0) {
			return Number(data.order.display_total) / Number(data.order.total);
		}
		return null;
	});

	const statusSteps = [
		{ key: 'pending', label: 'Order Placed', sublabel: 'Order received', icon: Clock },
		{ key: 'paid', label: 'Payment Confirmed', sublabel: 'Processed', icon: CheckCircle2 },
		{ key: 'shipped', label: 'Shipped', sublabel: 'In transit', icon: Truck },
		{ key: 'delivered', label: 'Delivered', sublabel: 'Completed', icon: PackageCheck }
	];

	const isCancelled = $derived(data.order.status?.toLowerCase() === 'cancelled');
	const isDelivered = $derived(data.order.status?.toLowerCase() === 'delivered');

	function getStepIndex(status: string | null | undefined) {
		switch (status?.toLowerCase()) {
			case 'pending': return 0;
			case 'paid': return 1;
			case 'shipped': return 2;
			case 'delivered': return 3;
			default: return 1;
		}
	}

	const currentStepIndex = $derived(getStepIndex(data.order.status));

	// Return request form state
	let showReturnForm = $state(false);
	let isSubmittingReturn = $state(false);
	let returnReason = $state('');

	$effect(() => {
		if (form?.success) {
			toast.success(form.message || 'Return request submitted successfully');
			showReturnForm = false;
			returnReason = '';
		} else if (form?.message) {
			toast.error(form.message);
		}
	});

	function getReturnStatusBadge(status: string) {
		switch (status) {
			case 'requested':
				return { label: 'Under Review', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
			case 'approved':
				return { label: 'Return Approved', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
			case 'rejected':
				return { label: 'Return Rejected', class: 'bg-destructive/10 text-destructive border-destructive/20' };
			case 'refunded':
				return { label: 'Refunded', class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
			default:
				return { label: status, class: 'bg-muted text-muted-foreground' };
		}
	}
</script>

<svelte:head>
	<title>Order #{data.order.id.slice(0, 8).toUpperCase()} — Nexus</title>
</svelte:head>

<div class="space-y-6">
	
	<!-- Breadcrumbs -->
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/account">Account</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/account/orders">Orders</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>#{data.order.id.slice(0, 8).toUpperCase()}</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!-- Main Order Card -->
	<div class="rounded-3xl border border-border/60 bg-card shadow-xs overflow-hidden space-y-6 p-6 sm:p-8">
		
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<Button variant="ghost" size="sm" href="/account/orders" class="h-8 px-2 -ml-2 text-xs font-semibold">
						<ArrowLeft class="h-3.5 w-3.5 mr-1" />
						<span>All Orders</span>
					</Button>
				</div>
				<h1 class="text-xl sm:text-2xl font-black tracking-tight text-foreground">
					Order #{data.order.id.slice(0, 8).toUpperCase()}
				</h1>
				<p class="text-xs text-muted-foreground font-mono">
					Full ID: {data.order.id} • Placed on {data.order.created_at ? new Date(data.order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown date'}
				</p>
			</div>

			<Badge class="self-start sm:self-auto {isCancelled ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary text-primary-foreground'} font-bold text-xs uppercase px-3 py-1 shadow-2xs">
				{data.order.status}
			</Badge>
		</div>

		<!-- Status Stepper Visualizer -->
		<div class="py-2">
			{#if isCancelled}
				<div class="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 sm:p-5 flex items-center gap-3.5 text-destructive">
					<div class="h-10 w-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
						<XCircle class="h-5 w-5" />
					</div>
					<div class="space-y-0.5">
						<p class="text-sm font-bold">This Order Was Cancelled</p>
						<p class="text-xs text-muted-foreground">
							No further fulfillment or shipping updates will be processed for this order.
						</p>
					</div>
				</div>
			{:else}
				<div class="grid grid-cols-4 relative">
					{#each statusSteps as step, i}
						{@const isCompleted = i < currentStepIndex}
						{@const isCurrent = i === currentStepIndex}

						<div class="relative flex flex-col items-center text-center">
							<!-- Track to Next Step -->
							{#if i < statusSteps.length - 1}
								<div class="absolute top-5 left-1/2 w-full -translate-y-1/2 h-1 bg-muted z-0 overflow-hidden">
									<div
										class="h-full bg-primary transition-all duration-700 ease-out {i < currentStepIndex ? 'w-full' : 'w-0'}"
									></div>
								</div>
							{/if}

							<!-- Step Node Circle -->
							<div class="relative z-10">
								<div
									class="h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 {
										isCurrent
											? 'bg-primary text-primary-foreground border-primary shadow-md ring-4 ring-primary/20 scale-105'
											: isCompleted
												? 'bg-primary text-primary-foreground border-primary shadow-2xs'
												: 'bg-card text-muted-foreground border-border/80'
									}"
								>
									{#if isCompleted}
										<Check class="h-4 w-4 stroke-[2.5]" />
									{:else}
										<step.icon class="h-4 w-4 {isCurrent ? 'animate-pulse' : ''}" />
									{/if}
								</div>
							</div>

							<!-- Step Label -->
							<div class="pt-2.5 space-y-0.5 max-w-full px-1">
								<p
									class="text-xs sm:text-sm font-bold transition-colors leading-tight {
										isCurrent
											? 'text-primary'
											: isCompleted
												? 'text-foreground'
												: 'text-muted-foreground'
									}"
								>
									{step.label}
								</p>
								<p class="hidden sm:block text-[11px] text-muted-foreground">
									{step.sublabel}
								</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Active Return or Return Request Action -->
		{#if data.order.returnRequest}
			{@const rBadge = getReturnStatusBadge(data.order.returnRequest.status)}
			<div class="rounded-2xl border {rBadge.class} bg-card p-5 space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<RotateCcw class="h-4 w-4 text-primary" />
						<span class="text-sm font-bold text-foreground">Return Request</span>
					</div>
					<Badge class="{rBadge.class} font-bold text-xs uppercase px-2.5 py-0.5 border">
						{rBadge.label}
					</Badge>
				</div>
				<div class="text-xs space-y-1 text-muted-foreground">
					<p><span class="font-semibold text-foreground">Reason:</span> {data.order.returnRequest.reason}</p>
					{#if data.order.returnRequest.refund_amount}
						<p><span class="font-semibold text-foreground">Refund Amount:</span> {currencyState.formatForCurrency(Number(data.order.returnRequest.refund_amount), data.order.display_currency_code, impliedRate)}</p>
					{/if}
					<p><span class="font-semibold text-foreground">Requested on:</span> {new Date(data.order.returnRequest.requested_at || 0).toLocaleDateString()}</p>
				</div>
			</div>
		{:else if isDelivered}
			<div class="rounded-2xl border border-border/60 bg-muted/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div class="flex items-center gap-2">
						<RotateCcw class="h-4 w-4 text-primary" />
						<span class="text-sm font-bold text-foreground">Need to Return This Order?</span>
					</div>
					<p class="text-xs text-muted-foreground mt-1">
						Eligible items can be returned within 30 days of delivery for a full refund.
					</p>
				</div>

				<Button
					variant="outline"
					size="sm"
					onclick={() => (showReturnForm = !showReturnForm)}
					class="font-semibold text-xs border-primary/40 text-primary hover:bg-primary/5 shrink-0"
				>
					{showReturnForm ? 'Cancel Request' : 'Request Return'}
				</Button>
			</div>

			{#if showReturnForm}
				<form
					action="?/requestReturn"
					method="POST"
					use:enhance={() => {
						isSubmittingReturn = true;
						return async ({ update }) => {
							isSubmittingReturn = false;
							await update();
						};
					}}
					class="rounded-2xl border border-border/60 bg-card p-5 space-y-4"
				>
					<h4 class="text-sm font-bold text-foreground">Submit Return Request</h4>
					<p class="text-xs text-muted-foreground">
						Returns apply to the whole order. Please describe why you would like to return this order.
					</p>

					<div>
						<label for="return-reason" class="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
							Reason for Return
						</label>
						<textarea
							id="return-reason"
							name="reason"
							rows="3"
							required
							bind:value={returnReason}
							placeholder="Please explain the issue (defective, wrong item, not as described, etc.)..."
							class="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
						></textarea>
					</div>

					<div class="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onclick={() => (showReturnForm = false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={isSubmittingReturn || returnReason.trim().length < 5}
							class="font-bold gap-1.5"
						>
							{#if isSubmittingReturn}
								<LoaderCircle class="h-3.5 w-3.5 animate-spin" />
								<span>Submitting...</span>
							{:else}
								<span>Submit Request</span>
							{/if}
						</Button>
					</div>
				</form>
			{/if}
		{/if}

		<!-- Shipment Tracking Section -->
		{#if data.order.shipments && data.order.shipments.length > 0}
			<div class="space-y-3 pt-4 border-t border-border/40">
				<div class="flex items-center gap-2">
					<Truck class="h-4 w-4 text-primary" />
					<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
						Shipment Tracking ({data.order.shipments.length})
					</h3>
				</div>

				<div class="space-y-3">
					{#each data.order.shipments as ship}
						<div class="p-4 rounded-2xl border border-border/60 bg-muted/10 space-y-2">
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<div class="flex items-center gap-2">
									<span class="font-bold text-sm text-foreground">{ship.carrier || 'Express Courier'}</span>
									<Badge variant="outline" class="text-[11px] font-bold uppercase">
										{ship.status}
									</Badge>
								</div>
								{#if ship.tracking_number}
									<div class="flex items-center gap-1.5 text-xs font-mono text-primary">
										<span>Tracking: #{ship.tracking_number}</span>
									</div>
								{/if}
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
								{#if ship.shipped_at}
									<p>Shipped: <span class="text-foreground">{new Date(ship.shipped_at).toLocaleDateString()}</span></p>
								{/if}
								{#if ship.estimated_delivery}
									<p>Est. Delivery: <span class="text-foreground">{new Date(ship.estimated_delivery).toLocaleDateString()}</span></p>
								{/if}
								{#if ship.delivered_at}
									<p>Delivered: <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{new Date(ship.delivered_at).toLocaleDateString()}</span></p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Order Status History Audit Trail -->
		{#if data.order.statusHistory && data.order.statusHistory.length > 0}
			<div class="space-y-3 pt-4 border-t border-border/40">
				<div class="flex items-center gap-2">
					<History class="h-4 w-4 text-primary" />
					<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
						Status Timeline
					</h3>
				</div>

				<div class="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
					{#each data.order.statusHistory as entry}
						<div class="relative text-xs space-y-0.5">
							<div class="absolute -left-6 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background"></div>
							<div class="flex items-center gap-2">
								<span class="font-bold uppercase text-foreground">{entry.status}</span>
								<span class="text-[11px] text-muted-foreground">
									{entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
								</span>
							</div>
							<p class="text-muted-foreground text-[11px]">
								Status automatically recorded by system
							</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Order Items Table -->
		<div class="space-y-3 pt-4 border-t border-border/40">
			<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
				Items Ordered ({data.order.order_items?.length || 0})
			</h3>

			<div class="divide-y divide-border/40 border border-border/40 rounded-2xl overflow-hidden">
				{#each data.order.order_items || [] as item}
					<div class="p-4 flex items-center justify-between gap-4 text-xs sm:text-sm bg-card hover:bg-muted/10 transition-colors">
						<div class="space-y-0.5">
							<p class="font-bold text-foreground">{item.product_name}</p>
							{#if item.variant_label}
								<p class="text-xs text-primary font-medium">{item.variant_label}</p>
							{/if}
							<p class="text-xs text-muted-foreground">
								Unit Price: {currencyState.formatForCurrency(Number(item.unit_price), data.order.display_currency_code, impliedRate)} • Quantity: {item.quantity}
							</p>
						</div>
						<span class="font-bold text-foreground text-right">
							{currencyState.formatForCurrency(Number(item.line_total), data.order.display_currency_code, impliedRate)}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Two Column: Shipping & Pricing Summary -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border/40">
			
			<!-- Shipping Destination -->
			<div class="space-y-2">
				<div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
					<MapPin class="h-3.5 w-3.5 text-primary" />
					<span>Shipping Address</span>
				</div>
				{#if data.order.addresses}
					<div class="p-4 rounded-2xl bg-muted/20 border border-border/40 text-xs text-muted-foreground space-y-0.5">
						<p class="font-bold text-foreground">{data.order.addresses.line1}</p>
						{#if data.order.addresses.line2}
							<p>{data.order.addresses.line2}</p>
						{/if}
						<p>{data.order.addresses.city}, {data.order.addresses.state} {data.order.addresses.postal_code}</p>
						<p class="uppercase font-mono text-[10px]">{data.order.addresses.country}</p>
					</div>
				{:else}
					<p class="text-xs text-muted-foreground">Standard Delivery Address</p>
				{/if}
			</div>

			<!-- Price Breakdown -->
			<div class="space-y-2">
				<div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
					<Receipt class="h-3.5 w-3.5 text-primary" />
					<span>Payment Breakdown</span>
				</div>

				<div class="p-4 rounded-2xl bg-muted/20 border border-border/40 text-xs space-y-2">
					<div class="flex items-center justify-between text-muted-foreground">
						<span>Subtotal</span>
						<span class="font-semibold text-foreground">{currencyState.formatForCurrency(Number(data.order.subtotal), data.order.display_currency_code, impliedRate)}</span>
					</div>

					{#if Number(data.order.discount_amount) > 0}
						<div class="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
							<span>Discount {data.order.coupons?.code ? `(${data.order.coupons.code})` : ''}</span>
							<span class="font-bold">-{currencyState.formatForCurrency(Number(data.order.discount_amount), data.order.display_currency_code, impliedRate)}</span>
						</div>
					{/if}

					<div class="flex items-center justify-between text-muted-foreground">
						<span>Shipping</span>
						<span>{Number(data.order.shipping_amount) === 0 ? 'FREE' : currencyState.formatForCurrency(Number(data.order.shipping_amount), data.order.display_currency_code, impliedRate)}</span>
					</div>

					<div class="pt-2 border-t border-border/40 flex items-baseline justify-between text-sm font-black text-foreground">
						<span>Total Paid</span>
						{#if data.order.display_currency_code && data.order.display_total != null}
							<div class="flex items-baseline gap-1.5">
								<span class="text-base text-foreground">{currencyState.formatAmount(data.order.display_total, data.order.display_currency_code)}</span>
								{#if data.order.display_currency_code !== currencyState.baseCurrency}
									<span class="text-xs font-mono font-medium text-muted-foreground">
										{data.order.display_currency_code}
									</span>
								{/if}
							</div>
						{:else}
							<span class="text-base text-foreground">{currencyState.format(Number(data.order.total))}</span>
						{/if}
					</div>
				</div>
			</div>

		</div>

	</div>
</div>
