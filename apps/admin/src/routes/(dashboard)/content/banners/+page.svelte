<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Table from '@repo/ui/lib/components/ui/table/index.js';
	import * as Dialog from '@repo/ui/lib/components/ui/dialog/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Image, Plus, Trash2, Pencil, Calendar } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import ImagePicker from '#lib/components/ImagePicker.svelte';

	let { data, form } = $props();

	let showAddModal = $state(false);

	// Edit modal state
	let showEditModal = $state(false);
	let editingBanner = $state<any | null>(null);

	function openEdit(b: any) {
		editingBanner = b;
		showEditModal = true;
	}

	function isBannerActiveNow(b: any) {
		if (!b.is_active) return false;
		const now = new Date();
		if (b.starts_at && now < new Date(b.starts_at)) return false;
		if (b.ends_at && now > new Date(b.ends_at)) return false;
		return true;
	}
</script>

<div class="mx-auto max-w-6xl space-y-6 py-6">
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Homepage Hero Banners</h1>
			<p class="mt-1 text-xs text-muted-foreground">
				Manage promotional banners and scheduled campaign windows for the storefront hero carousel.
			</p>
		</div>

		<Button onclick={() => (showAddModal = !showAddModal)} class="gap-1.5 text-xs font-bold">
			<Plus class="h-4 w-4" />
			<span>{showAddModal ? 'Cancel' : 'New Banner'}</span>
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

	<!-- Create Banner Form -->
	{#if showAddModal}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-sm font-bold">Add Homepage Banner</Card.Title>
			</Card.Header>
			<Card.Content>
				<form action="?/createBanner" method="POST" use:enhance class="space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label for="title" class="mb-1 block text-xs font-semibold text-muted-foreground"
								>Headline Title</label
							>
							<Input
								id="title"
								name="title"
								placeholder="e.g. Next-Gen Tactical Audio 2026"
								required
							/>
						</div>

						<div>
							<label for="subtitle" class="mb-1 block text-xs font-semibold text-muted-foreground"
								>Subtitle</label
							>
							<Input id="subtitle" name="subtitle" placeholder="Short description" />
						</div>

						<div class="sm:col-span-2">
							<ImagePicker
								name="image_url"
								folder="banners"
								label="Hero Banner Image"
								description="Upload or pick a banner image for the storefront carousel (recommended 1920x800 or 16:9)"
								required
							/>
						</div>

						<div>
							<label for="link_url" class="mb-1 block text-xs font-semibold text-muted-foreground"
								>Target Link URL</label
							>
							<Input id="link_url" name="link_url" placeholder="/products/aura-headphones" />
						</div>

						<div>
							<label for="position" class="mb-1 block text-xs font-semibold text-muted-foreground"
								>Sort Position</label
							>
							<Input id="position" name="position" type="number" value="0" />
						</div>

						<div class="flex items-center gap-2 pt-6">
							<input
								type="checkbox"
								id="is_active"
								name="is_active"
								checked
								class="rounded border-border"
							/>
							<label for="is_active" class="cursor-pointer text-xs font-medium text-foreground"
								>Active (Published)</label
							>
						</div>

						<!-- Scheduling -->
						<div>
							<label for="starts_at" class="mb-1 block text-xs font-semibold text-muted-foreground"
								>Schedule Start Time (Optional)</label
							>
							<Input id="starts_at" name="starts_at" type="datetime-local" class="text-xs" />
						</div>

						<div>
							<label for="ends_at" class="mb-1 block text-xs font-semibold text-muted-foreground"
								>Schedule End Time (Optional)</label
							>
							<Input id="ends_at" name="ends_at" type="datetime-local" class="text-xs" />
						</div>
					</div>

					<div class="flex justify-end gap-2 pt-2">
						<Button type="button" variant="ghost" size="sm" onclick={() => (showAddModal = false)}
							>Cancel</Button
						>
						<Button type="submit" size="sm" class="font-bold">Publish Banner</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Banners Table -->
	<Card.Root>
		<Card.Content class="p-0">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-16">Preview</Table.Head>
						<Table.Head>Title & Subtitle</Table.Head>
						<Table.Head>Schedule Window</Table.Head>
						<Table.Head class="text-center">Position</Table.Head>
						<Table.Head class="text-center">Status</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.banners as banner}
						{@const isLive = isBannerActiveNow(banner)}
						<Table.Row>
							<Table.Cell>
								<div class="h-10 w-16 overflow-hidden rounded-md border border-border bg-muted">
									<img
										src={banner.image_url}
										alt={banner.title}
										class="h-full w-full object-cover"
									/>
								</div>
							</Table.Cell>
							<Table.Cell>
								<p class="text-xs font-bold text-foreground">{banner.title}</p>
								{#if banner.subtitle}
									<p class="max-w-xs truncate text-[11px] text-muted-foreground">
										{banner.subtitle}
									</p>
								{/if}
								{#if banner.link_url}
									<p class="mt-0.5 font-mono text-[10px] text-muted-foreground">
										{banner.link_url}
									</p>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-xs text-muted-foreground">
								{#if banner.starts_at || banner.ends_at}
									<div class="flex items-center gap-1.5 font-mono text-[11px]">
										<Calendar class="h-3 w-3 text-muted-foreground" />
										<span>
											{banner.starts_at ? new Date(banner.starts_at).toLocaleDateString() : 'Now'}
											→
											{banner.ends_at ? new Date(banner.ends_at).toLocaleDateString() : 'Forever'}
										</span>
									</div>
								{:else}
									<span class="text-[11px] text-muted-foreground italic">Always active</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-center font-mono text-xs">
								{banner.position}
							</Table.Cell>
							<Table.Cell class="text-center">
								<form action="?/toggleActive" method="POST" use:enhance class="inline">
									<input type="hidden" name="id" value={banner.id} />
									<input
										type="hidden"
										name="is_active"
										value={banner.is_active ? 'true' : 'false'}
									/>
									<button type="submit" class="cursor-pointer">
										{#if isLive}
											<Badge
												class="border-emerald-500/30 bg-emerald-500/15 text-[10px] font-bold text-emerald-600 uppercase"
											>
												Live
											</Badge>
										{:else if banner.is_active}
											<Badge
												variant="outline"
												class="border-amber-500/30 text-[10px] font-bold text-amber-600 uppercase"
											>
												Scheduled
											</Badge>
										{:else}
											<Badge
												variant="outline"
												class="text-[10px] font-bold text-muted-foreground uppercase"
											>
												Draft
											</Badge>
										{/if}
									</button>
								</form>
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onclick={() => openEdit(banner)}
										class="h-8 w-8 text-muted-foreground hover:text-foreground"
									>
										<Pencil class="h-4 w-4" />
									</Button>
									<form action="?/deleteBanner" method="POST" use:enhance class="inline">
										<input type="hidden" name="id" value={banner.id} />
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
							<Table.Cell colspan={6} class="py-8 text-center text-xs text-muted-foreground">
								No banners configured yet. Click "New Banner" to create one.
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>

<!-- Edit Banner Dialog -->
<Dialog.Root bind:open={showEditModal}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Edit Banner</Dialog.Title>
			<Dialog.Description>Modify banner details, media, and campaign scheduling.</Dialog.Description
			>
		</Dialog.Header>

		{#if editingBanner}
			<form
				action="?/updateBanner"
				method="POST"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update({ reset: false });
						if (result.type === 'success') showEditModal = false;
					};
				}}
				class="space-y-4 pt-2"
			>
				<input type="hidden" name="id" value={editingBanner.id} />

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="sm:col-span-2">
						<label for="edit_title" class="mb-1 block text-xs font-semibold text-muted-foreground"
							>Headline Title</label
						>
						<Input id="edit_title" name="title" value={editingBanner.title} required />
					</div>

					<div class="sm:col-span-2">
						<label
							for="edit_subtitle"
							class="mb-1 block text-xs font-semibold text-muted-foreground">Subtitle</label
						>
						<Input id="edit_subtitle" name="subtitle" value={editingBanner.subtitle || ''} />
					</div>

					<div class="sm:col-span-2">
						<ImagePicker
							name="image_url"
							value={editingBanner.image_url}
							folder="banners"
							label="Hero Banner Image"
							description="Replace or change the banner image"
							required
						/>
					</div>

					<div>
						<label
							for="edit_link_url"
							class="mb-1 block text-xs font-semibold text-muted-foreground">Target Link</label
						>
						<Input id="edit_link_url" name="link_url" value={editingBanner.link_url || ''} />
					</div>

					<div>
						<label
							for="edit_position"
							class="mb-1 block text-xs font-semibold text-muted-foreground">Position</label
						>
						<Input
							id="edit_position"
							name="position"
							type="number"
							value={editingBanner.position}
						/>
					</div>

					<div>
						<label
							for="edit_starts_at"
							class="mb-1 block text-xs font-semibold text-muted-foreground">Starts At</label
						>
						<Input
							id="edit_starts_at"
							name="starts_at"
							type="datetime-local"
							value={editingBanner.starts_at
								? new Date(editingBanner.starts_at).toISOString().slice(0, 16)
								: ''}
							class="text-xs"
						/>
					</div>

					<div>
						<label for="edit_ends_at" class="mb-1 block text-xs font-semibold text-muted-foreground"
							>Ends At</label
						>
						<Input
							id="edit_ends_at"
							name="ends_at"
							type="datetime-local"
							value={editingBanner.ends_at
								? new Date(editingBanner.ends_at).toISOString().slice(0, 16)
								: ''}
							class="text-xs"
						/>
					</div>

					<div class="flex items-center gap-2 sm:col-span-2">
						<input
							type="checkbox"
							id="edit_is_active"
							name="is_active"
							checked={editingBanner.is_active}
							class="rounded border-border"
						/>
						<label for="edit_is_active" class="cursor-pointer text-xs font-medium text-foreground"
							>Active (Published)</label
						>
					</div>
				</div>

				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (showEditModal = false)}
						>Cancel</Button
					>
					<Button type="submit" class="font-bold">Save Changes</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
