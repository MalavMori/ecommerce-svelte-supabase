<script lang="ts">
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Zap from 'lucide-svelte/icons/zap';
	import ShieldCheck from 'lucide-svelte/icons/shield-check';

	let { children } = $props();
</script>

<div class="relative flex min-h-screen flex-col justify-between bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
	<!-- Ambient Background Glow & Micro Grid -->
	<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
		<!-- Top Center Ambient Glow -->
		<div
			class="absolute -top-32 left-1/2 h-[450px] w-[650px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10"
		></div>
		<!-- Warm Accent Glow -->
		<div
			class="absolute top-1/3 -right-24 h-[350px] w-[350px] rounded-full bg-accent/5 blur-[100px] dark:bg-accent/10"
		></div>
		<div
			class="absolute bottom-10 -left-20 h-[320px] w-[320px] rounded-full bg-primary/5 blur-[100px] dark:bg-primary/8"
		></div>

		<!-- Subtle Dot Grid Texture -->
		<div
			class="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]"
			style="background-image: radial-gradient(currentColor 1px, transparent 1px); background-size: 24px 24px;"
		></div>
	</div>

	<!-- Top Bar -->
	<header class="relative z-10 w-full border-b border-border/40 bg-background/60 backdrop-blur-md">
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
			<!-- Back to store button -->
			<a
				href="/"
				class="group -ml-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<ArrowLeft class="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
				<span>Back to store</span>
			</a>

			<!-- Center Brand Logo -->
			<a
				href="/"
				class="group flex items-center gap-2.5 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform duration-200 group-hover:scale-105"
				>
					<Zap class="h-4.5 w-4.5 fill-current" />
				</div>
				<div class="flex flex-col">
					<span class="text-base sm:text-lg font-black tracking-tight leading-none">
						NEXUS
					</span>
					<span class="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground leading-tight hidden xs:block">
						Electronics & Gear
					</span>
				</div>
			</a>

			<!-- Right: Theme toggle -->
			<div class="flex items-center gap-2">
				<ThemeToggle />
			</div>
		</div>
	</header>

	<!-- Main Auth Content Area -->
	<main class="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
		<div class="w-full max-w-[420px]">
			{@render children()}
		</div>
	</main>

	<!-- Secure Footer -->
	<footer class="relative z-10 border-t border-border/30 bg-background/40 py-6 text-center text-xs text-muted-foreground backdrop-blur-sm">
		<div class="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2.5 px-4 sm:flex-row sm:justify-between">
			<div class="flex items-center gap-1.5 text-muted-foreground/80">
				<ShieldCheck class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
				<span>256-bit SSL encrypted • Secure authentication</span>
			</div>
			<p>© {new Date().getFullYear()} Nexus Inc. All rights reserved.</p>
		</div>
	</footer>
</div>
