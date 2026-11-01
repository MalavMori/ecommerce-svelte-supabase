<script lang="ts">
	import * as Sidebar from '@repo/ui/lib/components/ui/sidebar/index.js';
	import { useSidebar } from '@repo/ui/lib/components/ui/sidebar/index.js';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { cn } from '@repo/ui/lib/utils.js';
	import {
		LayoutDashboard,
		Package,
		Tags,
		ShoppingCart,
		RotateCcw,
		Users,
		Star,
		Ticket,
		Image,
		Sparkles,
		FileText,
		Coins,
		FolderOpen,
		Store,
		X
	} from 'lucide-svelte';

	const sidebar = useSidebar();

	// Automatically dismiss mobile sheet upon navigation
	afterNavigate(() => {
		if (sidebar?.isMobile) {
			sidebar.setOpenMobile(false);
		}
	});

	function handleLinkClick() {
		if (sidebar?.isMobile) {
			sidebar.setOpenMobile(false);
		}
	}

	const storeItems = [
		{ title: 'Dashboard', url: '/', icon: LayoutDashboard },
		{ title: 'Products', url: '/products', icon: Package },
		{ title: 'Categories', url: '/categories', icon: Tags },
		{ title: 'Orders', url: '/orders', icon: ShoppingCart },
		{ title: 'Returns', url: '/returns', icon: RotateCcw },
		{ title: 'Coupons', url: '/coupons', icon: Ticket },
		{ title: 'Users', url: '/users', icon: Users },
		{ title: 'Reviews', url: '/reviews', icon: Star }
	];

	const contentItems = [
		{ title: 'Hero Banners', url: '/content/banners', icon: Image },
		{ title: 'Curated Content', url: '/content/featured', icon: Sparkles },
		{ title: 'Media Library', url: '/content/media', icon: FolderOpen },
		{ title: 'Static Pages', url: '/pages', icon: FileText }
	];

	const settingsItems = [{ title: 'Currencies & Rates', url: '/currencies', icon: Coins }];
</script>

<Sidebar.Root>
	<Sidebar.Header class="border-b border-sidebar-border/70 bg-sidebar px-4 py-3">
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-3 min-w-0">
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm ring-1 ring-primary/20"
				>
					<Store class="h-4.5 w-4.5" />
				</div>
				<div class="flex flex-col min-w-0 leading-tight">
					<div class="flex items-center gap-2">
						<span class="truncate font-semibold tracking-tight text-foreground text-sm">Nexus</span>
						<span
							class="rounded bg-accent/15 px-1.5 py-0.2 text-[10px] font-semibold text-accent"
						>
							Admin
						</span>
					</div>
					<span class="truncate text-[11px] font-medium text-muted-foreground">Store Operations</span>
				</div>
			</div>

			<!-- Mobile explicit close button -->
			<button
				type="button"
				class="inline-flex md:hidden h-8 w-8 shrink-0 items-center justify-center rounded-md border border-sidebar-border/60 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground active:scale-95 transition-all"
				onclick={() => sidebar?.setOpenMobile(false)}
				aria-label="Close menu"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	</Sidebar.Header>

	<Sidebar.Content class="gap-2 px-3 py-3 overflow-y-auto">
		<!-- Store Management -->
		<Sidebar.Group class="py-1">
			<Sidebar.GroupLabel
				class="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1"
			>
				Store Management
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu class="space-y-1">
					{#each storeItems as item}
						{@const isActive =
							page.url.pathname === item.url ||
							(item.url !== '/' && page.url.pathname.startsWith(item.url))}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								{isActive}
								class={cn(
									'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
									isActive
										? 'bg-primary/10 text-primary font-semibold shadow-xs dark:bg-primary/20'
										: 'text-foreground/80 hover:bg-sidebar-accent hover:text-foreground active:bg-sidebar-accent/80'
								)}
							>
								{#snippet child({ props })}
									<a href={item.url} onclick={handleLinkClick} {...props}>
										<item.icon
											class={cn(
												'h-4 w-4 shrink-0 transition-colors',
												isActive
													? 'text-primary'
													: 'text-muted-foreground group-hover:text-foreground'
											)}
										/>
										<span class="truncate flex-1">{item.title}</span>
										{#if isActive}
											<span class="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse"></span>
										{/if}
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<div class="my-1 border-t border-sidebar-border/40 mx-2"></div>

		<!-- Content & Merchandising -->
		<Sidebar.Group class="py-1">
			<Sidebar.GroupLabel
				class="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1"
			>
				Content & Merchandising
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu class="space-y-1">
					{#each contentItems as item}
						{@const isActive =
							page.url.pathname === item.url || page.url.pathname.startsWith(item.url)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								{isActive}
								class={cn(
									'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
									isActive
										? 'bg-primary/10 text-primary font-semibold shadow-xs dark:bg-primary/20'
										: 'text-foreground/80 hover:bg-sidebar-accent hover:text-foreground active:bg-sidebar-accent/80'
								)}
							>
								{#snippet child({ props })}
									<a href={item.url} onclick={handleLinkClick} {...props}>
										<item.icon
											class={cn(
												'h-4 w-4 shrink-0 transition-colors',
												isActive
													? 'text-primary'
													: 'text-muted-foreground group-hover:text-foreground'
											)}
										/>
										<span class="truncate flex-1">{item.title}</span>
										{#if isActive}
											<span class="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse"></span>
										{/if}
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<div class="my-1 border-t border-sidebar-border/40 mx-2"></div>

		<!-- Settings & System -->
		<Sidebar.Group class="py-1">
			<Sidebar.GroupLabel
				class="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1"
			>
				Settings & System
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu class="space-y-1">
					{#each settingsItems as item}
						{@const isActive =
							page.url.pathname === item.url || page.url.pathname.startsWith(item.url)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								{isActive}
								class={cn(
									'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
									isActive
										? 'bg-primary/10 text-primary font-semibold shadow-xs dark:bg-primary/20'
										: 'text-foreground/80 hover:bg-sidebar-accent hover:text-foreground active:bg-sidebar-accent/80'
								)}
							>
								{#snippet child({ props })}
									<a href={item.url} onclick={handleLinkClick} {...props}>
										<item.icon
											class={cn(
												'h-4 w-4 shrink-0 transition-colors',
												isActive
													? 'text-primary'
													: 'text-muted-foreground group-hover:text-foreground'
											)}
										/>
										<span class="truncate flex-1">{item.title}</span>
										{#if isActive}
											<span class="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse"></span>
										{/if}
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer class="border-t border-sidebar-border/70 bg-sidebar/50 px-4 py-3">
		<div class="flex items-center justify-between text-xs">
			<div class="flex items-center gap-2">
				<span class="relative flex h-2 w-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
				</span>
				<span class="font-medium text-foreground/80 text-[12px]">Store Live</span>
			</div>
			<span
				class="rounded border border-sidebar-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
			>
				v2.0
			</span>
		</div>
	</Sidebar.Footer>
</Sidebar.Root>
