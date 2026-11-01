<script lang="ts">
	import { Star } from 'lucide-svelte';

	interface Props {
		rating?: number | null;
		count?: number | null;
		size?: 'xs' | 'sm' | 'md' | 'lg';
		showCount?: boolean;
		showNumber?: boolean;
		class?: string;
	}

	let {
		rating = 0,
		count = null,
		size = 'sm',
		showCount = true,
		showNumber = false,
		class: className = ''
	}: Props = $props();

	const validRating = $derived(Math.max(0, Math.min(5, Number(rating) || 0)));

	const sizeClasses = {
		xs: 'h-3 w-3',
		sm: 'h-3.5 w-3.5',
		md: 'h-4 w-4',
		lg: 'h-5 w-5'
	};

	const textSizeClasses = {
		xs: 'text-[11px]',
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base'
	};
</script>

<div
	class="inline-flex items-center gap-1.5 {className}"
	aria-label="Rated {validRating.toFixed(1)} out of 5 stars{count !== null ? ` from ${count} reviews` : ''}"
>
	<div class="flex items-center">
		{#each [1, 2, 3, 4, 5] as starIndex}
			<div class="relative">
				{#if validRating >= starIndex}
					<!-- Full star -->
					<Star class="{sizeClasses[size]} fill-amber-400 text-amber-400" />
				{:else if validRating >= starIndex - 0.5}
					<!-- Half star: background star + clipped half star -->
					<div class="relative">
						<Star class="{sizeClasses[size]} text-muted-foreground/30" />
						<div class="absolute inset-0 overflow-hidden w-1/2">
							<Star class="{sizeClasses[size]} fill-amber-400 text-amber-400" />
						</div>
					</div>
				{:else}
					<!-- Empty star -->
					<Star class="{sizeClasses[size]} text-muted-foreground/30" />
				{/if}
			</div>
		{/each}
	</div>

	{#if showNumber && validRating > 0}
		<span class="font-semibold {textSizeClasses[size]} text-foreground">
			{validRating.toFixed(1)}
		</span>
	{/if}

	{#if showCount && count !== null}
		<span class="text-muted-foreground {textSizeClasses[size]}">
			({count})
		</span>
	{/if}
</div>
