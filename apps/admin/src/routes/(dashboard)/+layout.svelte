<script lang="ts">
	import * as Sidebar from '@repo/ui/lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '@repo/ui/lib/components/ui/dropdown-menu/index.js';
	import { enhance } from '$app/forms';
	import { Coins } from 'lucide-svelte';
	import AppSidebar from '#lib/components/AppSidebar.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { logout } from '../(auth)/login/auth.remote';

	let { data, children } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header class="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
			<Sidebar.Trigger class="-ml-1" />
			<div class="flex w-full items-center justify-between px-4">
				<h1 class="text-sm font-medium tracking-tight">E-commerce Admin</h1>
				<div class="flex items-center gap-3">
					<a
						href="/currencies"
						class="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
						title="Store Base Currency (Click to configure)"
					>
						<Coins class="h-3.5 w-3.5 text-primary" />
						<span class="hidden text-muted-foreground sm:inline">Base:</span>
						<span class="font-mono font-bold text-primary">{data.baseCurrency?.code ?? 'INR'}</span>
						<span class="font-mono text-xs text-muted-foreground">({data.baseCurrency?.symbol ?? '₹'})</span>
					</a>

					<ThemeToggle />

					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex h-8 w-8 items-center justify-center rounded-full bg-muted uppercase transition-colors hover:bg-muted/80 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
						>
							{data.user?.email?.[0] ?? 'A'}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							<DropdownMenu.Label class="font-normal">
								<div class="flex flex-col space-y-1">
									<p class="text-sm leading-none font-medium">Admin</p>
									<p class="text-xs leading-none text-muted-foreground">{data.user?.email}</p>
								</div>
							</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<form {...logout}>
								<button type="submit" class="w-full">
									<DropdownMenu.Item
										class="w-full cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
									>
										Log out
									</DropdownMenu.Item>
								</button>
							</form>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>
		</header>
		<main class="flex-1 overflow-auto bg-muted/20 p-6">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
