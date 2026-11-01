<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Dialog from '@repo/ui/lib/components/ui/dialog/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Label } from '@repo/ui/lib/components/ui/label/index.js';
	import { Badge } from '@repo/ui/lib/components/ui/badge/index.js';
	import * as Select from '@repo/ui/lib/components/ui/select/index.js';
	import {
		FolderOpen,
		UploadCloud,
		Search,
		Copy,
		Check,
		Trash2,
		ExternalLink,
		LoaderCircle,
		Image as ImageIcon,
		FileText,
		HardDrive,
		Filter,
		RefreshCw
	} from 'lucide-svelte';
	import ImagePicker from '#lib/components/ImagePicker.svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	type MediaFile = {
		name: string;
		id: string;
		size: number;
		mimetype: string;
		createdAt: string;
		path: string;
		url: string;
	};

	let files = $state<MediaFile[]>([]);
	let loading = $state(true);
	let selectedFolder = $state<string>('all');
	let searchFilter = $state('');
	let copiedPath = $state<string | null>(null);

	// Lightbox preview state
	let previewImage = $state<MediaFile | null>(null);

	// Upload modal state
	let showUploadModal = $state(false);
	let uploadedUrl = $state('');
	let activeBucket = $state<'files' | 'product-images'>('files');

	const filesFolders = [
		{ id: 'all', label: 'All Files' },
		{ id: 'banners', label: 'Hero Banners' },
		{ id: 'featured', label: 'Curated Collections' },
		{ id: 'products', label: 'Product OG & SEO' },
		{ id: 'general', label: 'General' }
	];

	const productImagesFolders = [
		{ id: 'all', label: 'All Product Photos' }
	];

	const uploadBucketOptions = [
		{ value: 'files', label: 'files (General Content, Banners, Collections)' },
		{ value: 'product-images', label: 'product-images (Product Gallery Photos)' }
	];

	const uploadFolderOptions = [
		{ value: 'general', label: 'general/ (Default)' },
		{ value: 'banners', label: 'banners/ (Hero Carousel)' },
		{ value: 'featured', label: 'featured/ (Curated Collections)' },
		{ value: 'products', label: 'products/ (OG & SEO)' }
	];

	let activeBucketLabel = $derived(
		uploadBucketOptions.find((b) => b.value === activeBucket)?.label ?? activeBucket
	);

	let uploadFolderValue = $derived(selectedFolder === 'all' ? 'general' : selectedFolder);

	let selectedFolderLabel = $derived(
		uploadFolderOptions.find((f) => f.value === uploadFolderValue)?.label ?? uploadFolderValue
	);

	let currentFolders = $derived(activeBucket === 'files' ? filesFolders : productImagesFolders);

	async function loadFiles() {
		loading = true;
		try {
			// Fetch files from specified bucket
			const folderParam = selectedFolder === 'all' ? '' : selectedFolder;
			const res = await fetch(
				`/api/upload?bucket=${activeBucket}&folder=${encodeURIComponent(folderParam)}`
			);
			const data = await res.json();
			if (data.success) {
				files = data.files || [];
			} else {
				toast.error(data.error || 'Failed to load files');
			}
		} catch (err: any) {
			toast.error(err.message || 'Error fetching media files');
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadFiles();
	});

	function onBucketChange(bucket: 'files' | 'product-images') {
		activeBucket = bucket;
		selectedFolder = 'all';
		loadFiles();
	}

	function onFolderChange(folderId: string) {
		selectedFolder = folderId;
		loadFiles();
	}

	let filteredFiles = $derived.by(() => {
		if (!searchFilter.trim()) return files;
		const query = searchFilter.toLowerCase().trim();
		return files.filter(
			(f) => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query)
		);
	});

	async function copyToClipboard(url: string, path: string) {
		try {
			await navigator.clipboard.writeText(url);
			copiedPath = path;
			toast.success('Public URL copied to clipboard!');
			setTimeout(() => {
				if (copiedPath === path) copiedPath = null;
			}, 2000);
		} catch {
			toast.error('Failed to copy URL');
		}
	}

	async function deleteFile(file: MediaFile) {
		if (!confirm(`Are you sure you want to permanently delete "${file.name}"?`)) return;

		try {
			const res = await fetch('/api/upload', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ path: file.path, bucket: activeBucket })
			});
			const data = await res.json();
			if (data.success) {
				files = files.filter((f) => f.path !== file.path);
				if (previewImage?.path === file.path) previewImage = null;
				toast.success('File deleted from storage bucket');
			} else {
				toast.error(data.error || 'Failed to delete file');
			}
		} catch (err: any) {
			toast.error(err.message || 'Failed to delete file');
		}
	}

	function onUploadComplete(url: string) {
		if (url) {
			showUploadModal = false;
			uploadedUrl = '';
			loadFiles();
		}
	}
</script>

<div class="mx-auto max-w-7xl space-y-6 py-6">
	<!-- Page Header -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<div class="flex items-center gap-2">
				<FolderOpen class="h-6 w-6 text-primary" />
				<h1 class="text-2xl font-bold tracking-tight">Media & Files Library</h1>
			</div>
			<p class="mt-1 text-xs text-muted-foreground">
				Manage, preview, and upload assets across all store sections stored in Supabase storage buckets.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={loadFiles}
				disabled={loading}
				class="h-9 gap-1.5 text-xs"
			>
				<RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
				<span>Refresh</span>
			</Button>

			<Button
				size="sm"
				onclick={() => (showUploadModal = true)}
				class="h-9 gap-1.5 text-xs font-bold shadow-xs"
			>
				<UploadCloud class="h-4 w-4" />
				<span>Upload Asset</span>
			</Button>
		</div>
	</div>

	<!-- Bucket & Filter Controls Bar -->
	<div class="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-2xs">
		<!-- Bucket Selector Pills -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-3">
			<div class="flex items-center gap-2">
				<span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bucket:</span>
				<div class="inline-flex rounded-lg border border-border bg-muted/40 p-1">
					<button
						type="button"
						onclick={() => onBucketChange('files')}
						class="rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer {activeBucket === 'files'
							? 'bg-background text-foreground shadow-xs'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						files (General & Content)
					</button>
					<button
						type="button"
						onclick={() => onBucketChange('product-images')}
						class="rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer {activeBucket === 'product-images'
							? 'bg-background text-foreground shadow-xs'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						product-images (Product Photos)
					</button>
				</div>
			</div>

			<!-- Search Input -->
			<div class="relative w-full sm:w-72">
				<Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search files by name…"
					bind:value={searchFilter}
					class="h-9 pl-9 text-xs"
				/>
			</div>
		</div>

		<!-- Folder Tabs -->
		<div class="flex flex-wrap gap-1.5">
			{#each currentFolders as folder}
				<button
					type="button"
					onclick={() => onFolderChange(folder.id)}
					class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer {selectedFolder ===
					folder.id
						? 'bg-primary text-primary-foreground shadow-xs'
						: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}"
				>
					{folder.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Media Grid -->
	{#if loading}
		<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center">
			<LoaderCircle class="h-8 w-8 animate-spin text-primary" />
			<p class="mt-3 text-xs font-medium text-foreground">Loading storage assets…</p>
			<p class="text-[11px] text-muted-foreground">Reading files bucket catalog</p>
		</div>
	{:else if filteredFiles.length === 0}
		<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 py-24 text-center">
			<div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<ImageIcon class="h-7 w-7" />
			</div>
			<p class="text-sm font-bold text-foreground">
				{searchFilter ? `No files match "${searchFilter}"` : `No files in "${selectedFolder}" yet`}
			</p>
			<p class="mt-1 max-w-sm text-xs text-muted-foreground">
				Use the "Upload Asset" button above to add product photos, hero banners, or collection imagery.
			</p>
			<Button
				variant="outline"
				size="sm"
				class="mt-4 gap-1.5 text-xs font-bold"
				onclick={() => (showUploadModal = true)}
			>
				<UploadCloud class="h-4 w-4" />
				<span>Upload First File</span>
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
			{#each filteredFiles as file (file.path)}
				<div
					class="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xs transition-all hover:border-primary/50 hover:shadow-md"
				>
					<!-- Thumbnail / Preview -->
					<button
						type="button"
						onclick={() => (previewImage = file)}
						class="relative aspect-square w-full overflow-hidden bg-muted/40 text-left cursor-pointer"
					>
						<img
							src={file.url}
							alt={file.name}
							class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							loading="lazy"
						/>
						<div
							class="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center"
						>
							<span class="rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-bold text-foreground backdrop-blur-xs">
								View
							</span>
						</div>
					</button>

					<!-- File Meta & Quick Actions -->
					<div class="flex flex-col p-2.5 space-y-1.5">
						<p class="truncate text-xs font-bold text-foreground" title={file.name}>
							{file.name}
						</p>

						<div class="flex items-center justify-between text-[10px] text-muted-foreground">
							<span>{(file.size / 1024).toFixed(0)} KB</span>
							{#if file.createdAt}
								<span>{new Date(file.createdAt).toLocaleDateString()}</span>
							{/if}
						</div>

						<!-- Action Icons Bar -->
						<div class="flex items-center justify-between border-t border-border/40 pt-1.5">
							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7 text-muted-foreground hover:text-foreground"
								onclick={() => copyToClipboard(file.url, file.path)}
								title="Copy Public URL"
							>
								{#if copiedPath === file.path}
									<Check class="h-3.5 w-3.5 text-emerald-600" />
								{:else}
									<Copy class="h-3.5 w-3.5" />
								{/if}
							</Button>

							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7 text-muted-foreground hover:text-foreground"
								href={file.url}
								target="_blank"
								rel="noopener noreferrer"
								title="Open in new tab"
							>
								<ExternalLink class="h-3.5 w-3.5" />
							</Button>

							<Button
								variant="ghost"
								size="icon"
								class="h-7 w-7 text-muted-foreground hover:text-destructive"
								onclick={() => deleteFile(file)}
								title="Delete file"
							>
								<Trash2 class="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Upload Modal using ImagePicker -->
<Dialog.Root bind:open={showUploadModal}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<UploadCloud class="h-5 w-5 text-primary" />
				<span>Upload to Storage Bucket</span>
			</Dialog.Title>
			<Dialog.Description>
				Upload a photo or document directly to <code class="font-mono text-xs font-bold text-foreground">{activeBucket}</code> bucket.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 pt-2">
			<div>
				<Label for="upload-target-bucket" class="mb-1.5 block text-xs font-semibold text-muted-foreground">
					Target Storage Bucket
				</Label>
				<Select.Root
					type="single"
					value={activeBucket}
					onValueChange={(val: string) => {
						if (val === 'files' || val === 'product-images') {
							activeBucket = val;
						}
					}}
				>
					<Select.Trigger id="upload-target-bucket" class="w-full text-xs font-medium">
						<span class="truncate">{activeBucketLabel}</span>
					</Select.Trigger>
					<Select.Content>
						{#each uploadBucketOptions as b}
							<Select.Item value={b.value} label={b.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			{#if activeBucket === 'files'}
				<div>
					<Label for="upload-target-folder" class="mb-1.5 block text-xs font-semibold text-muted-foreground">
						Target Folder
					</Label>
					<Select.Root
						type="single"
						value={uploadFolderValue}
						onValueChange={(val: string) => {
							selectedFolder = val;
						}}
					>
						<Select.Trigger id="upload-target-folder" class="w-full text-xs font-medium">
							<span class="truncate">{selectedFolderLabel}</span>
						</Select.Trigger>
						<Select.Content>
							{#each uploadFolderOptions as f}
								<Select.Item value={f.value} label={f.label} />
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}

			<ImagePicker
				name="upload_preview"
				bucket={activeBucket}
				folder={selectedFolder === 'all' ? (activeBucket === 'files' ? 'general' : '') : selectedFolder}
				label="Select File"
				description="Drop an image file or browse from local storage"
				bind:value={uploadedUrl}
				onchange={onUploadComplete}
			/>
		</div>

		<Dialog.Footer class="pt-2">
			<Button variant="outline" size="sm" onclick={() => (showUploadModal = false)}>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Image Lightbox Modal -->
<Dialog.Root open={Boolean(previewImage)} onOpenChange={(open) => { if (!open) previewImage = null; }}>
	{#if previewImage}
		<Dialog.Content class="sm:max-w-3xl">
			<Dialog.Header>
				<Dialog.Title class="truncate text-base font-bold">{previewImage.name}</Dialog.Title>
				<Dialog.Description class="flex items-center gap-2 font-mono text-xs">
					<span>{previewImage.path}</span>
					<span>•</span>
					<span>{(previewImage.size / 1024).toFixed(1)} KB</span>
				</Dialog.Description>
			</Dialog.Header>

			<div class="relative flex max-h-[65vh] items-center justify-center overflow-hidden rounded-xl border border-border bg-black/5 p-2">
				<img
					src={previewImage.url}
					alt={previewImage.name}
					class="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md"
				/>
			</div>

			<div class="flex items-center gap-2 pt-2">
				<Input readonly value={previewImage.url} class="font-mono text-xs" />
				<Button
					size="sm"
					variant="outline"
					class="gap-1.5 shrink-0 text-xs font-bold"
					onclick={() => copyToClipboard(previewImage!.url, previewImage!.path)}
				>
					{#if copiedPath === previewImage.path}
						<Check class="h-3.5 w-3.5 text-emerald-600" />
						<span>Copied</span>
					{:else}
						<Copy class="h-3.5 w-3.5" />
						<span>Copy URL</span>
					{/if}
				</Button>
				<Button
					size="sm"
					variant="outline"
					class="gap-1 shrink-0 text-xs"
					href={previewImage.url}
					target="_blank"
					rel="noopener noreferrer"
				>
					<ExternalLink class="h-3.5 w-3.5" />
					<span>Open</span>
				</Button>
			</div>
		</Dialog.Content>
	{/if}
</Dialog.Root>
