<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, Home, Search, Zap, AlertTriangle } from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
</script>

<svelte:head>
	<title>{page.status} — Page Not Found | Nexus</title>
</svelte:head>

<div class="min-h-[80vh] flex items-center justify-center px-4 py-16">
	<div class="max-w-md w-full text-center space-y-6">
		
		<!-- Graphic Symbol -->
		<div class="relative inline-flex items-center justify-center">
			<div class="h-24 w-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
				<Zap class="h-12 w-12" />
			</div>
			<span class="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-mono font-bold shadow-md">
				{page.status || 404}
			</span>
		</div>

		<div class="space-y-2">
			<h1 class="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
				Signal Lost / Page Not Found
			</h1>
			<p class="text-sm text-muted-foreground leading-relaxed">
				{page.error?.message || "The gear or page you requested cannot be located in the system. It may have been moved, renamed, or temporarily disconnected."}
			</p>
		</div>

		<div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
			<Button href="/" class="w-full sm:w-auto font-bold gap-2 shadow-md">
				<Home class="h-4 w-4" />
				<span>Return Home</span>
			</Button>
			<Button variant="outline" href="/products" class="w-full sm:w-auto font-semibold gap-2">
				<Search class="h-4 w-4" />
				<span>Browse Catalog</span>
			</Button>
		</div>

		<p class="text-xs text-muted-foreground pt-4">
			Need help? Reach out to support at <a href="mailto:support@example.com" class="text-primary underline">support@example.com</a>
		</p>
	</div>
</div>
