<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Test DB — Categories (Admin)</title>
</svelte:head>

<main
	style="font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem;"
>
	<h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">
		🛠️ Admin — Categories (from Supabase)
	</h1>
	<p style="color: #6b7280; margin-bottom: 1.5rem;">
		Showing up to 5 rows from the <code>categories</code> table via local Supabase instance.
	</p>

	{#if data.categories.length === 0}
		<p style="color: #ef4444; font-weight: 600;">
			⚠️ No categories found. Run a migration/seed first.
		</p>
	{:else}
		<ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.75rem;">
			{#each data.categories as category}
				<li
					style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem 1rem; background: #f9fafb;"
				>
					<div style="font-weight: 600; color: #111827;">{category.name}</div>
					<div style="font-size: 0.875rem; color: #6b7280;">
						slug: <code>{category.slug}</code> &nbsp;|&nbsp; id:
						<code style="font-size: 0.75rem;">{category.id}</code>
					</div>
					{#if category.parent_id}
						<div style="font-size: 0.75rem; color: #9ca3af;">parent_id: {category.parent_id}</div>
					{/if}
				</li>
			{/each}
		</ul>
		<p style="margin-top: 1rem; color: #16a34a; font-weight: 600;">
			✅ {data.categories.length} categor{data.categories.length === 1 ? 'y' : 'ies'} loaded successfully.
		</p>
	{/if}
</main>
