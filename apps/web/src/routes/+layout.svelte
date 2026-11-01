<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '@repo/ui/lib/components/ui/sonner/index.js';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { currencyState } from '#lib';

	let { data, children } = $props();
	let { supabase, session } = $derived(data);

	$effect.pre(() => {
		currencyState.init({
			baseCurrency: data.baseCurrency,
			currencies: data.currencies,
			selectedCurrency: data.selectedCurrency,
			exchangeRates: data.exchangeRates
		});
	});

	// svelte-ignore state_referenced_locally
	currencyState.init({
		baseCurrency: data.baseCurrency,
		currencies: data.currencies,
		selectedCurrency: data.selectedCurrency,
		exchangeRates: data.exchangeRates
	});

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<Toaster />
{@render children()}
