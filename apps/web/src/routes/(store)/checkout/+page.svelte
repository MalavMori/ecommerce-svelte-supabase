<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { 
		Lock, 
		MapPin, 
		CreditCard, 
		CircleAlert, 
		ShieldCheck, 
		Plus, 
		ArrowRight, 
		ShoppingBag, 
		LoaderCircle, 
		Truck, 
		Tag, 
		X, 
		Check, 
		ArrowLeft,
		Shield
	} from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Label } from '@repo/ui/lib/components/ui/label/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import * as Breadcrumb from '@repo/ui/lib/components/ui/breadcrumb/index.js';
	import { currencyState } from '#lib';
	import { loadStripe, type Stripe, type StripeElements, type StripePaymentElement } from '@stripe/stripe-js';
	import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$app/env/public';

	let { data } = $props();

	// ==========================================
	// CHECKOUT STEP STATE ('address' | 'payment')
	// ==========================================
	let currentStep = $state<'address' | 'payment'>('address');

	// Address state
	let defaultAddrId = $derived(
		data.addresses.find((a: any) => a.is_default)?.id || data.addresses[0]?.id || ''
	);
	let selectedAddressId = $state('');
	$effect(() => {
		if (!selectedAddressId && defaultAddrId) {
			selectedAddressId = defaultAddrId;
		}
	});

	let isAddingNewAddress = $state(false);
	$effect(() => {
		if (data.addresses.length === 0) {
			isAddingNewAddress = true;
		}
	});

	// New address fields
	let newLabel = $state('Home');
	let newLine1 = $state('');
	let newLine2 = $state('');
	let newCity = $state('');
	let newState = $state('');
	let newPostalCode = $state('');
	let newCountry = $state('United States');
	let addressError = $state('');

	// Coupon state
	let couponInput = $state('');
	let isApplyingCoupon = $state(false);
	let isRemovingCoupon = $state(false);

	// Stripe Elements state
	let stripeClient: Stripe | null = null;
	let stripeElements: StripeElements | null = null;
	let stripePaymentElement: StripePaymentElement | null = null;
	let isInitializingPayment = $state(false);
	let isStripeMounting = $state(false);
	let isSubmittingPayment = $state(false);
	let stripeError = $state('');
	let activeOrderId = $state('');
	let clientSecret = $state('');

	const selectedAddress = $derived(
		data.addresses.find((a: any) => a.id === selectedAddressId)
	);

	// ==========================================
	// TRANSITION TO PAYMENT STEP (INITIALIZE STRIPE)
	// ==========================================
	async function proceedToPayment() {
		addressError = '';
		stripeError = '';

		// Validate address
		if (isAddingNewAddress) {
			if (!newLine1.trim() || !newCity.trim() || !newPostalCode.trim()) {
				addressError = 'Please fill out all required address fields (Street, City, Postal Code).';
				const el = document.getElementById('addr-street');
				el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				return;
			}
		} else if (!selectedAddressId) {
			addressError = 'Please select or enter a shipping address to proceed.';
			return;
		}

		isInitializingPayment = true;

		try {
			// Call API to create pending order and obtain Stripe PaymentIntent client secret
			const res = await fetch('/api/checkout/create-payment-intent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					addressId: selectedAddressId,
					isNewAddress: isAddingNewAddress,
					newAddress: isAddingNewAddress ? {
						line1: newLine1,
						line2: newLine2,
						city: newCity,
						state: newState,
						postalCode: newPostalCode,
						country: newCountry,
						label: newLabel
					} : null,
					couponCode: data.appliedCoupon?.code || couponInput || null
				})
			});

			const result = await res.json();
			if (!res.ok || result.error) {
				addressError = result.error || 'Failed to initialize payment gateway';
				isInitializingPayment = false;
				return;
			}

			activeOrderId = result.orderId;
			clientSecret = result.clientSecret;
			currentStep = 'payment';
			isStripeMounting = true;

			// Mount Stripe Elements
			if (!stripeClient) {
				const publishableKey = PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';
				stripeClient = await loadStripe(publishableKey);
			}

			if (stripeClient && clientSecret) {
				const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
				stripeElements = stripeClient.elements({
					clientSecret,
					appearance: {
						theme: isDark ? 'night' : 'stripe',
						variables: {
							colorPrimary: '#6366f1',
							borderRadius: '12px',
							fontFamily: 'Inter, system-ui, sans-serif'
						}
					}
				});

				// Flush Svelte's pending DOM updates so #stripe-payment-element is in the DOM
				await tick();

				const el = document.getElementById('stripe-payment-element');
				if (el && stripeElements) {
					// Destroy any previously mounted Stripe Element before mounting a new one
					if (stripePaymentElement) {
						stripePaymentElement.destroy();
						stripePaymentElement = null;
					}
					const element = stripeElements.create('payment', {
						layout: 'tabs'
					});
					stripePaymentElement = element;
					element.mount('#stripe-payment-element');
					element.on('ready', () => {
						isStripeMounting = false;
					});
					element.on('change', (event: any) => {
						if (event?.complete) {
							stripeError = '';
						}
					});
				} else {
					isStripeMounting = false;
				}
			} else {
				isStripeMounting = false;
			}
		} catch (err: any) {
			addressError = err?.message || 'Network error while initializing payment. Please try again.';
		} finally {
			isInitializingPayment = false;
		}
	}

	// ==========================================
	// EXECUTE STRIPE PAYMENT CONFIRMATION
	// ==========================================
	async function handleStripePay() {
		if (!stripeClient || !stripeElements) {
			stripeError = 'Payment gateway is still loading. Please wait a moment.';
			return;
		}

		stripeError = '';
		isSubmittingPayment = true;

		try {
			const origin = typeof window !== 'undefined' ? window.location.origin : '';
			const result = await stripeClient.confirmPayment({
				elements: stripeElements,
				confirmParams: {
					return_url: `${origin}/checkout/success?order=${activeOrderId}&method=stripe`
				}
			});

			if (result.error) {
				// Display error returned directly from Stripe (e.g. card declined, invalid CVV, etc.)
				stripeError = result.error.message || 'Payment confirmation failed. Please check your details and try again.';
				isSubmittingPayment = false;
			}
		} catch (err: any) {
			stripeError = err?.message || 'An unexpected error occurred during payment processing.';
			isSubmittingPayment = false;
		}
	}

	function returnToAddressStep() {
		currentStep = 'address';
		stripeError = '';
	}
</script>

<svelte:head>
	<title>Checkout — Nexus</title>
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
				<Breadcrumb.Link href="/cart">Cart</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>Checkout</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!-- Header with Security Indicator -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
		<div class="space-y-1">
			<h1 class="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
				<span>Secure Checkout</span>
			</h1>
			<p class="text-sm text-muted-foreground">
				Complete your order with encrypted, PCI-DSS compliant checkout.
			</p>
		</div>

		<div class="flex items-center gap-3 self-start sm:self-auto bg-muted/60 border border-border/80 px-4 py-2 rounded-2xl text-xs font-semibold text-muted-foreground">
			<Lock class="h-4 w-4 text-emerald-500" />
			<span>256-Bit SSL Encrypted</span>
			<span class="text-border">|</span>
			<span class="text-foreground font-bold">Stripe Verified</span>
		</div>
	</div>

	<!-- Main 2-Column Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
		
		<!-- Left Column: Checkout Steps (7 cols) -->
		<div class="lg:col-span-7 space-y-6">

			<!-- Global Errors -->
			{#if addressError}
				<div class="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold flex items-center gap-3 animate-in fade-in-50">
					<CircleAlert class="h-5 w-5 shrink-0" />
					<span>{addressError}</span>
				</div>
			{/if}

			<!-- ==============================================
			     STEP 1: SHIPPING ADDRESS
			     ============================================== -->
			<div class="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-6 transition-all">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
							1
						</div>
						<div>
							<h2 class="text-lg font-bold text-foreground">Shipping Address</h2>
							<p class="text-xs text-muted-foreground">Where should we deliver your order?</p>
						</div>
					</div>

					{#if currentStep === 'payment'}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onclick={returnToAddressStep}
							class="text-xs font-bold text-primary gap-1.5 cursor-pointer"
						>
							<ArrowLeft class="h-3.5 w-3.5" />
							<span>Change</span>
						</Button>
					{/if}
				</div>

				{#if currentStep === 'payment' && selectedAddress}
					<!-- Read-only Address Card when on Payment Step -->
					<div class="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-start justify-between gap-4 text-xs">
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								<MapPin class="h-4 w-4 text-primary shrink-0" />
								<span class="font-bold text-foreground">{selectedAddress.label || 'Delivery Address'}</span>
							</div>
							<p class="text-muted-foreground pl-6">
								{selectedAddress.line1}{#if selectedAddress.line2}, {selectedAddress.line2}{/if}
							</p>
							<p class="text-muted-foreground pl-6">
								{selectedAddress.city}{#if selectedAddress.state}, {selectedAddress.state}{/if} {selectedAddress.postal_code}, {selectedAddress.country}
							</p>
						</div>
						<Badge variant="outline" class="text-[10px] uppercase font-bold shrink-0">Selected</Badge>
					</div>
				{:else}
					<!-- Editable Address Form -->
					{#if data.addresses && data.addresses.length > 0}
						<div class="space-y-3">
							<Label class="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
								Select Saved Address
							</Label>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{#each data.addresses as addr}
									<label
										class="relative flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all {selectedAddressId === addr.id && !isAddingNewAddress ? 'border-primary bg-primary/5 shadow-xs' : 'border-border/70 hover:border-border hover:bg-muted/30'}"
									>
										<div class="space-y-1.5">
											<div class="flex items-center justify-between">
												<span class="font-bold text-xs text-foreground flex items-center gap-1.5">
													<MapPin class="h-3.5 w-3.5 {selectedAddressId === addr.id && !isAddingNewAddress ? 'text-primary' : 'text-muted-foreground'}" />
													{addr.label || 'Saved Address'}
												</span>
												{#if addr.is_default}
													<Badge class="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-primary/10 text-primary border-primary/20">Default</Badge>
												{/if}
											</div>
											<p class="text-xs text-muted-foreground line-clamp-2">
												{addr.line1}{#if addr.line2}, {addr.line2}{/if}, {addr.city}, {addr.postal_code}
											</p>
										</div>

										<div class="pt-3 mt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
											<span class="text-muted-foreground">{addr.country}</span>
											<input
												type="radio"
												name="addressSelection"
												value={addr.id}
												checked={selectedAddressId === addr.id && !isAddingNewAddress}
												onchange={() => {
													selectedAddressId = addr.id;
													isAddingNewAddress = false;
													addressError = '';
												}}
												class="h-4 w-4 text-primary focus:ring-primary"
											/>
										</div>
									</label>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Toggle / Add New Address -->
					<div class="pt-2">
						{#if data.addresses && data.addresses.length > 0}
							<button
								type="button"
								onclick={() => (isAddingNewAddress = !isAddingNewAddress)}
								class="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline cursor-pointer py-1"
							>
								{#if isAddingNewAddress}
									<X class="h-4 w-4" />
									<span>Use an existing saved address</span>
								{:else}
									<Plus class="h-4 w-4" />
									<span>Deliver to a new address</span>
								{/if}
							</button>
						{/if}

						{#if isAddingNewAddress}
							<div class="mt-4 p-5 rounded-2xl bg-muted/30 border border-border/70 space-y-4 animate-in fade-in-50">
								<h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Address Details</h3>
								
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div class="space-y-1.5 sm:col-span-2">
										<Label for="addr-label" class="text-xs">Address Label</Label>
										<Input id="addr-label" bind:value={newLabel} placeholder="e.g. Home, Office, Studio" class="h-10 text-xs" />
									</div>

									<div class="space-y-1.5 sm:col-span-2">
										<Label for="addr-street" class="text-xs">Street Address *</Label>
										<Input id="addr-street" bind:value={newLine1} placeholder="123 Cyberpunk Blvd" required class="h-10 text-xs" />
									</div>

									<div class="space-y-1.5 sm:col-span-2">
										<Label for="addr-suite" class="text-xs">Apartment, Suite, Unit (Optional)</Label>
										<Input id="addr-suite" bind:value={newLine2} placeholder="Apt 4B" class="h-10 text-xs" />
									</div>

									<div class="space-y-1.5">
										<Label for="addr-city" class="text-xs">City *</Label>
										<Input id="addr-city" bind:value={newCity} placeholder="San Francisco" required class="h-10 text-xs" />
									</div>

									<div class="space-y-1.5">
										<Label for="addr-state" class="text-xs">State / Province</Label>
										<Input id="addr-state" bind:value={newState} placeholder="CA" class="h-10 text-xs" />
									</div>

									<div class="space-y-1.5">
										<Label for="addr-postal" class="text-xs">Postal Code *</Label>
										<Input id="addr-postal" bind:value={newPostalCode} placeholder="94107" required class="h-10 text-xs" />
									</div>

									<div class="space-y-1.5">
										<Label for="addr-country" class="text-xs">Country *</Label>
										<Input id="addr-country" bind:value={newCountry} placeholder="United States" required class="h-10 text-xs" />
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Proceed Button -->
					<div class="pt-4 border-t border-border/40 flex justify-end">
						<Button
							type="button"
							onclick={proceedToPayment}
							disabled={isInitializingPayment}
							class="h-12 px-6 font-bold text-sm gap-2 shadow-lg shadow-primary/20 cursor-pointer"
						>
							{#if isInitializingPayment}
								<LoaderCircle class="h-4 w-4 animate-spin" />
								<span>Initializing Stripe Gateway...</span>
							{:else}
								<span>Continue to Payment</span>
								<ArrowRight class="h-4 w-4" />
							{/if}
						</Button>
					</div>
				{/if}
			</div>

			<!-- ==============================================
			     STEP 2: STRIPE SECURE PAYMENT (INLINE ELEMENT)
			     ============================================== -->
			<div class="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-6 transition-all {currentStep !== 'payment' ? 'opacity-60 pointer-events-none' : ''}">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
							2
						</div>
						<div>
							<h2 class="text-lg font-bold text-foreground">Payment Details</h2>
							<p class="text-xs text-muted-foreground">Powered by Stripe — Cards, Apple Pay, Google Pay</p>
						</div>
					</div>

					<div class="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
						<ShieldCheck class="h-3.5 w-3.5" />
						<span>Stripe PCI Certified</span>
					</div>
				</div>

				{#if currentStep === 'payment'}
					<!-- Stripe Payment Element Mount Point -->
					<div class="space-y-5 animate-in fade-in-50 duration-300">
						
						<!-- Security Trust Banner -->
						<div class="p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-between text-xs text-muted-foreground">
							<div class="flex items-center gap-2">
								<CreditCard class="h-4 w-4 text-primary shrink-0" />
								<span class="font-medium text-foreground">Select payment method below:</span>
							</div>
							<span class="text-[11px] font-mono">End-to-End Encrypted</span>
						</div>

						<!-- Stripe Container -->
						<div class="relative min-h-[220px] rounded-2xl border border-border/80 p-4 bg-background shadow-xs">
							{#if isStripeMounting}
								<div class="flex flex-col items-center justify-center py-16 space-y-3 text-muted-foreground">
									<LoaderCircle class="h-7 w-7 animate-spin text-primary" />
									<span class="text-xs font-semibold">Loading Stripe Payment Element...</span>
								</div>
							{/if}
							
							<div id="stripe-payment-element" class="w-full"></div>
						</div>

						<!-- Stripe Inline Errors -->
						{#if stripeError}
							<div class="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-3 animate-in shake duration-200">
								<CircleAlert class="h-5 w-5 shrink-0" />
								<span>{stripeError}</span>
							</div>
						{/if}

						<!-- Action Buttons -->
						<div class="pt-4 border-t border-border/40 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
							<Button
								type="button"
								variant="outline"
								onclick={returnToAddressStep}
								class="w-full sm:w-auto text-xs font-bold gap-2 cursor-pointer"
							>
								<ArrowLeft class="h-4 w-4" />
								<span>Back to Shipping</span>
							</Button>

							<Button
								type="button"
								onclick={handleStripePay}
								disabled={isStripeMounting || isSubmittingPayment}
								class="w-full sm:w-auto h-12 px-8 text-sm font-bold shadow-xl shadow-primary/25 gap-2 cursor-pointer"
							>
								{#if isSubmittingPayment}
									<LoaderCircle class="h-4 w-4 animate-spin" />
									<span>Authorizing Payment...</span>
								{:else}
									<Lock class="h-4 w-4" />
									<span>Authorize & Pay {currencyState.format(data.total)}</span>
								{/if}
							</Button>
						</div>

					</div>
				{:else}
					<div class="p-6 rounded-2xl bg-muted/20 border border-border/40 text-center space-y-2 text-muted-foreground">
						<p class="text-xs font-medium">Please confirm your shipping address above to unlock payment options.</p>
					</div>
				{/if}
			</div>

			<!-- Trust and Security Badges -->
			<div class="grid grid-cols-3 gap-3 text-center pt-2">
				<div class="p-3 rounded-2xl bg-card border border-border/60 space-y-1">
					<Shield class="h-4 w-4 text-primary mx-auto" />
					<p class="text-[11px] font-bold text-foreground">Buyer Protection</p>
					<p class="text-[10px] text-muted-foreground">Full refund if not delivered</p>
				</div>
				<div class="p-3 rounded-2xl bg-card border border-border/60 space-y-1">
					<Lock class="h-4 w-4 text-emerald-500 mx-auto" />
					<p class="text-[11px] font-bold text-foreground">PCI-DSS Level 1</p>
					<p class="text-[10px] text-muted-foreground">Bank-grade card safety</p>
				</div>
				<div class="p-3 rounded-2xl bg-card border border-border/60 space-y-1">
					<Truck class="h-4 w-4 text-amber-500 mx-auto" />
					<p class="text-[11px] font-bold text-foreground">Fast Dispatch</p>
					<p class="text-[10px] text-muted-foreground">Tracking on every order</p>
				</div>
			</div>

		</div>

		<!-- Right Column: Order Summary (5 cols) -->
		<div class="lg:col-span-5 space-y-6 sticky top-24">
			<div class="rounded-3xl border border-border/60 bg-card p-6 shadow-xs space-y-6">
				<h3 class="text-lg font-black tracking-tight text-foreground pb-3 border-b border-border/40">
					Order Summary ({data.items.length})
				</h3>

				<!-- Items Preview List -->
				<div class="space-y-3 max-h-72 overflow-y-auto pr-1">
					{#each data.items as item}
						<div class="flex items-center justify-between gap-3 text-xs">
							<div class="flex items-center gap-3">
								<div class="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-border/60 bg-muted/40">
									{#if item.imageUrl}
										<img src={item.imageUrl} alt={item.name} class="h-full w-full object-cover" />
									{:else}
										<div class="h-full w-full flex items-center justify-center text-muted-foreground">
											<ShoppingBag class="h-4 w-4" />
										</div>
									{/if}
									<span class="absolute top-0 right-0 h-4 min-w-4 px-1 rounded-bl bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
										{item.quantity}
									</span>
								</div>
								<div class="space-y-0.5">
									<p class="font-bold text-foreground line-clamp-1">{item.name}</p>
									{#if item.variantLabel}
										<p class="text-[11px] text-muted-foreground">{item.variantLabel}</p>
									{/if}
									<p class="text-muted-foreground">{currencyState.format(item.price)} × {item.quantity}</p>
								</div>
							</div>
							<span class="font-bold text-foreground text-right">{currencyState.format(item.lineTotal)}</span>
						</div>
					{/each}
				</div>

				<!-- Coupon Box -->
				<div class="space-y-2 pt-4 border-t border-border/40">
					<label for="coupon-code-input" class="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
						Promo / Coupon Code
					</label>

					{#if data.appliedCoupon}
						<div class="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
							<div class="flex items-center gap-2">
								<Tag class="h-4 w-4 shrink-0" />
								<span>Code <strong>{data.appliedCoupon.code}</strong> applied</span>
							</div>
							<form
								method="POST"
								action="?/removeCoupon"
								use:enhance={() => {
									isRemovingCoupon = true;
									return async ({ update }) => {
										await update();
										isRemovingCoupon = false;
									};
								}}
							>
								<Button
									type="submit"
									variant="ghost"
									size="sm"
									disabled={isRemovingCoupon}
									class="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 cursor-pointer"
								>
									{#if isRemovingCoupon}
										<LoaderCircle class="h-3 w-3 animate-spin" />
									{:else}
										Remove
									{/if}
								</Button>
							</form>
						</div>
					{:else}
						<form
							method="POST"
							action="?/applyCoupon"
							use:enhance={() => {
								isApplyingCoupon = true;
								return async ({ update }) => {
									await update();
									isApplyingCoupon = false;
								};
							}}
							class="flex gap-2"
						>
							<Input
								id="coupon-code-input"
								name="code"
								bind:value={couponInput}
								placeholder="Enter discount code"
								class="h-10 text-xs uppercase font-mono tracking-wider"
							/>
							<Button
								type="submit"
								variant="secondary"
								disabled={isApplyingCoupon || !couponInput.trim()}
								class="h-10 text-xs font-bold shrink-0 cursor-pointer"
							>
								{#if isApplyingCoupon}
									<LoaderCircle class="h-3 w-3 animate-spin" />
								{:else}
									Apply
								{/if}
							</Button>
						</form>
					{/if}

					{#if data.couponError}
						<p class="text-[11px] text-destructive font-medium flex items-center gap-1 pt-1">
							<CircleAlert class="h-3.5 w-3.5 shrink-0" />
							<span>{data.couponError}</span>
						</p>
					{/if}
				</div>

				<!-- Calculations Breakdown -->
				<div class="space-y-2.5 pt-4 border-t border-border/40 text-xs">
					<div class="flex justify-between text-muted-foreground">
						<span>Subtotal</span>
						<span class="font-mono text-foreground font-semibold">{currencyState.format(data.subtotal)}</span>
					</div>

					{#if data.discountAmount > 0}
						<div class="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
							<span class="flex items-center gap-1">
								<Tag class="h-3 w-3" />
								Coupon Discount
							</span>
							<span class="font-mono">-{currencyState.format(data.discountAmount)}</span>
						</div>
					{/if}

					<div class="flex justify-between text-muted-foreground">
						<span class="flex items-center gap-1">
							<Truck class="h-3.5 w-3.5" />
							Shipping
						</span>
						{#if data.shippingAmount === 0}
							<span class="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[11px]">FREE</span>
						{:else}
							<span class="font-mono text-foreground font-semibold">{currencyState.format(data.shippingAmount)}</span>
						{/if}
					</div>

					<div class="pt-3 border-t border-border/60 flex items-baseline justify-between text-base">
						<span class="font-black text-foreground">Total</span>
						<span class="font-black font-mono text-xl text-primary">{currencyState.format(data.total)}</span>
					</div>

					<p class="text-[10px] text-muted-foreground text-center pt-2">
						Tax included where applicable. Charges settled securely via Stripe.
					</p>
				</div>
			</div>
		</div>

	</div>
</div>
