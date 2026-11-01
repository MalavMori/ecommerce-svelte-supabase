<script lang="ts">
	import { 
		CheckCircle2, 
		Package, 
		MapPin, 
		Calendar, 
		ArrowRight, 
		Copy, 
		Check,
		Truck,
		Receipt,
		CreditCard,
		Smartphone,
		Building2,
		Wallet,
		Printer,
		ShieldCheck
	} from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { currencyState } from '#lib';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const impliedRate = $derived.by(() => {
		if (data.order.display_total != null && Number(data.order.total) > 0) {
			return Number(data.order.display_total) / Number(data.order.total);
		}
		return null;
	});

	let copied = $state(false);

	function copyOrderId() {
		navigator.clipboard.writeText(data.order.id);
		copied = true;
		toast.success('Order ID copied to clipboard');
		setTimeout(() => (copied = false), 2000);
	}

	function handlePrintReceipt() {
		if (typeof window !== 'undefined') {
			window.print();
		}
	}

	const paymentLabel = $derived.by(() => {
		if (data.paymentMethod === 'card') {
			const brand = data.paymentDetails?.brand ? data.paymentDetails.brand.toUpperCase() : 'CARD';
			const last4 = data.paymentDetails?.last4 || '4242';
			return `${brand} •••• ${last4}`;
		}
		if (data.paymentMethod === 'upi') {
			return data.paymentDetails?.upiId ? `UPI (${data.paymentDetails.upiId})` : 'UPI';
		}
		if (data.paymentMethod === 'netbanking') {
			return `Net Banking (${data.paymentDetails?.bank || 'Bank'})`;
		}
		if (data.paymentMethod === 'wallet') {
			return `Digital Wallet (${data.paymentDetails?.wallet || 'Wallet'})`;
		}
		return 'Payment Gateway';
	});
</script>

<svelte:head>
	<title>Order Confirmed — Nexus</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">
	
	<!-- Top Success Banner -->
	<div class="text-center space-y-4">
		<div class="inline-flex h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 items-center justify-center mx-auto shadow-inner animate-in zoom-in-50 duration-500">
			<CheckCircle2 class="h-10 w-10 stroke-[2.5]" />
		</div>
		<div class="space-y-1">
			<h1 class="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
				Payment Confirmed!
			</h1>
			<p class="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
				Thank you for choosing Nexus. Your payment has been authorized and your items are being prepared for dispatch.
			</p>
		</div>

		<!-- Order Number Pill -->
		<div class="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-1.5 text-xs font-mono">
			<span class="text-muted-foreground">Order Ref:</span>
			<span class="font-bold text-foreground">{data.order.id.slice(0, 13)}...</span>
			<button
				type="button"
				onclick={copyOrderId}
				class="ml-1 text-muted-foreground hover:text-foreground transition-colors"
				aria-label="Copy order id"
			>
				{#if copied}
					<Check class="h-3.5 w-3.5 text-emerald-500" />
				{:else}
					<Copy class="h-3.5 w-3.5" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Order Details Card -->
	<div class="rounded-3xl border border-border/60 bg-card shadow-xs overflow-hidden print:border-none print:shadow-none">
		<!-- Card Header with Status -->
		<div class="p-6 sm:p-8 border-b border-border/40 flex flex-wrap items-center justify-between gap-4 bg-muted/20">
			<div class="space-y-1">
				<p class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Status</p>
				<div class="flex items-center gap-2">
					<Badge class="bg-emerald-600 text-white font-bold text-xs uppercase px-2.5 py-0.5">
						{data.order.payment_status === 'paid' ? 'Paid' : 'Payment Processing'}
					</Badge>
					<span class="text-xs text-muted-foreground font-medium flex items-center gap-1">
						<CreditCard class="h-3.5 w-3.5 text-primary" />
						<span>Paid via Stripe ({paymentLabel})</span>
					</span>
				</div>
			</div>

			<div class="text-right space-y-0.5">
				<p class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Date</p>
				<p class="text-xs font-semibold text-foreground">
					{data.order.created_at ? new Date(data.order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
				</p>
			</div>
		</div>

		<!-- Payment Receipt Snapshot Box -->
		<div class="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-muted/30 border border-border/60 flex flex-wrap items-center justify-between gap-4">
			<div class="space-y-1">
				<p class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Stripe Transaction Reference</p>
				<p class="text-xs font-mono font-bold text-foreground">
					{data.order.stripe_payment_intent_id || `TXN-${data.order.id.slice(0, 8).toUpperCase()}-STRIPE`}
				</p>
			</div>
			
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={handlePrintReceipt}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-xs"
				>
					<Printer class="h-3.5 w-3.5" />
					<span>Print Receipt</span>
				</button>
			</div>
		</div>

		<!-- Items List -->
		<div class="p-6 sm:p-8 space-y-6">
			<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
				Purchased Hardware ({data.order.order_items?.length || 0})
			</h3>

			<div class="space-y-3 divide-y divide-border/40">
				{#each data.order.order_items || [] as item}
					<div class="pt-3 first:pt-0 flex items-center justify-between gap-4 text-xs sm:text-sm">
						<div>
							<p class="font-bold text-foreground">{item.product_name}</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								Qty: {item.quantity} × {currencyState.formatForCurrency(Number(item.unit_price), data.order.display_currency_code, impliedRate)}
							</p>
						</div>
						<span class="font-bold text-foreground">
							{currencyState.formatForCurrency(Number(item.line_total), data.order.display_currency_code, impliedRate)}
						</span>
					</div>
				{/each}
			</div>

			<!-- Breakdown -->
			<div class="pt-4 border-t border-border/40 space-y-2 text-xs">
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

				<div class="pt-2 border-t border-border/40 flex items-baseline justify-between text-sm sm:text-base font-black text-foreground">
					<span>Total Paid</span>
					{#if data.order.display_currency_code && data.order.display_total != null}
						<div class="flex items-baseline gap-1.5">
							<span class="text-lg sm:text-xl">{currencyState.formatAmount(data.order.display_total, data.order.display_currency_code)}</span>
							{#if data.order.display_currency_code !== currencyState.baseCurrency}
								<span class="text-xs font-mono font-medium text-muted-foreground">
									{data.order.display_currency_code}
								</span>
							{/if}
						</div>
					{:else}
						<span class="text-lg sm:text-xl">{currencyState.format(Number(data.order.total))}</span>
					{/if}
				</div>
			</div>

			<!-- Shipping Address Snapshot -->
			{#if data.order.addresses}
				<div class="pt-4 border-t border-border/40 space-y-2">
					<div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
						<MapPin class="h-3.5 w-3.5 text-primary" />
						<span>Shipping Destination</span>
					</div>
					<div class="p-3.5 rounded-xl bg-muted/30 text-xs text-muted-foreground space-y-0.5">
						<p class="font-bold text-foreground">{data.order.addresses.line1}</p>
						{#if data.order.addresses.line2}
							<p>{data.order.addresses.line2}</p>
						{/if}
						<p>{data.order.addresses.city}, {data.order.addresses.state} {data.order.addresses.postal_code}</p>
						<p class="uppercase font-mono text-[10px]">{data.order.addresses.country}</p>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Bottom CTAs -->
	<div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 print:hidden">
		<Button variant="outline" href="/account/orders" class="w-full sm:w-auto font-semibold">
			<span>View All Orders</span>
		</Button>
		<Button href="/products" class="w-full sm:w-auto font-bold shadow-md gap-2">
			<span>Continue Shopping</span>
			<ArrowRight class="h-4 w-4" />
		</Button>
	</div>

</div>
