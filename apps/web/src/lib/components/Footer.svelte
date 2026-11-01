<script lang="ts">
	import {
		Zap,
		Truck,
		ShieldCheck,
		RotateCcw,
		Headphones,
		ArrowRight,
		Mail,
		CheckCircle2
	} from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Separator } from '@repo/ui/lib/components/ui/separator/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import { currencyState } from '#lib';

	let email = $state('');
	let subscribed = $state(false);

	function handleSubscribe(e: SubmitEvent) {
		e.preventDefault();
		if (email.trim()) {
			subscribed = true;
		}
	}
</script>

<footer class="mt-16 border-t border-border/40 bg-muted/20 lg:mt-24">
	<!-- Trust Badges / Value Props -->
	<div class="border-b border-border/40 bg-background/60">
		<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-8">
				<div class="flex items-start gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<Truck class="h-5 w-5" />
					</div>
					<div>
						<h4 class="text-sm font-semibold">Free Express Shipping</h4>
						<p class="mt-0.5 text-xs text-muted-foreground">On all orders over {currencyState.format(100)} worldwide</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<ShieldCheck class="h-5 w-5" />
					</div>
					<div>
						<h4 class="text-sm font-semibold">2-Year NeoWarranty</h4>
						<p class="mt-0.5 text-xs text-muted-foreground">Full coverage against defects</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<RotateCcw class="h-5 w-5" />
					</div>
					<div>
						<h4 class="text-sm font-semibold">30-Day Free Returns</h4>
						<p class="mt-0.5 text-xs text-muted-foreground">Hassle-free return policy</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
					>
						<Headphones class="h-5 w-5" />
					</div>
					<div>
						<h4 class="text-sm font-semibold">24/7 Expert Support</h4>
						<p class="mt-0.5 text-xs text-muted-foreground">Live technical assistance anytime</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Footer Columns -->
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
			<!-- Brand Info & Newsletter (Spans 2 cols on lg) -->
			<div class="space-y-4 lg:col-span-2">
				<a href="/" class="flex items-center gap-2">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
					>
						<Zap class="h-4 w-4 fill-current" />
					</div>
					<span class="text-xl font-black tracking-tight">NEXUS</span>
				</a>
				<p class="max-w-sm text-sm leading-relaxed text-muted-foreground">
					Next-generation electronics, high-fidelity audio, and productivity hardware engineered for
					modern creators, gamers, and tech enthusiasts.
				</p>

				<!-- Newsletter Box -->
				<!-- <div class="pt-2">
					<h4 class="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
						Join the Nexus Insiders
					</h4>
					{#if subscribed}
						<div class="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm font-medium">
							<CheckCircle2 class="h-4 w-4 shrink-0" />
							<span>Thank you for subscribing! Check your inbox soon.</span>
						</div>
					{:else}
						<form onsubmit={handleSubscribe} class="flex gap-2 max-w-sm">
							<div class="relative flex-1">
								<Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									type="email"
									placeholder="Enter your email"
									bind:value={email}
									required
									class="pl-9 h-10 text-sm bg-background"
								/>
							</div>
							<Button type="submit" class="h-10 px-4">
								<span>Join</span>
								<ArrowRight class="h-3.5 w-3.5 ml-1" />
							</Button>
						</form>
					{/if}
					<p class="text-[11px] text-muted-foreground mt-1.5">
						Get 10% off your first order plus secret drop notifications.
					</p>
				</div> -->
			</div>

			<!-- Col 1: Shop -->
			<div class="space-y-3">
				<h4 class="text-xs font-semibold tracking-wider text-foreground uppercase">
					Shop By Category
				</h4>
				<ul class="space-y-2 text-sm text-muted-foreground">
					<li>
						<a href="/category/audio" class="transition-colors hover:text-foreground"
							>Audio & Headphones</a
						>
					</li>
					<li>
						<a href="/category/wearables" class="transition-colors hover:text-foreground"
							>Wearables & Watches</a
						>
					</li>
					<li>
						<a href="/category/accessories" class="transition-colors hover:text-foreground"
							>Computer Accessories</a
						>
					</li>
					<li>
						<a href="/category/gaming" class="transition-colors hover:text-foreground"
							>Gaming Gear</a
						>
					</li>
					<li>
						<a href="/category/home-office" class="transition-colors hover:text-foreground"
							>Home Office Setups</a
						>
					</li>
					<li>
						<a href="/category/smart-home" class="transition-colors hover:text-foreground"
							>Smart Home & IoT</a
						>
					</li>
					<li>
						<a href="/products" class="font-medium text-primary hover:underline"
							>View All Products →</a
						>
					</li>
				</ul>
			</div>

			<!-- Col 2: Customer Support -->
			<div class="space-y-3">
				<h4 class="text-xs font-semibold tracking-wider text-foreground uppercase">
					Customer Support
				</h4>
				<ul class="space-y-2 text-sm text-muted-foreground">
					<li>
						<a href="/account/orders" class="transition-colors hover:text-foreground"
							>Track Your Order</a
						>
					</li>
					<li><a href="/cart" class="transition-colors hover:text-foreground">Shopping Cart</a></li>
					<li>
						<a href="/account/addresses" class="transition-colors hover:text-foreground"
							>Shipping Addresses</a
						>
					</li>
					<li>
						<a href="/products?deals=true" class="transition-colors hover:text-foreground"
							>Coupons & Deals</a
						>
					</li>
					<li>
						<a href="/account" class="transition-colors hover:text-foreground">Account Settings</a>
					</li>
				</ul>
			</div>

			<!-- Col 3: Company -->
			<div class="space-y-3">
				<h4 class="text-xs font-semibold tracking-wider text-foreground uppercase">Company</h4>
				<ul class="space-y-2 text-sm text-muted-foreground">
					<li>
						<a href="/pages/about" class="transition-colors hover:text-foreground">About Nexus</a>
					</li>
					<li>
						<a href="/pages/faq" class="transition-colors hover:text-foreground"
							>Frequently Asked Questions</a
						>
					</li>
					<li>
						<a href="/pages/contact" class="transition-colors hover:text-foreground"
							>Contact Support</a
						>
					</li>
					<li>
						<a href="/pages/terms" class="transition-colors hover:text-foreground"
							>Terms of Service</a
						>
					</li>
				</ul>
			</div>
		</div>

		<Separator class="my-8" />

		<!-- Bottom Bar -->
		<div
			class="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row"
		>
			<p>© {new Date().getFullYear()} Nexus Inc. All rights reserved. Designed for excellence.</p>

			<div class="flex items-center gap-3">
				{#if currencyState.initialized && currencyState.currencies.length > 0}
					<Select.Root
						type="single"
						value={currencyState.currentCurrency}
						onValueChange={(val: string) => {
							if (val) currencyState.setCurrency(val);
						}}
					>
						<Select.Trigger
							class="h-7 w-auto gap-1.5 rounded border-border/60 bg-muted px-2 py-1 font-mono text-[11px] hover:bg-accent focus:ring-1 focus:ring-ring"
						>
							<span class="truncate">
								{currencyState.currencies.find((c) => c.code === currencyState.currentCurrency)
									?.code ?? currencyState.currentCurrency} ({currencyState.currencies.find(
									(c) => c.code === currencyState.currentCurrency
								)?.symbol ?? currencyState.getActiveCurrency().symbol})
							</span>
						</Select.Trigger>
						<Select.Content align="end">
							{#each currencyState.currencies as curr}
								<Select.Item value={curr.code} label="{curr.code} ({curr.symbol})">
									{curr.code} ({curr.symbol})
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{:else}
					<span class="inline-block rounded bg-muted px-2 py-1 font-mono text-[11px]"
						>{currencyState.currentCurrency} ({currencyState.getActiveCurrency().symbol})</span
					>
				{/if}
			</div>
		</div>
	</div>
</footer>
