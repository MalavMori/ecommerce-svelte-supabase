<script lang="ts">
	import { enhance } from '$app/forms';
	import { 
		MapPin, 
		Plus, 
		Trash2, 
		Star, 
		CheckCircle2, 
		AlertCircle, 
		X,
		Home,
		Building2,
		Pencil
	} from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Label } from '@repo/ui/lib/components/ui/label/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';

	let { data, form } = $props();

	let showAddModal = $state(false);
	let isSubmitting = $state(false);

	let label = $state('Home');
	let line1 = $state('');
	let line2 = $state('');
	let city = $state('');
	let addressState = $state('');
	let postalCode = $state('');
	let country = $state('United States');
	let isDefault = $state(false);

	let editingAddress = $state<any | null>(null);

	function resetForm() {
		line1 = '';
		line2 = '';
		city = '';
		addressState = '';
		postalCode = '';
		showAddModal = false;
		editingAddress = null;
	}

	function startEdit(addr: any) {
		editingAddress = { ...addr };
		showAddModal = false;
	}
</script>

<svelte:head>
	<title>Saved Addresses — Nexus</title>
</svelte:head>

<div class="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-6">
	
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-foreground">
				Shipping Addresses
			</h1>
			<p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
				Manage delivery destinations for fast, one-click checkout.
			</p>
		</div>

		<Button
			size="sm"
			onclick={() => (showAddModal = !showAddModal)}
			class="gap-1.5 self-start sm:self-auto font-bold"
		>
			<Plus class="h-4 w-4" />
			<span>Add Address</span>
		</Button>
	</div>

	{#if form?.message}
		<div class="p-4 rounded-2xl {form?.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/10 border border-destructive/20 text-destructive'} text-xs font-semibold flex items-center gap-2">
			{#if form?.success}
				<CheckCircle2 class="h-4 w-4 shrink-0" />
			{:else}
				<AlertCircle class="h-4 w-4 shrink-0" />
			{/if}
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Add Address Form Card (collapsible) -->
	{#if showAddModal}
		<div class="rounded-2xl border border-primary/40 bg-muted/20 p-6 space-y-5 animate-in fade-in-50 duration-200">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-bold text-foreground">Add New Shipping Address</h3>
				<button onclick={resetForm} class="p-1 rounded-md text-muted-foreground hover:text-foreground">
					<X class="h-4 w-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/addAddress"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
						if (form?.success) resetForm();
					};
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<Label for="new-label" class="text-xs">Address Label</Label>
						<Input id="new-label" name="label" bind:value={label} placeholder="Home, Studio, Office" class="h-9.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<Label for="new-country" class="text-xs">Country</Label>
						<Input id="new-country" name="country" bind:value={country} required class="h-9.5 text-sm" />
					</div>
				</div>

				<div class="space-y-1.5">
					<Label for="new-line1" class="text-xs">Street Line 1 *</Label>
					<Input id="new-line1" name="line1" bind:value={line1} placeholder="123 Tech Way" required class="h-9.5 text-sm" />
				</div>

				<div class="space-y-1.5">
					<Label for="new-line2" class="text-xs">Apartment / Suite Line 2</Label>
					<Input id="new-line2" name="line2" bind:value={line2} placeholder="Apt 4B" class="h-9.5 text-sm" />
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div class="space-y-1.5">
						<Label for="new-city" class="text-xs">City *</Label>
						<Input id="new-city" name="city" bind:value={city} placeholder="Austin" required class="h-9.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<Label for="new-state" class="text-xs">State</Label>
						<Input id="new-state" name="state" bind:value={addressState} placeholder="TX" class="h-9.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<Label for="new-postal" class="text-xs">Postal Code *</Label>
						<Input id="new-postal" name="postalCode" bind:value={postalCode} placeholder="78701" required class="h-9.5 text-sm" />
					</div>
				</div>

				<div class="flex items-center gap-2 pt-2">
					<input type="checkbox" id="new-default" name="isDefault" bind:checked={isDefault} class="rounded text-primary focus:ring-primary h-4 w-4" />
					<label for="new-default" class="text-xs font-semibold text-foreground cursor-pointer">
						Set as default shipping address
					</label>
				</div>

				<div class="flex items-center justify-end gap-2 pt-2">
					<Button type="button" variant="outline" size="sm" onclick={resetForm}>
						Cancel
					</Button>
					<Button type="submit" size="sm" disabled={isSubmitting}>
						Save Address
					</Button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Edit Address Form Card (collapsible) -->
	{#if editingAddress}
		<div class="rounded-2xl border border-primary bg-primary/5 p-6 space-y-5 animate-in fade-in-50 duration-200">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-bold text-foreground flex items-center gap-2">
					<Pencil class="h-4 w-4 text-primary" />
					<span>Edit Shipping Address</span>
				</h3>
				<button onclick={resetForm} class="p-1 rounded-md text-muted-foreground hover:text-foreground">
					<X class="h-4 w-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/updateAddress"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
						if (form?.success) resetForm();
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="addressId" value={editingAddress.id} />

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<Label for="edit-label" class="text-xs">Address Label</Label>
						<Input id="edit-label" name="label" bind:value={editingAddress.label} placeholder="Home, Studio, Office" class="h-9.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<Label for="edit-country" class="text-xs">Country</Label>
						<Input id="edit-country" name="country" bind:value={editingAddress.country} required class="h-9.5 text-sm" />
					</div>
				</div>

				<div class="space-y-1.5">
					<Label for="edit-line1" class="text-xs">Street Address</Label>
					<Input id="edit-line1" name="line1" bind:value={editingAddress.line1} placeholder="123 Innovation Way" required class="h-9.5 text-sm" />
				</div>

				<div class="space-y-1.5">
					<Label for="edit-line2" class="text-xs">Apt, Suite, Unit (Optional)</Label>
					<Input id="edit-line2" name="line2" bind:value={editingAddress.line2} placeholder="Suite 402" class="h-9.5 text-sm" />
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div class="space-y-1.5">
						<Label for="edit-city" class="text-xs">City</Label>
						<Input id="edit-city" name="city" bind:value={editingAddress.city} placeholder="San Francisco" required class="h-9.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<Label for="edit-state" class="text-xs">State / Province</Label>
						<Input id="edit-state" name="state" bind:value={editingAddress.state} placeholder="CA" class="h-9.5 text-sm" />
					</div>
					<div class="space-y-1.5">
						<Label for="edit-postalCode" class="text-xs">Postal Code</Label>
						<Input id="edit-postalCode" name="postalCode" bind:value={editingAddress.postal_code} placeholder="94105" required class="h-9.5 text-sm" />
					</div>
				</div>

				<div class="flex items-center gap-2 pt-2">
					<input
						type="checkbox"
						id="edit-isDefault"
						name="isDefault"
						bind:checked={editingAddress.is_default}
						class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
					/>
					<Label for="edit-isDefault" class="text-xs cursor-pointer">Set as default shipping address</Label>
				</div>

				<div class="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
					<Button type="button" variant="ghost" size="sm" onclick={resetForm}>
						Cancel
					</Button>
					<Button type="submit" size="sm" disabled={isSubmitting}>
						Update Address
					</Button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Saved Addresses Grid -->
	{#if data.addresses.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{#each data.addresses as addr}
				<div class="p-5 rounded-2xl border-2 transition-all flex flex-col justify-between {addr.is_default ? 'border-primary bg-primary/5' : 'border-border/60 bg-card'} space-y-4">
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<MapPin class="h-4 w-4 text-primary" />
								<h3 class="font-bold text-sm text-foreground">{addr.label || 'Shipping Address'}</h3>
							</div>
							{#if addr.is_default}
								<Badge class="bg-primary text-primary-foreground text-[10px] font-bold">Default</Badge>
							{/if}
						</div>

						<div class="text-xs text-muted-foreground space-y-0.5">
							<p class="text-foreground font-medium">{addr.line1}</p>
							{#if addr.line2}
								<p>{addr.line2}</p>
							{/if}
							<p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postal_code}</p>
							<p class="uppercase font-mono text-[11px]">{addr.country}</p>
						</div>
					</div>

					<div class="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
						{#if !addr.is_default}
							<form method="POST" action="?/setDefault" use:enhance>
								<input type="hidden" name="addressId" value={addr.id} />
								<button type="submit" class="text-xs font-semibold text-primary hover:underline cursor-pointer">
									Set as Default
								</button>
							</form>
						{:else}
							<span class="text-[11px] text-muted-foreground font-semibold">Primary Address</span>
						{/if}

						<div class="flex items-center gap-1">
							<button
								type="button"
								onclick={() => startEdit(addr)}
								class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
								aria-label="Edit address"
							>
								<Pencil class="h-3.5 w-3.5" />
							</button>

							<form method="POST" action="?/deleteAddress" use:enhance>
								<input type="hidden" name="addressId" value={addr.id} />
								<button type="submit" class="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer" aria-label="Delete address">
									<Trash2 class="h-3.5 w-3.5" />
								</button>
							</form>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center p-12 border border-dashed rounded-3xl space-y-3">
			<div class="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mx-auto">
				<MapPin class="h-6 w-6 stroke-[1.5]" />
			</div>
			<div class="space-y-1">
				<h3 class="text-base font-bold text-foreground">No saved addresses</h3>
				<p class="text-xs text-muted-foreground max-w-xs mx-auto">
					Add a shipping address to speed up your future checkouts.
				</p>
			</div>
			<Button size="sm" onclick={() => (showAddModal = true)} class="mt-2">
				<Plus class="h-4 w-4 mr-1.5" />
				<span>Add Address</span>
			</Button>
		</div>
	{/if}

</div>
