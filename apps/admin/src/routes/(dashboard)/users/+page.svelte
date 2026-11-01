<script lang="ts">
	import * as Table from '@repo/ui/lib/components/ui/table/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Search, ChevronLeft, ChevronRight, ShieldCheck, ShoppingBag } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props();

	// Derived pagination values
	let totalPages = $derived(Math.max(1, Math.ceil(data.total / data.perPage)));
	let currentPage = $derived(data.page);
	let hasPrev = $derived(currentPage > 1);
	let hasNext = $derived(currentPage < totalPages);

	// Search state — debounced navigate
	let searchValue = $state(data.search);
	let searchTimer: ReturnType<typeof setTimeout>;

	function onSearchInput(e: Event) {
		searchValue = (e.currentTarget as HTMLInputElement).value;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			const params = new URLSearchParams(page.url.search);
			params.set('page', '1');
			if (searchValue) params.set('q', searchValue);
			else params.delete('q');
			goto(`?${params}`, { reset: false });
		}, 400);
	}

	function goToPage(p: number) {
		if (p < 1 || p > totalPages || p === currentPage) return;
		const params = new URLSearchParams(page.url.search);
		params.set('page', String(p));
		goto(`?${params}`, { reset: false });
	}

	function onPerPageChange(val: string) {
		const params = new URLSearchParams(page.url.search);
		params.set('perPage', val);
		params.set('page', '1');
		goto(`?${params}`, { reset: false });
	}

	function onRoleFilter(val: string) {
		const params = new URLSearchParams(page.url.search);
		params.set('page', '1');
		if (val === 'all') params.delete('role');
		else params.set('role', val);
		goto(`?${params}`, { reset: false });
	}

	// Build page number array for the paginator (max 5 visible)
	let pageNumbers = $derived.by(() => {
		const delta = 1;
		const pages: (number | '...')[] = [];
		const left = Math.max(1, currentPage - delta);
		const right = Math.min(totalPages, currentPage + delta);
		if (left > 1) {
			pages.push(1);
			if (left > 2) pages.push('...');
		}
		for (let i = left; i <= right; i++) pages.push(i);
		if (right < totalPages) {
			if (right < totalPages - 1) pages.push('...');
			pages.push(totalPages);
		}
		return pages;
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Users & Roles</h2>
			<p class="mt-0.5 text-xs text-muted-foreground">
				Manage customer profiles and assign administrator roles.
			</p>
		</div>
		<!-- Filter by role -->
		<div class="flex items-center gap-2">
			<span class="text-xs font-semibold text-muted-foreground">Filter:</span>
			<div class="flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
				<button
					type="button"
					onclick={() => onRoleFilter('all')}
					class="rounded-md px-2.5 py-1 transition-colors {data.roleFilter === 'all'
						? 'bg-background font-bold text-foreground shadow-xs'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					All Users
				</button>
				<button
					type="button"
					onclick={() => onRoleFilter('admin')}
					class="rounded-md px-2.5 py-1 transition-colors {data.roleFilter === 'admin'
						? 'bg-background font-bold text-purple-600 shadow-xs dark:text-purple-400'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					Admins
				</button>
				<button
					type="button"
					onclick={() => onRoleFilter('customer')}
					class="rounded-md px-2.5 py-1 transition-colors {data.roleFilter === 'customer'
						? 'bg-background font-bold text-foreground shadow-xs'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					Customers
				</button>
			</div>
		</div>
	</div>

	<div class="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
		<!-- Search bar -->
		<div class="flex items-center gap-3 border-b border-border/60 px-4 py-3">
			<Search class="h-4 w-4 shrink-0 text-muted-foreground" />
			<Input
				class="h-8 flex-1 border-0 text-xs shadow-none focus-visible:ring-0"
				placeholder="Search users by name or phone…"
				value={searchValue}
				oninput={onSearchInput}
			/>
			{#if data.total > 0}
				<span class="shrink-0 text-xs text-muted-foreground">
					{data.total} user{data.total === 1 ? '' : 's'}
				</span>
			{/if}
		</div>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>User</Table.Head>
					<Table.Head>Phone</Table.Head>
					<Table.Head>Role</Table.Head>
					<Table.Head class="text-center">Orders</Table.Head>
					<Table.Head class="text-right">Registered</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.users as user (user.id)}
					{@const isAdmin = user.role === 'admin'}
					<Table.Row class="align-middle">
						<Table.Cell>
							<div class="flex items-center gap-3">
								<div
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {isAdmin
										? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
										: 'bg-muted text-muted-foreground'} text-xs font-bold uppercase"
								>
									{user.full_name ? user.full_name.slice(0, 2) : 'U'}
								</div>
								<div>
									<p class="text-xs font-semibold text-foreground">
										{user.full_name || 'Anonymous User'}
									</p>
									<p class="font-mono text-[10px] text-muted-foreground">{user.id.slice(0, 8)}…</p>
								</div>
							</div>
						</Table.Cell>
						<Table.Cell class="text-xs text-muted-foreground">{user.phone || '—'}</Table.Cell>
						<Table.Cell>
							{#if isAdmin}
								<Badge
									class="inline-flex items-center gap-1 border-purple-500/30 bg-purple-500/15 text-[10px] font-bold tracking-wider text-purple-700 uppercase dark:text-purple-300"
								>
									<ShieldCheck class="h-3 w-3" /> Admin
								</Badge>
							{:else}
								<Badge
									variant="outline"
									class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
								>
									Customer
								</Badge>
							{/if}
						</Table.Cell>
						<Table.Cell class="text-center">
							<span class="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
								<ShoppingBag class="h-3 w-3" />
								<span>{user.ordersCount}</span>
							</span>
						</Table.Cell>
						<Table.Cell class="text-right font-mono text-xs text-muted-foreground">
							{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={5} class="h-24 text-center text-xs text-muted-foreground">
							{data.search ? `No users matching "${data.search}".` : 'No users found.'}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>

		<!-- Pagination bar -->
		<div
			class="flex flex-col items-center justify-between gap-4 border-t border-border/60 px-4 py-3 text-xs sm:flex-row"
		>
			<div class="flex flex-wrap items-center gap-4 text-muted-foreground">
				<span>
					{#if data.total > 0}
						Showing {(currentPage - 1) * data.perPage + 1}–{Math.min(
							currentPage * data.perPage,
							data.total
						)} of {data.total}
					{:else}
						0 users
					{/if}
				</span>

				<div class="flex items-center gap-2">
					<span>Rows per page:</span>
					<Select.Root
						type="single"
						value={String(data.perPage)}
						onValueChange={(val: string) => {
							if (val) onPerPageChange(val);
						}}
					>
						<Select.Trigger class="h-7 w-[68px] text-xs">
							{data.perPage}
						</Select.Trigger>
						<Select.Content side="top">
							<Select.Item value="10" label="10" />
							<Select.Item value="20" label="20" />
							<Select.Item value="50" label="50" />
							<Select.Item value="100" label="100" />
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			{#if totalPages > 1}
				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						class="h-7 w-7"
						disabled={!hasPrev}
						onclick={() => goToPage(currentPage - 1)}
						aria-label="Previous page"
					>
						<ChevronLeft class="h-3.5 w-3.5" />
					</Button>

					{#each pageNumbers as p}
						{#if p === '...'}
							<span class="px-2 text-muted-foreground select-none">…</span>
						{:else}
							<Button
								variant={p === currentPage ? 'default' : 'outline'}
								size="icon"
								class="h-7 w-7 text-xs font-semibold"
								onclick={() => goToPage(Number(p))}
							>
								{p}
							</Button>
						{/if}
					{/each}

					<Button
						variant="outline"
						size="icon"
						class="h-7 w-7"
						disabled={!hasNext}
						onclick={() => goToPage(currentPage + 1)}
						aria-label="Next page"
					>
						<ChevronRight class="h-3.5 w-3.5" />
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>
