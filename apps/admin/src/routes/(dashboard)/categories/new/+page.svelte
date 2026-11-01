<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Label } from '@repo/ui/lib/components/ui/label/index.js';
	import { LoaderCircle, ChevronLeft, Sparkles, RefreshCw } from 'lucide-svelte';
	import { slugify } from '@repo/utils';
	import { createCategory } from '../categories.remote';

	let { data } = $props();

	let name = $state('');
	let slug = $state('');
	let isCustomSlug = $state(false);
	let parent_id = $state('');

	function handleNameInput(e: Event) {
		name = (e.target as HTMLInputElement).value;
		if (!isCustomSlug) {
			slug = slugify(name);
		}
	}

	function handleSlugInput(e: Event) {
		slug = (e.target as HTMLInputElement).value;
		isCustomSlug = true;
	}

	function regenerateSlug() {
		slug = slugify(name);
		isCustomSlug = false;
	}

	let selectedParentLabel = $derived(
		data.categories.find((c) => c.id === parent_id)?.name ?? 'None (Top Level)'
	);

	function fp(field: Record<string, unknown>) {
		const { value: _v, checked: _c, ...rest } = field;
		return rest;
	}
</script>

<div class="mx-auto max-w-2xl space-y-6 py-6">
	<div class="flex items-center gap-4">
		<Button href="/categories" variant="outline" size="icon">
			<ChevronLeft class="h-4 w-4" />
		</Button>
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Create Category</h2>
			<p class="text-muted-foreground">Add a new product category.</p>
		</div>
	</div>

	<Card.Root>
		<Card.Content class="pt-6">
			<form {...createCategory}>
				<div class="grid gap-6">
					<div class="grid gap-2">
						<Label for="name">Name</Label>
						<Input
							id="name"
							placeholder="e.g. Electronics"
							required
							{...fp(createCategory.fields.name.as('text'))}
							bind:value={name}
							oninput={handleNameInput}
						/>
						{#if createCategory.fields.name.issues()?.length}
							<div class="text-xs text-destructive">
								{createCategory.fields.name.issues()?.[0]?.message}
							</div>
						{/if}
					</div>

					<div class="grid gap-2">
						<div class="flex items-center justify-between">
							<Label for="slug">Slug</Label>
							<button
								type="button"
								class="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
								onclick={regenerateSlug}
								title="Auto-generate slug from name"
							>
								<Sparkles class="h-3 w-3 text-amber-500" />
								<span>Auto-generate</span>
								{#if !isCustomSlug}
									<span class="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Live</span>
								{:else}
									<span class="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Custom</span>
								{/if}
							</button>
						</div>
						<div class="relative flex items-center">
							<Input
								id="slug"
								placeholder="e.g. electronics"
								required
								class="pr-10 font-mono text-sm"
								{...fp(createCategory.fields.slug.as('text'))}
								bind:value={slug}
								oninput={handleSlugInput}
							/>
							<button
								type="button"
								class="absolute right-2.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer p-0.5"
								title="Generate slug from name"
								onclick={regenerateSlug}
							>
								<RefreshCw class="h-3.5 w-3.5" />
							</button>
						</div>
						<p class="text-xs text-muted-foreground">
							Storefront URL: <span class="font-mono text-foreground/80">/categories/{slug || '...'}</span>
						</p>
						{#if createCategory.fields.slug.issues()?.length}
							<div class="text-xs text-destructive">
								{createCategory.fields.slug.issues()?.[0]?.message}
							</div>
						{/if}
					</div>

					<div class="grid gap-2">
						<Label for="parent_id">Parent Category (Optional)</Label>
						<input
							type="hidden"
							{...fp(createCategory.fields.parent_id.as('select'))}
							value={parent_id}
						/>
						<Select.Root type="single" bind:value={parent_id}>
							<Select.Trigger class="w-full">
								{selectedParentLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="" label="None (Top Level)" />
								{#each data.categories as cat}
									<Select.Item value={cat.id} label={cat.name} />
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="mt-4 flex justify-end gap-4">
						<Button type="button" variant="outline" href="/categories">Cancel</Button>
						<Button type="submit" disabled={createCategory.pending > 0}>
							{#if createCategory.pending > 0}
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
							{/if}
							Save Category
						</Button>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
