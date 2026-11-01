<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Table from '@repo/ui/lib/components/ui/table/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { FileText, Plus, Edit, Trash2, Globe, ExternalLink } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let editingPage = $state<any>(null);
	let isCreating = $state(false);

	function startEdit(page: any) {
		editingPage = { ...page };
		isCreating = false;
	}

	function startNew() {
		editingPage = {
			id: '',
			slug: '',
			title: '',
			content: '',
			meta_title: '',
			meta_description: '',
			is_published: true
		};
		isCreating = true;
	}
</script>

<div class="mx-auto max-w-6xl space-y-6 py-6">
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Static Content Pages</h1>
			<p class="mt-1 text-xs text-muted-foreground">
				Manage official policy pages, FAQ, terms of service, and company about content.
			</p>
		</div>

		<Button onclick={startNew} class="gap-1.5 text-xs font-bold">
			<Plus class="h-4 w-4" />
			<span>New Static Page</span>
		</Button>
	</div>

	{#if form?.message}
		<div
			class="rounded-xl p-4 {form.success
				? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
				: 'border border-destructive/20 bg-destructive/10 text-destructive'} text-xs font-semibold"
		>
			{form.message}
		</div>
	{/if}

	<!-- Edit / Create Form -->
	{#if editingPage}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-sm font-bold">
					{isCreating ? 'Create New Static Page' : `Edit Page: ${editingPage.title}`}
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<form action="?/savePage" method="POST" use:enhance class="space-y-4">
					{#if editingPage.id}
						<input type="hidden" name="id" value={editingPage.id} />
					{/if}

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label for="page-slug" class="mb-1 block text-xs font-semibold text-muted-foreground"
								>URL Slug</label
							>
							<Input
								id="page-slug"
								name="slug"
								bind:value={editingPage.slug}
								placeholder="e.g. privacy-policy"
								required
							/>
						</div>

						<div>
							<label for="page-title" class="mb-1 block text-xs font-semibold text-muted-foreground"
								>Page Title</label
							>
							<Input
								id="page-title"
								name="title"
								bind:value={editingPage.title}
								placeholder="e.g. Privacy Policy"
								required
							/>
						</div>

						<div>
							<label for="meta_title" class="mb-1 block text-xs font-semibold text-muted-foreground"
								>SEO Meta Title (Optional)</label
							>
							<Input
								id="meta_title"
								name="meta_title"
								bind:value={editingPage.meta_title}
								placeholder="Custom browser tab title"
							/>
						</div>

						<div>
							<label
								for="meta_description"
								class="mb-1 block text-xs font-semibold text-muted-foreground"
								>SEO Meta Description</label
							>
							<Input
								id="meta_description"
								name="meta_description"
								bind:value={editingPage.meta_description}
								placeholder="Short summary for Google"
							/>
						</div>
					</div>

					<div>
						<label
							for="page-content"
							class="mb-1 block text-xs font-semibold text-muted-foreground"
						>
							Content (Markdown or Plain Text)
						</label>
						<textarea
							id="page-content"
							name="content"
							rows="10"
							bind:value={editingPage.content}
							placeholder="# Heading&#10;&#10;Write your official page documentation here..."
							class="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs focus:ring-2 focus:ring-ring focus:outline-none"
						></textarea>
					</div>

					<div class="flex items-center justify-between border-t border-border/40 pt-2">
						<div class="flex items-center gap-2">
							<input
								type="checkbox"
								id="is_published"
								name="is_published"
								bind:checked={editingPage.is_published}
								class="cursor-pointer rounded border-border"
							/>
							<label for="is_published" class="cursor-pointer text-xs font-medium text-foreground">
								Published (visible to storefront visitors)
							</label>
						</div>

						<div class="flex gap-2">
							<Button type="button" variant="ghost" size="sm" onclick={() => (editingPage = null)}>
								Cancel
							</Button>
							<Button type="submit" size="sm" class="font-bold">Save & Publish</Button>
						</div>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Pages List Table -->
	<Card.Root>
		<Card.Content class="p-0">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Title</Table.Head>
						<Table.Head>Path / Slug</Table.Head>
						<Table.Head class="text-center">Status</Table.Head>
						<Table.Head>Last Updated</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.pages as p}
						<Table.Row>
							<Table.Cell class="text-xs font-bold">
								<div class="flex items-center gap-2">
									<FileText class="h-4 w-4 text-muted-foreground" />
									<span>{p.title}</span>
								</div>
							</Table.Cell>
							<Table.Cell class="font-mono text-xs text-muted-foreground">
								/pages/{p.slug}
							</Table.Cell>
							<Table.Cell class="text-center">
								<Badge
									variant={p.is_published ? 'default' : 'outline'}
									class="text-[10px] font-bold uppercase"
								>
									{p.is_published ? 'Published' : 'Draft'}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-xs text-muted-foreground">
								{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="icon" onclick={() => startEdit(p)} class="h-8 w-8">
										<Edit class="h-4 w-4" />
									</Button>
									<form action="?/deletePage" method="POST" use:enhance class="inline">
										<input type="hidden" name="id" value={p.id} />
										<Button
											type="submit"
											variant="ghost"
											size="icon"
											class="h-8 w-8 text-destructive hover:bg-destructive/10"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</form>
								</div>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="py-8 text-center text-xs text-muted-foreground">
								No pages created yet.
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
