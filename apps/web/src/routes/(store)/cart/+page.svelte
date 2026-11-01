<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { 
		ShoppingBag, 
		Trash2, 
		Plus, 
		Minus, 
		ArrowRight, 
		Truck, 
		ShieldCheck, 
		Sparkles, 
		Tag, 
		X, 
		RotateCcw,
		Lock
	} from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import * as Breadcrumb from '@repo/ui/lib/components/ui/breadcrumb/index.js';
	import PriceDisplay from '#lib/components/PriceDisplay.svelte';
	import { cartState, currencyState } from '#lib';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	let updatingId = $state<string | null>(null);
	let couponInput = $state('');

	async function updateQuantity(cartItemId: string, newQty: number, stockLimit: number) {
		if (newQty < 1) return;
		if (newQty > stockLimit) {
			toast.error(`Only ${stockLimit} units available in stock`);
			return;
		}

		updatingId = cartItemId;
		try {
			const res = await fetch('/api/cart', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cartItemId, quantity: newQty })
			});
			const result = await res.json();
			if (res.ok) {
				cartState.setCount(result.cartCount);
				await invalidateAll();
			} else {
				toast.error(result.message || 'Failed to update quantity');
			}
		} catch (err: any) {
			toast.error(err.message || 'Network error');
		} finally {
			updatingId = null;
		}
	}

	async function removeItem(cartItemId: string, productName: string) {
		updatingId = cartItemId;
		try {
			const res = await fetch('/api/cart', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cartItemId })
			});
			const result = await res.json();
			if (res.ok) {
				cartState.setCount(result.cartCount);
				toast.success(`Removed "${productName}" from cart`);
				await invalidateAll();
			} else {
				toast.error(result.message || 'Failed to remove item');
			}
		} catch (err: any) {
			toast.error(err.message || 'Network error');
		} finally {
			updatingId = null;
		}
	}

	const freeShippingThreshold = 100;
	const amountForFreeShipping = $derived(
		Math.max(0, Math.round((freeShippingThreshold - data.subtotal) * 100) / 100)
	);
	const shippingProgress = $derived(
		Math.min(100, Math.round((data.subtotal / freeShippingThreshold) * 100))
	);
</script>

<svelte:head>
	<title>Your Shopping Cart ({data.items.length}) — Nexus</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
	
	<!-- Breadcrumbs -->
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>Shopping Cart</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<div class="flex items-center justify-between border-b border-border/40 pb-4">
		<div>
			<h1 class="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
				Shopping Cart
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
				{data.items.length} {data.items.length === 1 ? 'unique product' : 'unique products'} in your cart
			</p>
		</div>
		{#if data.items.length > 0}
			<Button variant="ghost" size="sm" href="/products" class="text-xs font-semibold text-primary">
				Continue Shopping →
			</Button>
		{/if}
	</div>

	{#if data.items.length > 0}
		<!-- Free Shipping Threshold Banner -->
		<div class="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-2">
			<div class="flex items-center justify-between text-xs font-semibold">
				<div class="flex items-center gap-2">
					<Truck class="h-4 w-4 text-primary" />
					{#if amountForFreeShipping === 0}
						<span class="text-emerald-600 dark:text-emerald-400 font-bold">
							🎉 Congratulations! You have unlocked FREE Express Shipping!
						</span>
					{:else}
						<span>
							Add <strong class="text-primary font-bold">{currencyState.format(amountForFreeShipping)}</strong> more to qualify for <strong class="text-foreground font-bold">FREE Express Shipping</strong>
						</span>
					{/if}
				</div>
				<span class="text-muted-foreground font-mono">{shippingProgress}%</span>
			</div>
			<!-- Progress Bar -->
			<div class="h-2 rounded-full bg-muted overflow-hidden">
				<div
					class="h-full bg-primary rounded-full transition-all duration-500"
					style="width: {shippingProgress}%"
				></div>
			</div>
		</div>

		<!-- Cart Grid (Items on left, Summary on right) -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
			
			<!-- Items Column (Spans 8 cols) -->
			<div class="lg:col-span-8 space-y-4">
				{#each data.items as item}
					<div class="p-4 sm:p-5 rounded-2xl border border-border/60 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
						
						<!-- Product Thumbnail & Info -->
						<div class="flex items-center gap-4 flex-1">
							<a href="/products/{item.slug}" class="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/30">
								{#if item.imageUrl}
									<img src={item.imageUrl} alt={item.name} class="h-full w-full object-cover" />
								{:else}
									<div class="h-full w-full flex items-center justify-center text-muted-foreground/40">
										<ShoppingBag class="h-6 w-6" />
									</div>
								{/if}
							</a>

							<div class="space-y-1">
								<h3 class="font-bold text-sm sm:text-base leading-snug">
									<a href="/products/{item.slug}" class="hover:text-primary transition-colors line-clamp-2">
										{item.name}
									</a>
								</h3>
								{#if item.variantLabel}
									<p class="text-xs text-muted-foreground font-medium">{item.variantLabel}</p>
								{/if}
								<div class="flex items-center gap-2 text-xs text-muted-foreground">
									<span>SKU: {item.sku}</span>
									<span>•</span>
									<span class="font-medium text-foreground">{currencyState.format(item.price)} each</span>
								</div>
							</div>
						</div>

						<!-- Quantity Controls & Line Total -->
						<div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
							<!-- Quantity Stepper -->
							<div class="inline-flex items-center rounded-xl border border-border bg-muted/40 p-0.5">
								<button
									type="button"
									onclick={() => updateQuantity(item.id, item.quantity - 1, item.stockQuantity)}
									disabled={item.quantity <= 1 || updatingId === item.id}
									aria-label="Decrease quantity"
									class="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
								>
									<Minus class="h-3 w-3" />
								</button>
								<span class="w-9 text-center text-xs font-bold font-mono">
									{item.quantity}
								</span>
								<button
									type="button"
									onclick={() => updateQuantity(item.id, item.quantity + 1, item.stockQuantity)}
									disabled={item.quantity >= item.stockQuantity || updatingId === item.id}
									aria-label="Increase quantity"
									class="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
								>
									<Plus class="h-3 w-3" />
								</button>
							</div>

							<!-- Line Total -->
							<div class="text-right min-w-20">
								<span class="font-bold text-base text-foreground tracking-tight">
									{currencyState.format(item.lineTotal)}
								</span>
							</div>

							<!-- Remove Button -->
							<button
								type="button"
								onclick={() => removeItem(item.id, item.name)}
								disabled={updatingId === item.id}
								aria-label="Remove item"
								class="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						</div>

					</div>
				{/each}
			</div>

			<!-- Summary Column (Spans 4 cols) -->
			<div class="lg:col-span-4 space-y-6 sticky top-24">
				<div class="rounded-3xl border border-border/60 bg-card p-6 shadow-xs space-y-6">
					<h3 class="text-lg font-black tracking-tight text-foreground pb-3 border-b border-border/40">
						Order Summary
					</h3>

					<!-- Coupon Box -->
					<div class="space-y-2">
						<label for="coupon-code-input" class="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
							Promo / Coupon Code
						</label>

						{#if data.appliedCoupon}
							<div class="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
								<div class="flex items-center gap-2">
									<Tag class="h-4 w-4 shrink-0" />
									<span>Code <strong>{data.appliedCoupon.code}</strong> applied</span>
								</div>
								<form method="POST" action="?/removeCoupon" use:enhance>
									<button type="submit" class="p-1 rounded hover:bg-emerald-500/20 text-emerald-600 transition-colors" aria-label="Remove coupon">
										<X class="h-3.5 w-3.5" />
									</button>
								</form>
							</div>
						{:else}
							<form method="POST" action="?/applyCoupon" use:enhance class="flex gap-2">
								<Input
									id="coupon-code-input"
									type="text"
									name="code"
									placeholder="e.g. WELCOME10"
									bind:value={couponInput}
									required
									class="h-9.5 text-xs uppercase"
								/>
								<Button type="submit" size="sm" variant="outline" class="h-9.5 px-3 text-xs font-bold shrink-0">
									Apply
								</Button>
							</form>
						{/if}

						{#if data.couponError}
							<p class="text-[11px] font-semibold text-destructive mt-1">
								{data.couponError}
							</p>
						{/if}
					</div>

					<!-- Pricing Breakdown -->
					<div class="space-y-3 pt-4 border-t border-border/40 text-sm">
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">Subtotal</span>
							<span class="font-semibold text-foreground">{currencyState.format(data.subtotal)}</span>
						</div>

						{#if data.discountAmount > 0}
							<div class="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
								<span>Discount ({data.appliedCoupon?.code})</span>
								<span class="font-bold">-{currencyState.format(data.discountAmount)}</span>
							</div>
						{/if}

						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">Estimated Shipping</span>
							{#if data.shippingAmount === 0}
								<span class="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-xs">FREE</span>
							{:else}
								<span class="font-semibold text-foreground">{currencyState.format(data.shippingAmount)}</span>
							{/if}
						</div>

						<div class="pt-3 border-t border-border/40 flex items-baseline justify-between text-base sm:text-lg">
							<span class="font-black text-foreground">Estimated Total</span>
							<span class="font-black text-xl sm:text-2xl text-foreground tracking-tight">
								{currencyState.format(data.total)}
							</span>
						</div>
					</div>

					<!-- Checkout CTA -->
					<div class="space-y-3 pt-2">
						<Button
							size="lg"
							href="/checkout{data.appliedCoupon ? `?coupon=${data.appliedCoupon.code}` : ''}"
							class="w-full h-12 text-sm font-bold shadow-lg shadow-primary/20 gap-2"
						>
							<Lock class="h-4 w-4" />
							<span>Proceed to Checkout</span>
							<ArrowRight class="h-4 w-4" />
						</Button>

						<div class="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
							<ShieldCheck class="h-3.5 w-3.5 text-primary" />
							<span>256-Bit SSL Encrypted Checkout</span>
						</div>
					</div>

				</div>
			</div>

		</div>
	{:else}
		<!-- Empty Cart State -->
		<div class="flex flex-col items-center justify-center p-16 text-center rounded-3xl border border-dashed border-border/80 bg-muted/10 space-y-5 max-w-xl mx-auto my-8">
			<div class="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
				<ShoppingBag class="h-8 w-8 stroke-[1.2]" />
			</div>
			
			<div class="space-y-1.5">
				<h2 class="text-xl font-bold text-foreground">Your cart is currently empty</h2>
				<p class="text-sm text-muted-foreground max-w-sm">
					{#if !data.user}
						Sign in to see items you may have saved, or start exploring our flagship hardware collection.
					{:else}
						Looks like you haven't added any products to your cart yet.
					{/if}
				</p>
			</div>

			<div class="flex items-center gap-3 pt-2">
				{#if !data.user}
					<Button variant="outline" href="/login" class="font-semibold">
						Sign In to Account
					</Button>
				{/if}
				<Button href="/products" class="font-bold shadow-md">
					<span>Browse Catalog</span>
					<ArrowRight class="h-4 w-4 ml-1" />
				</Button>
			</div>
		</div>
	{/if}

</div>
