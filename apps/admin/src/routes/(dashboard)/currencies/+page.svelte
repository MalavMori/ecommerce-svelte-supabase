<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Table from '@repo/ui/lib/components/ui/table/index.js';
	import * as Dialog from '@repo/ui/lib/components/ui/dialog/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Label } from '@repo/ui/lib/components/ui/label/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import {
		Coins,
		Plus,
		CheckCircle2,
		Save,
		Info,
		RotateCw,
		Check,
		AlertCircle
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let baseCode = $derived(
		typeof data.baseCurrency === 'string'
			? data.baseCurrency
			: (data.baseCurrency?.code ?? 'INR')
	);

	let selectedBaseCurrency = $state('');
	$effect(() => {
		selectedBaseCurrency = baseCode;
	});

	let selectedCurrencyLabel = $derived(
		(() => {
			const c = data.currencies.find((item: any) => item.code === selectedBaseCurrency);
			return c ? `${c.code} — ${c.name} (${c.symbol})` : selectedBaseCurrency;
		})()
	);
	let showAddDialog = $state(false);

	let newCode = $state('');
	let newName = $state('');
	let newSymbol = $state('');
	let newDecimals = $state(2);
	let newRate = $state(1.0);

	// Map of rates for reactive editing
	let rateInputs = $state<Record<string, number>>(
		Object.fromEntries(
			data.exchangeRates.map((r: any) => [r.currency_code, Number(r.rate_to_base)])
		)
	);

	function getRate(code: string) {
		const r = data.exchangeRates.find((item: any) => item.currency_code === code);
		return r ? Number(r.rate_to_base) : 1.0;
	}

	function getRateUpdatedAt(code: string) {
		const r = data.exchangeRates.find((item: any) => item.currency_code === code);
		return r?.updated_at ? new Date(r.updated_at).toLocaleString() : '—';
	}
</script>

<div class="mx-auto max-w-5xl space-y-8 py-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Currencies & Exchange Rates</h2>
			<p class="text-muted-foreground">
				Configure the store's base charging currency, supported display currencies, and conversion
				rates.
			</p>
		</div>
		<Button onclick={() => (showAddDialog = true)} class="gap-1.5 font-bold">
			<Plus class="h-4 w-4" /> Add Currency
		</Button>
	</div>

	<!-- Info Notice -->
	<div
		class="flex items-start gap-3.5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground/90"
	>
		<Info class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
		<div class="space-y-1">
			<p class="font-semibold text-primary">How Multi-Currency Operates</p>
			<p class="leading-relaxed text-muted-foreground">
				All store checkout charges and Stripe transactions occur strictly in the <strong
					>Base Currency</strong
				>
				(<span class="font-mono font-bold text-foreground">{baseCode}</span>). Exchange
				rates define conversion factors for customers browsing in other active currencies. When
				orders are created, the customer's display currency and converted total are snapshotted for
				historical record.
			</p>
		</div>
	</div>

	{#if form?.error}
		<div
			class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs font-semibold text-destructive"
		>
			<AlertCircle class="h-4 w-4 shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}

	{#if form?.success}
		<div
			class="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
		>
			<CheckCircle2 class="h-4 w-4 shrink-0" />
			<span>Changes saved successfully!</span>
		</div>
	{/if}

	<!-- ─── Base Currency Configuration Card ─── -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center gap-2">
				<Coins class="h-4 w-4 text-primary" />
				<Card.Title>Store Base Currency</Card.Title>
			</div>
			<Card.Description
				>The primary currency used to price products and process payments.</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				action="?/updateBaseCurrency"
				use:enhance
				class="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
			>
				<div class="w-full sm:w-64">
					<input type="hidden" name="baseCurrencyCode" value={selectedBaseCurrency} />
					<Select.Root type="single" bind:value={selectedBaseCurrency}>
						<Select.Trigger class="w-full text-sm font-medium">
							<span class="truncate">{selectedCurrencyLabel}</span>
						</Select.Trigger>
						<Select.Content>
							{#each data.currencies as c}
								<Select.Item
									value={c.code}
									label={`${c.code} — ${c.name} (${c.symbol})`}
								/>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<Button type="submit" class="font-bold">
					<Save class="mr-1.5 h-4 w-4" /> Save Base Currency
				</Button>
				{#if selectedBaseCurrency === baseCode}
					<span class="flex items-center gap-1 text-xs text-muted-foreground">
						<Check class="h-3.5 w-3.5 text-emerald-600" /> Current store base currency is {baseCode}
					</span>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>

	<!-- ─── Currencies & Exchange Rates Table ─── -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Supported Currencies & Conversion Rates</Card.Title>
			<Card.Description>
				Rates relative to 1 {baseCode}. For example, if 1 {baseCode} = 0.012 USD, enter
				0.012.
			</Card.Description>
		</Card.Header>
		<Card.Content class="p-0">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Currency</Table.Head>
						<Table.Head>Symbol</Table.Head>
						<Table.Head>Decimals</Table.Head>
						<Table.Head>Exchange Rate (to 1 {baseCode})</Table.Head>
						<Table.Head>Last Updated</Table.Head>
						<Table.Head class="text-center">Status</Table.Head>
						<Table.Head class="text-right">Action</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.currencies as c}
						{@const isBase = c.code === baseCode}
						{@const currentRate = rateInputs[c.code] ?? getRate(c.code)}
						<Table.Row>
							<!-- Currency Code & Name -->
							<Table.Cell class="text-xs font-medium">
								<div class="flex items-center gap-2">
									<span class="font-mono text-sm font-bold text-foreground">{c.code}</span>
									<span class="text-muted-foreground">{c.name}</span>
									{#if isBase}
										<Badge
											class="border-primary/20 bg-primary/10 px-1.5 py-0 text-[10px] font-bold text-primary"
										>
											BASE
										</Badge>
									{/if}
								</div>
							</Table.Cell>

							<!-- Symbol -->
							<Table.Cell class="text-sm font-bold text-foreground">
								{c.symbol}
							</Table.Cell>

							<!-- Decimal Digits -->
							<Table.Cell class="font-mono text-xs text-muted-foreground">
								{c.decimal_digits}
							</Table.Cell>

							<!-- Exchange Rate Form -->
							<Table.Cell>
								{#if isBase}
									<span class="font-mono text-xs font-bold text-muted-foreground"
										>1.000000 (Fixed)</span
									>
								{:else}
									<form
										method="POST"
										action="?/updateExchangeRate"
										use:enhance={() => {
											return async ({ result, update }) => {
												await update({ reset: false });
												if (result.type === 'success') {
													// Re-sync rateInputs from refreshed server data
													data.exchangeRates.forEach((r: any) => {
														rateInputs[r.currency_code] = Number(r.rate_to_base);
													});
												}
											};
										}}
										class="flex items-center gap-2"
									>
										<input type="hidden" name="code" value={c.code} />
										<Input
											name="rate_to_base"
											type="number"
											step="0.000001"
											min="0.000001"
											bind:value={rateInputs[c.code]}
											class="h-8 w-32 bg-background font-mono text-xs"
											required
										/>
										<Button
											type="submit"
											size="sm"
											variant="outline"
											class="h-8 px-2.5 text-xs font-bold"
										>
											Update
										</Button>
									</form>
								{/if}
							</Table.Cell>

							<!-- Last Updated -->
							<Table.Cell class="font-mono text-[11px] text-muted-foreground">
								{getRateUpdatedAt(c.code)}
							</Table.Cell>

							<!-- Active Status Switch -->
							<Table.Cell class="text-center">
								<form method="POST" action="?/toggleCurrency" use:enhance>
									<input type="hidden" name="code" value={c.code} />
									<input type="hidden" name="isActive" value={c.is_active ? 'false' : 'true'} />
									<button
										type="submit"
										disabled={isBase}
										class="cursor-pointer transition-opacity disabled:cursor-not-allowed"
										title={isBase ? 'Base currency cannot be deactivated' : 'Click to toggle'}
									>
										{#if c.is_active}
											<Badge
												variant="outline"
												class="border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600"
												>Active</Badge
											>
										{:else}
											<Badge variant="outline" class="text-[11px] text-muted-foreground"
												>Inactive</Badge
											>
										{/if}
									</button>
								</form>
							</Table.Cell>

							<!-- Quick Actions -->
							<Table.Cell class="text-right text-xs">
								{#if isBase}
									<span class="text-xs text-muted-foreground italic">Store Base</span>
								{:else}
									<span class="text-xs text-muted-foreground"
										>1 {baseCode} = {currentRate} {c.code}</span
									>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>

<!-- ─── Dialog: Add New Currency ─── -->
<Dialog.Root bind:open={showAddDialog}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add Supported Currency</Dialog.Title>
			<Dialog.Description
				>Register a new ISO 4217 currency with initial conversion rate.</Dialog.Description
			>
		</Dialog.Header>
		<form
			method="POST"
			action="?/addCurrency"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') {
						showAddDialog = false;
						newCode = '';
						newName = '';
						newSymbol = '';
						newDecimals = 2;
						newRate = 1.0;
					}
				};
			}}
			class="space-y-4 pt-2"
		>
			<div class="grid grid-cols-2 gap-4">
				<div class="grid gap-2">
					<Label for="curr_code">ISO Code (3 letters)</Label>
					<Input
						id="curr_code"
						name="code"
						bind:value={newCode}
						placeholder="e.g. CAD, AUD, SGD"
						maxlength={3}
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="curr_symbol">Symbol</Label>
					<Input
						id="curr_symbol"
						name="symbol"
						bind:value={newSymbol}
						placeholder="e.g. $, CA$, A$"
						required
					/>
				</div>
			</div>

			<div class="grid gap-2">
				<Label for="curr_name">Currency Name</Label>
				<Input
					id="curr_name"
					name="name"
					bind:value={newName}
					placeholder="e.g. Canadian Dollar"
					required
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="grid gap-2">
					<Label for="curr_dec">Decimal Digits</Label>
					<Input
						id="curr_dec"
						name="decimal_digits"
						type="number"
						min="0"
						max="4"
						bind:value={newDecimals}
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="curr_rate">Rate to 1 {data.baseCurrency}</Label>
					<Input
						id="curr_rate"
						name="rate_to_base"
						type="number"
						step="0.000001"
						min="0.000001"
						bind:value={newRate}
						required
					/>
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (showAddDialog = false)}
					>Cancel</Button
				>
				<Button type="submit" class="font-bold">Add Currency</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
