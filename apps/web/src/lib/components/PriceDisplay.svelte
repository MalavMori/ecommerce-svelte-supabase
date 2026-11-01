<script lang="ts">
	import { currencyState } from '#lib';

	interface Props {
		price: number;
		compareAtPrice?: number | null;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		showDiscountBadge?: boolean;
		class?: string;
	}

	let {
		price = 0,
		compareAtPrice = null,
		size = 'md',
		showDiscountBadge = true,
		class: className = ''
	}: Props = $props();

	const hasDiscount = $derived(
		Boolean(compareAtPrice && compareAtPrice > price)
	);

	const discountPercent = $derived(
		hasDiscount && compareAtPrice
			? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
			: 0
	);

	const textSizes = {
		sm: 'text-sm font-semibold',
		md: 'text-base font-bold',
		lg: 'text-xl font-black',
		xl: 'text-2xl sm:text-3xl font-black'
	};

	const compareSizes = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base',
		xl: 'text-lg'
	};

	let formattedPrice = $derived(currencyState.format(price));

	let formattedCompareAt = $derived(
		compareAtPrice != null ? currencyState.format(compareAtPrice) : null
	);
</script>

<div class="inline-flex items-baseline flex-wrap gap-x-2 gap-y-0.5 {className}">
	<!-- Current Price -->
	<span class="{textSizes[size]} text-foreground tracking-tight">
		{formattedPrice}
	</span>

	<!-- Strikethrough Original Price -->
	{#if hasDiscount && formattedCompareAt}
		<span class="{compareSizes[size]} text-muted-foreground line-through font-normal">
			{formattedCompareAt}
		</span>

		<!-- Discount Badge -->
		{#if showDiscountBadge && discountPercent > 0}
			<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
				-{discountPercent}%
			</span>
		{/if}
	{/if}
</div>
