<script lang="ts">
	import '../../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '@repo/ui/lib/components/ui/sonner/index.js';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<Toaster />

<div class="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
	<div class="absolute top-4 right-4">
		<ThemeToggle />
	</div>
	{@render children()}
</div>
