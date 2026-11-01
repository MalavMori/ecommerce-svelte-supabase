<script lang="ts">
	import {
		ShoppingBag,
		Search,
		Menu,
		User,
		Package,
		MapPin,
		Star,
		LogOut,
		ChevronDown,
		Zap,
		Tag,
		Sparkles,
		Heart,
		Coins
	} from 'lucide-svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import * as DropdownMenu from '@repo/ui/lib/components/ui/dropdown-menu/index.js';
	import * as Sheet from '@repo/ui/lib/components/ui/sheet/index.js';
	import * as Avatar from '@repo/ui/lib/components/ui/avatar/index.js';
	import ThemeToggle from './ThemeToggle.svelte';
	import CategoryIcon from './CategoryIcon.svelte';
	import { logout } from '../../routes/(auth)/login/auth.remote';
	import { cartState, wishlistState, currencyState } from '#lib';
	import type { Category } from '@repo/types';

	interface Props {
		user?: any;
		profile?: any;
		cartCount?: number;
		categories?: Category[];
	}

	let { user = null, profile = null, cartCount = 0, categories = [] }: Props = $props();

	$effect(() => {
		if (cartCount !== undefined) {
			cartState.setCount(cartCount);
		}
		if (user) {
			wishlistState.init();
		}
	});

	const currentCartCount = $derived(cartState.count);
	const currentWishlistCount = $derived(wishlistState.productIds.length);
	let searchQuery = $state('');
	let mobileOpen = $state(false);

	function handleSearch(e: SubmitEvent) {
		e.preventDefault();
		if (searchQuery.trim()) {
			mobileOpen = false;
			goto(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
		}
	}

	const userInitials = $derived(
		profile?.full_name
			? profile.full_name
					.split(' ')
					.map((n: string) => n[0])
					.join('')
					.slice(0, 2)
					.toUpperCase()
			: (user?.email?.[0] ?? 'U').toUpperCase()
	);
</script>

<!-- Top Announcement Ticker -->
<!-- <aside aria-label="Announcement" class="relative z-50 bg-gradient-to-r from-primary via-primary/95 to-primary text-primary-foreground text-xs font-medium py-1.5 px-4 text-center tracking-wide">
	<div class="max-w-7xl mx-auto flex items-center justify-center gap-2">
		<span class="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[11px] font-semibold">
			<Sparkles class="h-3 w-3" /> Offer
		</span>
		<span>Free shipping on all orders over $100 • Use code <strong class="font-bold underline underline-offset-2">WELCOME10</strong> for 10% off</span>
	</div>
</aside> -->

<!-- Main Navigation Header -->
<header
	class="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-md transition-all supports-[backdrop-filter]:bg-background/70"
>
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
		<!-- Left: Brand Logo & Links -->
		<div class="flex min-w-0 items-center gap-4 sm:gap-6 lg:gap-8">
			<a
				href="/"
				class="group flex shrink-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform group-hover:scale-105"
				>
					<Zap class="h-5 w-5 fill-current" />
				</div>
				<div class="flex flex-col">
					<span
						class="bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-lg sm:text-xl leading-none font-black tracking-tight"
					>
						NEXUS
					</span>
					<span
						class="mt-0.5 text-[10px] leading-none font-semibold tracking-widest text-muted-foreground uppercase hidden sm:block"
					>
						Electronics & Gear
					</span>
				</div>
			</a>

			<!-- Desktop Nav Links -->
			<nav class="hidden items-center gap-1 md:flex lg:gap-2">
				<Button
					variant="ghost"
					size="sm"
					href="/products"
					class="text-sm font-medium hover:text-primary"
				>
					All Products
				</Button>

				<!-- Categories Dropdown -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					>
						<span>Categories</span>
						<ChevronDown
							class="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200"
						/>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="start" class="w-64 border-border/60 p-2 shadow-xl">
						<DropdownMenu.Label
							class="px-2 py-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
						>
							Shop By Department
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						{#each categories as cat}
							<DropdownMenu.Item>
								{#snippet child({ props })}
									<a
										href="/category/{cat.slug}"
										{...props}
										class="group flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent"
									>
										<div
											class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary"
										>
											<CategoryIcon slug={cat.slug} class="h-4 w-4" />
										</div>
										<div class="flex flex-1 flex-col">
											<span class="text-sm font-medium transition-colors group-hover:text-primary"
												>{cat.name}</span
											>
										</div>
									</a>
								{/snippet}
							</DropdownMenu.Item>
						{/each}
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a
									href="/products"
									{...props}
									class="flex items-center justify-between px-2 py-2 text-xs font-semibold text-primary hover:underline"
								>
									<span>Browse All Categories</span>
									<Tag class="h-3.5 w-3.5" />
								</a>
							{/snippet}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<Button
					variant="ghost"
					size="sm"
					href="/products?deals=true"
					class="text-sm font-medium text-primary hover:bg-primary/10 hover:text-primary"
				>
					Special Deals
				</Button>
			</nav>
		</div>

		<!-- Center: Search bar (desktop) -->
		<div class="mx-4 hidden max-w-md flex-1 lg:flex">
			<form onsubmit={handleSearch} class="relative w-full">
				<Search
					class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="search"
					placeholder="Search headphones, smartwatches, gear..."
					bind:value={searchQuery}
					class="h-9.5 w-full rounded-full border-border/60 bg-muted/40 pr-4 pl-9 text-sm transition-colors hover:bg-muted/70 focus:bg-background"
				/>
			</form>
		</div>

		<!-- Right: Actions (Currency, Theme, Cart, Auth) -->
		<div class="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
			<!-- Currency Selector (Desktop) -->
			{#if currencyState.currencies && currencyState.currencies.length > 1}
				<div class="hidden md:block">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer">
							<Coins class="h-3.5 w-3.5 text-primary" />
							<span>{currencyState.getActiveCurrency().symbol}</span>
							<span>{currencyState.currentCurrency}</span>
							<ChevronDown class="h-3 w-3 opacity-60" />
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="min-w-[160px]">
							<DropdownMenu.Label class="text-xs font-bold text-muted-foreground">Display Currency</DropdownMenu.Label>
							{#each currencyState.currencies as curr}
								<DropdownMenu.Item
									onclick={() => currencyState.setCurrency(curr.code)}
									class="flex items-center justify-between text-xs font-medium cursor-pointer {currencyState.currentCurrency === curr.code ? 'bg-accent font-bold text-primary' : ''}"
								>
									<span>{curr.name}</span>
									<span class="font-mono text-muted-foreground">{curr.code} ({curr.symbol})</span>
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			{/if}

			<div class="hidden sm:block">
				<ThemeToggle />
			</div>

			<!-- Wishlist Button -->
			<Button
				variant="ghost"
				size="icon"
				href="/account/wishlist"
				class="relative h-9 w-9 rounded-full hover:bg-accent"
				aria-label="Wishlist"
			>
				<Heart class="h-5 w-5" />
				{#if currentWishlistCount > 0}
					<span
						class="absolute -top-1 -right-1 flex h-5 min-w-5 animate-in items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-sm duration-200 zoom-in-50"
					>
						{currentWishlistCount > 99 ? '99+' : currentWishlistCount}
					</span>
				{/if}
				<span class="sr-only">Wishlist ({currentWishlistCount} items)</span>
			</Button>

			<!-- Cart Button -->
			<Button
				variant="ghost"
				size="icon"
				href="/cart"
				class="relative h-9 w-9 rounded-full hover:bg-accent"
			>
				<ShoppingBag class="h-5 w-5" />
				{#if currentCartCount > 0}
					<span
						class="absolute -top-1 -right-1 flex h-5 min-w-5 animate-in items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground shadow-sm duration-200 zoom-in-50"
					>
						{currentCartCount > 99 ? '99+' : currentCartCount}
					</span>
				{/if}
				<span class="sr-only">Shopping Cart ({currentCartCount} items)</span>
			</Button>

			<!-- User Profile / Auth (Desktop) -->
			{#if user}
				<div class="hidden md:block">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex items-center gap-2 rounded-full transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<Avatar.Root class="h-9 w-9 border border-border/80 ring-1 ring-primary/20">
								{#if profile?.avatar_url}
									<Avatar.Image src={profile.avatar_url} alt={profile.full_name || 'User'} />
								{/if}
								<Avatar.Fallback class="bg-primary/10 font-mono text-xs font-bold text-primary">
									{userInitials}
								</Avatar.Fallback>
							</Avatar.Root>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-60 border-border/60 p-1.5 shadow-xl">
							<DropdownMenu.Label class="px-2 py-2 font-normal">
								<div class="flex flex-col space-y-1">
									<p class="text-sm leading-none font-semibold">
										{profile?.full_name || 'My Account'}
									</p>
									<p class="truncate text-xs leading-none text-muted-foreground">{user.email}</p>
								</div>
							</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								{#snippet child({ props })}
									<a href="/account" {...props} class="flex cursor-pointer items-center gap-2 px-2 py-2">
										<User class="h-4 w-4 text-muted-foreground" />
										<span>Profile & Settings</span>
									</a>
								{/snippet}
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								{#snippet child({ props })}
									<a href="/account/orders" {...props} class="flex cursor-pointer items-center gap-2 px-2 py-2">
										<Package class="h-4 w-4 text-muted-foreground" />
										<span>Order History</span>
									</a>
								{/snippet}
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								{#snippet child({ props })}
									<a href="/account/wishlist" {...props} class="flex cursor-pointer items-center gap-2 px-2 py-2">
										<Heart class="h-4 w-4 text-muted-foreground" />
										<span>My Wishlist</span>
									</a>
								{/snippet}
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								{#snippet child({ props })}
									<a href="/account/addresses" {...props} class="flex cursor-pointer items-center gap-2 px-2 py-2">
										<MapPin class="h-4 w-4 text-muted-foreground" />
										<span>Saved Addresses</span>
									</a>
								{/snippet}
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								{#snippet child({ props })}
									<a href="/account/reviews" {...props} class="flex cursor-pointer items-center gap-2 px-2 py-2">
										<Star class="h-4 w-4 text-muted-foreground" />
										<span>My Reviews</span>
									</a>
								{/snippet}
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<form {...logout.for('navbar-desktop')}>
								<button type="submit" class="w-full text-left">
									<DropdownMenu.Item
										class="flex cursor-pointer items-center gap-2 px-2 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
									>
										<LogOut class="h-4 w-4" />
										<span>Sign Out</span>
									</DropdownMenu.Item>
								</button>
							</form>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			{:else}
				<div class="hidden items-center gap-2 sm:flex">
					<Button variant="ghost" size="sm" href="/login" class="text-sm font-medium">
						Sign In
					</Button>
					<Button size="sm" href="/signup" class="text-sm font-semibold shadow-sm">Sign Up</Button>
				</div>
			{/if}

			<!-- Mobile Menu Trigger -->
			<Sheet.Root bind:open={mobileOpen}>
				<Sheet.Trigger
					class="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent md:hidden"
				>
					<Menu class="h-6 w-6" />
					<span class="sr-only">Open menu</span>
				</Sheet.Trigger>
				<Sheet.Content side="left" class="flex w-[85vw] max-w-sm flex-col p-5 sm:p-6">
					<Sheet.Header class="border-b pb-4 pr-8 text-left">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
								>
									<Zap class="h-4 w-4 fill-current" />
								</div>
								<span class="text-lg font-black tracking-tight">NEXUS</span>
							</div>
							<div class="flex items-center gap-1">
								<ThemeToggle />
							</div>
						</div>
					</Sheet.Header>

					<!-- Mobile Search -->
					<div class="py-4">
						<form onsubmit={handleSearch} class="relative w-full">
							<Search
								class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								type="search"
								placeholder="Search products..."
								bind:value={searchQuery}
								class="h-9.5 w-full rounded-full bg-muted/50 pr-4 pl-9 text-sm"
							/>
						</form>
					</div>

					<!-- Mobile Nav Links -->
					<div class="flex-1 space-y-4 overflow-y-auto py-2">
						<div class="space-y-1">
							<p
								class="px-3 py-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
							>
								Navigation
							</p>
							<a
								href="/products"
								onclick={() => (mobileOpen = false)}
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
							>
								<Package class="h-4 w-4 text-muted-foreground" />
								<span>All Products</span>
							</a>
							<a
								href="/products?deals=true"
								onclick={() => (mobileOpen = false)}
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
							>
								<Sparkles class="h-4 w-4" />
								<span>Special Deals</span>
							</a>
							<a
								href="/account/wishlist"
								onclick={() => (mobileOpen = false)}
								class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
							>
								<div class="flex items-center gap-3">
									<Heart class="h-4 w-4 text-muted-foreground" />
									<span>Wishlist</span>
								</div>
								{#if currentWishlistCount > 0}
									<Badge class="h-5 px-2 text-[11px] font-bold bg-rose-500">{currentWishlistCount}</Badge>
								{/if}
							</a>
							<a
								href="/cart"
								onclick={() => (mobileOpen = false)}
								class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
							>
								<div class="flex items-center gap-3">
									<ShoppingBag class="h-4 w-4 text-muted-foreground" />
									<span>Cart</span>
								</div>
								{#if currentCartCount > 0}
									<Badge class="h-5 px-2 text-[11px] font-bold">{currentCartCount}</Badge>
								{/if}
							</a>
						</div>

						<!-- Mobile Currency Selector -->
						{#if currencyState.currencies && currencyState.currencies.length > 1}
							<div class="px-3 pt-2 pb-1">
								<p class="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1.5">Currency</p>
								<div class="grid grid-cols-3 gap-1.5">
									{#each currencyState.currencies as curr}
										<button
											type="button"
											onclick={() => currencyState.setCurrency(curr.code)}
											class="flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer {currencyState.currentCurrency === curr.code ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 text-muted-foreground hover:bg-muted'}"
										>
											<span class="text-sm">{curr.symbol}</span>
											<span class="text-[10px] font-mono">{curr.code}</span>
										</button>
									{/each}
								</div>
							</div>
						{/if}

						<div class="space-y-1">
							<p
								class="px-3 py-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
							>
								Categories
							</p>
							{#each categories as cat}
								<a
									href="/category/{cat.slug}"
									onclick={() => (mobileOpen = false)}
									class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
								>
									<CategoryIcon slug={cat.slug} class="h-4 w-4 text-muted-foreground" />
									<span>{cat.name}</span>
								</a>
							{/each}
						</div>
					</div>

					<!-- Mobile Footer Actions -->
					<div class="space-y-3 border-t pt-4">
						{#if user}
							<div class="flex items-center gap-3 rounded-xl bg-muted/50 p-2.5">
								<Avatar.Root class="h-10 w-10 border border-border/80 ring-1 ring-primary/20 shrink-0">
									{#if profile?.avatar_url}
										<Avatar.Image src={profile.avatar_url} alt={profile.full_name || 'User'} />
									{/if}
									<Avatar.Fallback class="bg-primary/10 font-mono text-xs font-bold text-primary">
										{userInitials}
									</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex flex-col min-w-0 flex-1">
									<p class="text-sm font-semibold truncate leading-tight">
										{profile?.full_name || 'My Account'}
									</p>
									<p class="text-xs text-muted-foreground truncate">{user.email}</p>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-1.5 text-xs font-medium">
								<a
									href="/account"
									onclick={() => (mobileOpen = false)}
									class="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-accent transition-colors"
								>
									<User class="h-3.5 w-3.5 text-muted-foreground" />
									<span>Profile</span>
								</a>
								<a
									href="/account/orders"
									onclick={() => (mobileOpen = false)}
									class="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-accent transition-colors"
								>
									<Package class="h-3.5 w-3.5 text-muted-foreground" />
									<span>Orders</span>
								</a>
								<a
									href="/account/addresses"
									onclick={() => (mobileOpen = false)}
									class="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-accent transition-colors"
								>
									<MapPin class="h-3.5 w-3.5 text-muted-foreground" />
									<span>Addresses</span>
								</a>
								<a
									href="/account/reviews"
									onclick={() => (mobileOpen = false)}
									class="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-accent transition-colors"
								>
									<Star class="h-3.5 w-3.5 text-muted-foreground" />
									<span>Reviews</span>
								</a>
							</div>
							<form {...logout.for('navbar-mobile')}>
								<button
									type="submit"
									class="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
								>
									<LogOut class="h-4 w-4" />
									<span>Sign Out</span>
								</button>
							</form>
						{:else}
							<div class="grid grid-cols-2 gap-2">
								<Button variant="outline" href="/login" onclick={() => (mobileOpen = false)}>
									Sign In
								</Button>
								<Button href="/signup" onclick={() => (mobileOpen = false)}>Sign Up</Button>
							</div>
						{/if}
					</div>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	</div>
</header>
