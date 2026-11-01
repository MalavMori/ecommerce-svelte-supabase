<script lang="ts">
	import Navbar from '#lib/components/Navbar.svelte';
	import Footer from '#lib/components/Footer.svelte';

	let { data, children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
	<Navbar 
		user={data.user} 
		profile={data.profile} 
		cartCount={data.cartCount} 
		categories={data.categories} 
	/>

	<main class="flex-1">
		{@render children()}
	</main>

	<Footer />
</div>
