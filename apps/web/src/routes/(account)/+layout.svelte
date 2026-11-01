<script lang="ts">
	import { page } from '$app/state';
	import { 
		User, 
		Package, 
		MapPin, 
		Star, 
		LogOut, 
		ChevronRight,
		ShieldCheck,
		Heart
	} from 'lucide-svelte';
	import Navbar from '#lib/components/Navbar.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import * as Avatar from '@repo/ui/lib/components/ui/avatar/index.js';
	import { logout } from '../(auth)/login/auth.remote';

	let { data, children } = $props();

	const navItems = [
		{ href: '/account', label: 'Profile & Settings', icon: User },
		{ href: '/account/orders', label: 'Order History', icon: Package },
		{ href: '/account/wishlist', label: 'My Wishlist', icon: Heart },
		{ href: '/account/addresses', label: 'Saved Addresses', icon: MapPin },
		{ href: '/account/reviews', label: 'My Reviews', icon: Star },
	];


	const userInitials = $derived(
		data.profile?.full_name
			? data.profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
			: (data.user?.email?.[0] ?? 'U').toUpperCase()
	);
</script>

<div class="min-h-screen flex flex-col bg-background text-foreground">
	<Navbar 
		user={data.user} 
		profile={data.profile} 
		cartCount={data.cartCount} 
		categories={data.categories} 
	/>

	<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
		
		<!-- Account Page Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
			
			<!-- Left: Account Sidebar (Spans 3 cols on lg) -->
			<aside class="lg:col-span-3 space-y-6">
				<!-- User Info Card -->
				<div class="rounded-3xl border border-border/60 bg-card p-6 shadow-xs flex flex-col items-center text-center space-y-3">
					<Avatar.Root class="h-16 w-16 border-2 border-primary/30 ring-4 ring-primary/5">
						{#if data.profile?.avatar_url}
							<Avatar.Image src={data.profile.avatar_url} alt={data.profile.full_name || 'User'} />
						{/if}
						<Avatar.Fallback class="bg-primary/10 text-primary text-lg font-bold font-mono">
							{userInitials}
						</Avatar.Fallback>
					</Avatar.Root>

					<div class="space-y-0.5">
						<h2 class="font-bold text-base text-foreground">
							{data.profile?.full_name || 'Account Owner'}
						</h2>
						<p class="text-xs text-muted-foreground truncate max-w-44">
							{data.user.email}
						</p>
					</div>

					<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
						<ShieldCheck class="h-3 w-3" />
						<span>Verified Member</span>
					</div>
				</div>

				<!-- Navigation Menu -->
				<nav class="rounded-3xl border border-border/60 bg-card p-2 shadow-xs space-y-1">
					{#each navItems as item}
						{@const active = page.url.pathname === item.href}
						<a
							href={item.href}
							class="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-colors {active ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}"
						>
							<div class="flex items-center gap-3">
								<item.icon class="h-4 w-4" />
								<span>{item.label}</span>
							</div>
							<ChevronRight class="h-3.5 w-3.5 opacity-60" />
						</a>
					{/each}

					<div class="pt-2 border-t border-border/40 mt-1">
						<form {...logout.for('account-sidebar')}>
							<button
								type="submit"
								class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
							>
								<LogOut class="h-4 w-4" />
								<span>Sign Out</span>
							</button>
						</form>
					</div>
				</nav>
			</aside>

			<!-- Right: Main Account View (Spans 9 cols on lg) -->
			<div class="lg:col-span-9">
				{@render children()}
			</div>

		</div>

	</main>

	<Footer />
</div>
