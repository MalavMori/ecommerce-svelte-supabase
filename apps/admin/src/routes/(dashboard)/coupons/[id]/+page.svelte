<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Label } from '@repo/ui/lib/components/ui/label/index.js';
	import { Checkbox } from '@repo/ui/lib/components/ui/checkbox/index.js';
	import { LoaderCircle, ChevronLeft } from 'lucide-svelte';
	import { updateCoupon } from '../coupons.remote';

	let { data } = $props();

	let code = $state(data.coupon.code ?? '');
	let discount_type = $state(data.coupon.discount_type ?? 'percentage');
	let discount_value = $state(String(data.coupon.discount_value ?? ''));
	let min_order_amount = $state(String(data.coupon.min_order_amount ?? '0'));
	let max_uses = $state(data.coupon.max_uses ? String(data.coupon.max_uses) : '');
	let is_active = $state(Boolean(data.coupon.is_active));

	let selectedDiscountLabel = $derived(
		discount_type === 'percentage'
			? 'Percentage (%)'
			: `Fixed Amount (${data.baseCurrency?.symbol ?? '₹'})`
	);

	function fp(field: Record<string, unknown>) {
		const { value: _v, checked: _c, ...rest } = field;
		return rest;
	}
</script>

<div class="mx-auto max-w-2xl space-y-6 py-6">
	<div class="flex items-center gap-4">
		<Button href="/coupons" variant="outline" size="icon">
			<ChevronLeft class="h-4 w-4" />
		</Button>
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Edit Coupon</h2>
			<p class="text-muted-foreground">Update discount settings and limits.</p>
		</div>
	</div>

	<Card.Root>
		<Card.Content class="pt-6">
			<form {...updateCoupon}>
				<input type="hidden" {...fp(updateCoupon.fields.id.as('text'))} value={data.coupon.id} />

				<div class="grid gap-6">
					<div class="grid gap-2">
						<Label for="code">Coupon Code</Label>
						<Input
							id="code"
							placeholder="e.g. SUMMER20"
							required
							{...fp(updateCoupon.fields.code.as('text'))}
							bind:value={code}
							class="font-mono uppercase"
						/>
						{#if updateCoupon.fields.code.issues()?.length}
							<div class="text-xs text-destructive">
								{updateCoupon.fields.code.issues()?.[0]?.message}
							</div>
						{/if}
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="grid gap-2">
							<Label for="discount_type">Discount Type</Label>
							<input
								type="hidden"
								{...fp(updateCoupon.fields.discount_type.as('select'))}
								value={discount_type}
							/>
							<Select.Root type="single" bind:value={discount_type}>
								<Select.Trigger class="w-full">
									{selectedDiscountLabel}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="percentage" label="Percentage (%)" />
									<Select.Item
										value="fixed"
										label={`Fixed Amount (${data.baseCurrency?.symbol ?? '₹'})`}
									/>
								</Select.Content>
							</Select.Root>
						</div>
						<div class="grid gap-2">
							<Label for="discount_value">Discount Value</Label>
							<Input
								id="discount_value"
								min="0"
								step="0.01"
								required
								placeholder={discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 15.00'}
								{...fp(updateCoupon.fields.discount_value.as('number'))}
								bind:value={discount_value}
							/>
							{#if updateCoupon.fields.discount_value.issues()?.length}
								<div class="text-xs text-destructive">
									{updateCoupon.fields.discount_value.issues()?.[0]?.message}
								</div>
							{/if}
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="grid gap-2">
							<Label for="min_order_amount">
								Min Order Amount ({data.baseCurrency?.symbol ?? '₹'})
							</Label>
							<Input
								id="min_order_amount"
								min="0"
								step="0.01"
								placeholder="0.00"
								{...fp(updateCoupon.fields.min_order_amount.as('number'))}
								bind:value={min_order_amount}
							/>
						</div>
						<div class="grid gap-2">
							<Label for="max_uses">Max Uses (Optional)</Label>
							<Input
								id="max_uses"
								min="1"
								placeholder="Unlimited if empty"
								{...fp(updateCoupon.fields.max_uses.as('number'))}
								bind:value={max_uses}
							/>
						</div>
					</div>

					<div class="grid gap-2">
						<Label class="mt-4 flex cursor-pointer items-center gap-2">
							<Checkbox
								id="is_active"
								{...fp(updateCoupon.fields.is_active.as('checkbox'))}
								bind:checked={is_active}
							/>
							<span>Active (Can be used by customers)</span>
						</Label>
					</div>

					<div class="mt-4 flex justify-end gap-4">
						<Button type="button" variant="outline" href="/coupons">Cancel</Button>
						<Button type="submit" disabled={updateCoupon.pending > 0}>
							{#if updateCoupon.pending > 0}
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
							{/if}
							Save Changes
						</Button>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
