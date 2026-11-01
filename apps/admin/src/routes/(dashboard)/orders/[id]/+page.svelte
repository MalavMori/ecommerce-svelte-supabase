<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Table from '@repo/ui/lib/components/ui/table/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import {
		ChevronLeft,
		Package,
		User,
		MapPin,
		CreditCard,
		Truck,
		RotateCcw,
		History,
		CheckCircle,
		XCircle,
		Plus
	} from 'lucide-svelte';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { formatBasePrice, formatOrderCurrency } from '#lib';

	let { data, form } = $props();

	let currentStatus = $state(data.order.status);
	$effect(() => {
		currentStatus = data.order.status;
	});

	let showAddShipment = $state(false);

	const STATUS_OPTIONS = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'paid', label: 'Paid' },
		{ value: 'shipped', label: 'Shipped' },
		{ value: 'delivered', label: 'Delivered' },
		{ value: 'cancelled', label: 'Cancelled' }
	];

	let currentStatusLabel = $derived(
		STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label ?? currentStatus
	);

	const SHIPMENT_STATUS_OPTIONS = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'shipped', label: 'Shipped' },
		{ value: 'in_transit', label: 'In Transit' },
		{ value: 'delivered', label: 'Delivered' },
		{ value: 'failed', label: 'Failed' }
	];

	let shipmentStatusMap = $state<Record<string, string>>({});

	function getShipmentStatusLabel(val: string) {
		const opt = SHIPMENT_STATUS_OPTIONS.find((o) => o.value === val);
		return opt ? opt.label : val;
	}

	function getStatusColor(status: string) {
		switch (status.toLowerCase()) {
			case 'delivered':
				return 'bg-green-500/15 text-green-700 dark:text-green-400';
			case 'processing':
			case 'paid':
				return 'bg-blue-500/15 text-blue-700 dark:text-blue-400';
			case 'shipped':
				return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400';
			case 'cancelled':
				return 'bg-red-500/15 text-red-700 dark:text-red-400';
			default:
				return 'bg-gray-500/15 text-gray-700 dark:text-gray-400';
		}
	}
</script>

<div class="mx-auto max-w-5xl space-y-6 py-6">
	<!-- Top Bar -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button href="/orders" variant="outline" size="icon">
				<ChevronLeft class="h-4 w-4" />
			</Button>
			<div>
				<div class="flex items-center gap-3">
					<h2 class="text-2xl font-bold tracking-tight">
						Order #{data.order.id.split('-')[0]}
					</h2>
					<div
						class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase {getStatusColor(
							data.order.status
						)}"
					>
						{data.order.status}
					</div>
				</div>
				<p class="font-mono text-xs text-muted-foreground">
					{data.order.id} • Placed on {data.order.created_at
						? new Date(data.order.created_at).toLocaleString()
						: '—'}
				</p>
			</div>
		</div>
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

	<div class="grid gap-6 md:grid-cols-[2fr_1fr]">
		<!-- Left: Ordered items, Shipments, Returns, History -->
		<div class="space-y-6">
			<!-- Order Items Table -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center gap-2">
						<Package class="h-4 w-4 text-muted-foreground" />
						<Card.Title>Order Items ({data.items.length})</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="p-0">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Product</Table.Head>
								<Table.Head class="text-right">Price ({data.baseCurrency?.symbol ?? '₹'})</Table.Head>
								<Table.Head class="text-right">Qty</Table.Head>
								<Table.Head class="text-right">Total ({data.baseCurrency?.symbol ?? '₹'})</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.items as item}
								<Table.Row>
									<Table.Cell class="font-medium">
										<div>
											<p>{item.product_name}</p>
											{#if item.variant_label}
												<p class="text-xs text-muted-foreground">{item.variant_label}</p>
											{/if}
										</div>
									</Table.Cell>
									<Table.Cell class="text-right">{formatBasePrice(item.unit_price, data.baseCurrency)}</Table.Cell>
									<Table.Cell class="text-right">{item.quantity}</Table.Cell>
									<Table.Cell class="text-right font-medium font-mono"
										>{formatBasePrice(item.line_total, data.baseCurrency)}</Table.Cell
									>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>

					<!-- Financial Summary Breakdown -->
					<div class="border-t border-border/40 p-4 space-y-2 bg-muted/10 text-xs">
						<div class="flex justify-between text-muted-foreground">
							<span>Subtotal</span>
							<span class="font-mono font-medium text-foreground">{formatBasePrice(data.order.subtotal, data.baseCurrency)}</span>
						</div>
						{#if data.order.discount_amount && Number(data.order.discount_amount) > 0}
							<div class="flex justify-between text-emerald-600 dark:text-emerald-400">
								<span>Coupon Discount {data.order.coupons?.code ? `(${data.order.coupons.code})` : ''}</span>
								<span class="font-mono font-medium">-{formatBasePrice(data.order.discount_amount, data.baseCurrency)}</span>
							</div>
						{/if}
						<div class="flex justify-between text-muted-foreground">
							<span>Shipping</span>
							<span class="font-mono font-medium text-foreground">{Number(data.order.shipping_amount) === 0 ? 'FREE' : formatBasePrice(data.order.shipping_amount, data.baseCurrency)}</span>
						</div>
						<div class="flex justify-between border-t border-border/40 pt-2 text-sm font-bold text-foreground">
							<span>Total Charged ({data.baseCurrency?.code ?? 'INR'})</span>
							<span class="font-mono text-primary">{formatBasePrice(data.order.total, data.baseCurrency)}</span>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Shipments Section -->
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-3">
					<div class="flex items-center gap-2">
						<Truck class="h-4 w-4 text-muted-foreground" />
						<Card.Title>Shipments ({data.order.shipments?.length || 0})</Card.Title>
					</div>
					<Button
						variant="outline"
						size="sm"
						onclick={() => (showAddShipment = !showAddShipment)}
						class="gap-1.5 text-xs font-semibold"
					>
						<Plus class="h-3.5 w-3.5" />
						<span>{showAddShipment ? 'Cancel' : 'Add Shipment'}</span>
					</Button>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#if showAddShipment}
						<form
							action="?/addShipment"
							method="POST"
							use:enhance
							class="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4"
						>
							<h4 class="text-xs font-bold tracking-wider text-foreground uppercase">
								Create New Shipment
							</h4>
							<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<div>
									<label
										for="carrier"
										class="mb-1 block text-xs font-semibold text-muted-foreground">Carrier</label
									>
									<Input id="carrier" name="carrier" placeholder="FedEx / DHL / UPS" required />
								</div>
								<div>
									<label
										for="tracking_number"
										class="mb-1 block text-xs font-semibold text-muted-foreground"
										>Tracking Number</label
									>
									<Input
										id="tracking_number"
										name="tracking_number"
										placeholder="1Z9999999999999999"
										required
									/>
								</div>
							</div>
							<div class="flex justify-end">
								<Button type="submit" size="sm" class="text-xs font-bold">Save Shipment</Button>
							</div>
						</form>
					{/if}

					{#if data.order.shipments && data.order.shipments.length > 0}
						<div
							class="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/40"
						>
							{#each data.order.shipments as ship}
								<div
									class="flex flex-col justify-between gap-3 bg-muted/10 p-4 text-xs sm:flex-row sm:items-center"
								>
									<div class="space-y-1">
										<div class="flex items-center gap-2">
											<span class="text-sm font-bold text-foreground">{ship.carrier}</span>
											<Badge
												variant="outline"
												class="text-[10px] font-bold tracking-wider uppercase">{ship.status}</Badge
											>
										</div>
										<p class="font-mono text-muted-foreground">
											Tracking: <span class="font-semibold text-foreground select-all"
												>{ship.tracking_number}</span
											>
										</p>
										<div
											class="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground"
										>
											<span
												>Shipped: {ship.shipped_at
													? new Date(ship.shipped_at).toLocaleDateString()
													: '—'}</span
											>
											{#if ship.estimated_delivery}
												<span
													>Est. Delivery: {new Date(
														ship.estimated_delivery
													).toLocaleDateString()}</span
												>
											{/if}
											{#if ship.delivered_at}
												<span class="font-semibold text-emerald-600"
													>Delivered: {new Date(ship.delivered_at).toLocaleDateString()}</span
												>
											{/if}
										</div>
									</div>

									<div class="flex items-center gap-2 self-end sm:self-center">
										<!-- Quick Status Update Form -->
										<form
											id="shipment-form-{ship.id}"
											action="?/updateShipmentStatus"
											method="POST"
											use:enhance
											class="flex items-center gap-1.5"
										>
											<input type="hidden" name="shipmentId" value={ship.id} />
											<input
												type="hidden"
												name="status"
												value={shipmentStatusMap[ship.id] ?? ship.status}
											/>
											<Select.Root
												type="single"
												value={shipmentStatusMap[ship.id] ?? ship.status}
												onValueChange={(val: string) => {
													shipmentStatusMap[ship.id] = val ?? '';
													tick().then(() => {
														const form = document.getElementById(
															`shipment-form-${ship.id}`
														) as HTMLFormElement | null;
														form?.requestSubmit();
													});
												}}
											>
												<Select.Trigger size="sm" class="h-7 w-[120px] text-xs font-normal">
													<span class="truncate">
														{getShipmentStatusLabel(
															shipmentStatusMap[ship.id] ?? ship.status
														)}
													</span>
												</Select.Trigger>
												<Select.Content>
													{#each SHIPMENT_STATUS_OPTIONS as opt}
														<Select.Item value={opt.value} label={opt.label} />
													{/each}
												</Select.Content>
											</Select.Root>
										</form>

										<form action="?/deleteShipment" method="POST" use:enhance>
											<input type="hidden" name="shipmentId" value={ship.id} />
											<Button
												type="submit"
												variant="ghost"
												size="icon"
												class="h-7 w-7 text-destructive hover:bg-destructive/10"
											>
												<XCircle class="h-4 w-4" />
											</Button>
										</form>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="py-2 text-xs text-muted-foreground">
							No shipment recorded for this order yet.
						</p>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Returns Management Section -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center gap-2">
						<RotateCcw class="h-4 w-4 text-muted-foreground" />
						<Card.Title>Customer Returns ({data.order.returns?.length || 0})</Card.Title>
					</div>
				</Card.Header>
				<Card.Content>
					{#if data.order.returns && data.order.returns.length > 0}
						<div class="space-y-3">
							{#each data.order.returns as ret}
								<div class="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs">
									<div class="flex items-center justify-between">
										<Badge variant="outline" class="text-[11px] font-bold uppercase"
											>{ret.status}</Badge
										>
										<span class="font-mono text-muted-foreground">
											Requested: {ret.requested_at
												? new Date(ret.requested_at).toLocaleDateString()
												: '—'}
										</span>
									</div>
									<p><span class="font-semibold text-foreground">Reason:</span> {ret.reason}</p>
									<p>
										<span class="font-semibold text-foreground">Refund Amount:</span> {formatBasePrice(
											ret.refund_amount || data.order.total,
											data.baseCurrency
										)}
									</p>

									{#if ret.status === 'requested'}
										<div class="flex items-center gap-2 border-t border-border/40 pt-2">
											<form action="?/updateReturnStatus" method="POST" use:enhance>
												<input type="hidden" name="returnId" value={ret.id} />
												<input type="hidden" name="status" value="approved" />
												<Button
													type="submit"
													size="sm"
													class="h-8 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
												>
													Approve Return
												</Button>
											</form>
											<form action="?/updateReturnStatus" method="POST" use:enhance>
												<input type="hidden" name="returnId" value={ret.id} />
												<input type="hidden" name="status" value="rejected" />
												<Button
													type="submit"
													variant="outline"
													size="sm"
													class="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10"
												>
													Reject
												</Button>
											</form>
										</div>
									{:else if ret.status === 'approved'}
										<div class="flex items-center gap-2 border-t border-border/40 pt-2">
											<form action="?/updateReturnStatus" method="POST" use:enhance>
												<input type="hidden" name="returnId" value={ret.id} />
												<input type="hidden" name="status" value="refunded" />
												<Button
													type="submit"
													size="sm"
													class="h-8 bg-purple-600 text-xs font-bold text-white hover:bg-purple-700"
												>
													Mark as Refunded
												</Button>
											</form>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<p class="py-1 text-xs text-muted-foreground">No return requests on this order.</p>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Order Status History Audit Trail -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center gap-2">
						<History class="h-4 w-4 text-muted-foreground" />
						<Card.Title>Status History Timeline</Card.Title>
					</div>
				</Card.Header>
				<Card.Content>
					{#if data.order.statusHistory && data.order.statusHistory.length > 0}
						<div class="space-y-3">
							{#each data.order.statusHistory as entry}
								<div
									class="flex items-center justify-between border-b border-border/40 pb-2 text-xs last:border-0 last:pb-0"
								>
									<div class="flex items-center gap-2">
										<span class="font-bold text-foreground uppercase">{entry.status}</span>
										{#if entry.changed_by}
											<span class="font-mono text-[11px] text-muted-foreground"
												>by {entry.changed_by.slice(0, 8)}</span
											>
										{/if}
									</div>
									<span class="font-mono text-muted-foreground">
										{entry.created_at ? new Date(entry.created_at).toLocaleString() : '—'}
									</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-xs text-muted-foreground">No status changes logged yet.</p>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Right: Status update, Payment, Customer, Delivery -->
		<div class="space-y-6">
			<!-- Status Update -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-sm font-semibold">Update Status</Card.Title>
				</Card.Header>
				<Card.Content>
					<form action="?/updateStatus" method="POST" use:enhance class="space-y-3">
						<input type="hidden" name="status" value={currentStatus} />
						<Select.Root type="single" bind:value={currentStatus}>
							<Select.Trigger class="w-full text-sm">
								<span class="truncate">{currentStatusLabel}</span>
							</Select.Trigger>
							<Select.Content>
								{#each STATUS_OPTIONS as opt}
									<Select.Item value={opt.value} label={opt.label} />
								{/each}
							</Select.Content>
						</Select.Root>
						<Button type="submit" class="w-full text-xs font-bold">Update Status</Button>
					</form>
				</Card.Content>
			</Card.Root>

			<!-- Stripe & Payment Gateway Info -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center gap-2">
						<CreditCard class="h-4 w-4 text-muted-foreground" />
						<Card.Title class="text-sm font-semibold">Payment Details</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="space-y-2 text-xs">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Status:</span>
						<span class="font-bold text-foreground uppercase"
							>{data.order.payment_status || 'Paid'}</span
						>
					</div>
					{#if data.order.stripe_payment_intent_id}
						<div class="space-y-0.5 border-t border-border/40 pt-1">
							<span class="text-[11px] text-muted-foreground">Stripe Payment Intent:</span>
							<p class="font-mono text-[11px] break-all text-foreground select-all">
								{data.order.stripe_payment_intent_id}
							</p>
						</div>
					{/if}
					{#if data.order.stripe_customer_id}
						<div class="space-y-0.5 border-t border-border/40 pt-1">
							<span class="text-[11px] text-muted-foreground">Stripe Customer ID:</span>
							<p class="font-mono text-[11px] text-foreground select-all">
								{data.order.stripe_customer_id}
							</p>
						</div>
					{/if}
					<div class="flex justify-between border-t border-border/40 pt-2">
						<span class="text-muted-foreground">Store Total ({data.baseCurrency?.code ?? 'INR'}):</span>
						<span class="font-mono font-bold text-foreground">{formatBasePrice(data.order.total, data.baseCurrency)}</span>
					</div>
					{#if data.order.display_currency_code && data.order.display_total}
						<div class="space-y-1 border-t border-border/40 pt-2">
							<div class="flex items-center justify-between">
								<span class="text-[11px] text-muted-foreground">Customer Display Total:</span>
								<span class="font-mono text-xs font-bold text-foreground">
									{formatOrderCurrency(data.order.display_total, data.order.display_currency_code, data.currencies)} ({data.order.display_currency_code})
								</span>
							</div>
							{#if data.order.display_currency_code !== data.baseCurrency?.code}
								{@const impliedRate = Number(data.order.total) > 0 ? (Number(data.order.display_total) / Number(data.order.total)).toFixed(4) : null}
								{#if impliedRate}
									<p class="font-mono text-[10px] text-muted-foreground text-right">
										1 {data.baseCurrency?.code} ≈ {impliedRate} {data.order.display_currency_code}
									</p>
								{/if}
							{/if}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Customer Info -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center gap-2">
						<User class="h-4 w-4 text-muted-foreground" />
						<Card.Title class="text-sm font-semibold">Customer</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="space-y-2 text-xs">
					<div>
						<span class="text-muted-foreground">Name:</span>
						<p class="font-medium text-foreground">{data.order.profiles?.full_name || '—'}</p>
					</div>
					<div>
						<span class="text-muted-foreground">Phone:</span>
						<p class="font-medium text-foreground">{data.order.profiles?.phone || '—'}</p>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Shipping Address -->
			<Card.Root>
				<Card.Header>
					<div class="flex items-center gap-2">
						<MapPin class="h-4 w-4 text-muted-foreground" />
						<Card.Title class="text-sm font-semibold">Shipping Address</Card.Title>
					</div>
				</Card.Header>
				<Card.Content class="space-y-0.5 text-xs text-muted-foreground">
					{#if data.order.addresses}
						<p class="font-medium text-foreground">{data.order.addresses.line1}</p>
						{#if data.order.addresses.line2}
							<p>{data.order.addresses.line2}</p>
						{/if}
						<p>
							{data.order.addresses.city}, {data.order.addresses.state}
							{data.order.addresses.postal_code}
						</p>
						<p class="font-mono text-[11px] uppercase">{data.order.addresses.country}</p>
					{:else}
						<p>No address recorded.</p>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
