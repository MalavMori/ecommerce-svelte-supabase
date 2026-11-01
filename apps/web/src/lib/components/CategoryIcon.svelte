<script lang="ts">
	import {
		Headphones,
		Watch,
		Laptop,
		Gamepad2,
		Monitor,
		Home,
		Package
	} from 'lucide-svelte';

	let { slug = '', class: className = 'h-4 w-4' }: { slug?: string; class?: string } = $props();
</script>

{#if slug === 'audio'}
	<Headphones class={className} />
{:else if slug === 'wearables'}
	<Watch class={className} />
{:else if slug === 'accessories'}
	<Laptop class={className} />
{:else if slug === 'gaming'}
	<Gamepad2 class={className} />
{:else if slug === 'home-office'}
	<Monitor class={className} />
{:else if slug === 'smart-home'}
	<Home class={className} />
{:else}
	<Package class={className} />
{/if}
