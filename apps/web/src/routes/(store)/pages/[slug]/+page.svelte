<script lang="ts">
	import * as Breadcrumb from '@repo/ui/lib/components/ui/breadcrumb/index.js';
	import { FileText, Calendar, Clock } from 'lucide-svelte';

	let { data } = $props();

	// Lightweight markdown parser for headlines, bold, lists, and paragraphs
	function renderMarkdown(raw: string): string {
		if (!raw) return '';
		
		const lines = raw.split('\n');
		const html: string[] = [];
		let inList = false;

		for (let line of lines) {
			const trimmed = line.trim();

			if (!trimmed) {
				if (inList) {
					html.push('</ul>');
					inList = false;
				}
				continue;
			}

			// Format bold **text**
			let formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
			// Format italic *text*
			formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
			// Format links [text](url)
			formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline font-semibold">$1</a>');

			// Headers
			if (formatted.startsWith('### ')) {
				if (inList) { html.push('</ul>'); inList = false; }
				html.push(`<h3 class="text-xl font-bold text-foreground mt-6 mb-2 tracking-tight">${formatted.slice(4)}</h3>`);
			} else if (formatted.startsWith('## ')) {
				if (inList) { html.push('</ul>'); inList = false; }
				html.push(`<h2 class="text-2xl font-black text-foreground mt-8 mb-3 tracking-tight border-b border-border/40 pb-2">${formatted.slice(3)}</h2>`);
			} else if (formatted.startsWith('# ')) {
				if (inList) { html.push('</ul>'); inList = false; }
				html.push(`<h1 class="text-3xl sm:text-4xl font-black text-foreground mt-8 mb-4 tracking-tight">${formatted.slice(2)}</h1>`);
			} else if (formatted.startsWith('- ') || formatted.startsWith('* ')) {
				if (!inList) {
					html.push('<ul class="list-disc list-inside space-y-1 my-3 text-muted-foreground">');
					inList = true;
				}
				html.push(`<li>${formatted.slice(2)}</li>`);
			} else {
				if (inList) { html.push('</ul>'); inList = false; }
				html.push(`<p class="text-base text-foreground/80 leading-relaxed my-3">${formatted}</p>`);
			}
		}

		if (inList) {
			html.push('</ul>');
		}

		return html.join('\n');
	}

	const renderedHtml = $derived(renderMarkdown(data.page.content || ''));
</script>

<svelte:head>
	<title>{data.page.meta_title || `${data.page.title} — Nexus`}</title>
	{#if data.page.meta_description}
		<meta name="description" content={data.page.meta_description} />
	{/if}
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
	
	<!-- Breadcrumbs -->
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>{data.page.title}</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!-- Page Header -->
	<header class="border-b border-border/60 pb-8 space-y-3">
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
			<FileText class="h-3.5 w-3.5" />
			<span>Official Information</span>
		</div>

		<h1 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
			{data.page.title}
		</h1>

		{#if data.page.updated_at}
			<div class="flex items-center gap-2 text-xs text-muted-foreground pt-1">
				<Clock class="h-3.5 w-3.5" />
				<span>Last updated on {new Date(data.page.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
			</div>
		{/if}
	</header>

	<!-- Page Content -->
	<article class="prose prose-neutral dark:prose-invert max-w-none">
		<!-- Rendered markdown content -->
		{@html renderedHtml}
	</article>

</div>
