<script lang="ts">
	import {
		UploadCloud,
		Image as ImageIcon,
		Trash2,
		ExternalLink,
		LoaderCircle,
		FolderOpen,
		Link as LinkIcon,
		RefreshCw,
		CheckCircle2,
		AlertCircle
	} from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import * as Dialog from '@repo/ui/lib/components/ui/dialog/index.js';
	import { toast } from 'svelte-sonner';

	let {
		name = 'image_url',
		field = undefined,
		value = $bindable(''),
		label = '',
		description = '',
		folder = 'general',
		bucket = 'files',
		required = false,
		accept = 'image/jpeg,image/png,image/webp,image/gif,image/avif',
		maxSizeMB = 20,
		class: className = '',
		onchange
	}: {
		name?: string;
		field?: any;
		value?: string;
		label?: string;
		description?: string;
		folder?: string;
		bucket?: string;
		required?: boolean;
		accept?: string;
		maxSizeMB?: number;
		class?: string;
		onchange?: (url: string) => void;
	} = $props();

	let inputName = $derived(field ? field.as('text').name : name);

	let fileInput = $state<HTMLInputElement | null>(null);
	let isDragging = $state(false);
	let isUploading = $state(false);
	let uploadError = $state<string | null>(null);

	// Media library modal
	let showLibraryModal = $state(false);
	let isLoadingLibrary = $state(false);
	let libraryFiles = $state<
		Array<{
			name: string;
			id: string;
			size: number;
			mimetype: string;
			createdAt: string;
			path: string;
			url: string;
		}>
	>([]);

	// Manual URL fallback tab
	let activeTab = $state<'upload' | 'url'>('upload');
	let manualUrlInput = $state('');

	function updateValue(newVal: string) {
		value = newVal;
		onchange?.(newVal);
	}

	async function handleFileUpload(file: File) {
		if (!file) return;

		// Validate size
		if (file.size > maxSizeMB * 1024 * 1024) {
			const msg = `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is ${maxSizeMB}MB.`;
			uploadError = msg;
			toast.error(msg);
			return;
		}

		isUploading = true;
		uploadError = null;

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('folder', folder);
			formData.append('bucket', bucket);

			const res = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				throw new Error(data.error || 'Upload failed');
			}

			updateValue(data.url);
			toast.success('Image uploaded successfully!');
		} catch (err: any) {
			const msg = err.message || 'Upload failed';
			uploadError = msg;
			toast.error(msg);
		} finally {
			isUploading = false;
			if (fileInput) fileInput.value = '';
		}
	}

	function onFileSelected(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			handleFileUpload(target.files[0]);
		}
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			handleFileUpload(e.dataTransfer.files[0]);
		}
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function onDragLeave() {
		isDragging = false;
	}

	function removeImage() {
		updateValue('');
	}

	async function openLibrary() {
		showLibraryModal = true;
		isLoadingLibrary = true;
		try {
			const res = await fetch(
				`/api/upload?folder=${encodeURIComponent(folder)}&bucket=${encodeURIComponent(bucket)}`
			);
			const data = await res.json();
			if (data.success) {
				libraryFiles = data.files || [];
			} else {
				toast.error(data.error || 'Failed to fetch media library');
			}
		} catch (err: any) {
			toast.error(err.message || 'Failed to load media files');
		} finally {
			isLoadingLibrary = false;
		}
	}

	function selectLibraryFile(fileUrl: string) {
		updateValue(fileUrl);
		showLibraryModal = false;
		toast.success('Image selected from library');
	}

	function applyManualUrl() {
		if (manualUrlInput.trim()) {
			updateValue(manualUrlInput.trim());
			manualUrlInput = '';
			activeTab = 'upload';
		}
	}
</script>

<div class="space-y-2 {className}">
	<!-- Optional Label & Description -->
	{#if label}
		<div class="flex items-center justify-between">
			<label for="picker-{name}" class="text-xs font-semibold text-muted-foreground">
				{label}
				{#if required}
					<span class="text-destructive">*</span>
				{/if}
			</label>
			{#if !value}
				<div class="flex items-center gap-1.5 text-[11px]">
					<button
						type="button"
						class="text-xs text-primary hover:underline"
						onclick={() => (activeTab = activeTab === 'upload' ? 'url' : 'upload')}
					>
						{activeTab === 'upload' ? 'Enter URL manually' : 'Upload file'}
					</button>
				</div>
			{/if}
		</div>
	{/if}

	{#if description && !value}
		<p class="text-[11px] text-muted-foreground">{description}</p>
	{/if}

	<!-- Hidden input for standard HTML form submission -->
	<input type="hidden" name={inputName} value={value || ''} {required} />

	<!-- Hidden native file input -->
	<input
		bind:this={fileInput}
		type="file"
		{accept}
		class="hidden"
		onchange={onFileSelected}
	/>

	{#if value}
		<!-- Preview State when image is selected -->
		<div
			class="group relative overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all hover:border-primary/40"
		>
			<div class="relative flex flex-col sm:flex-row items-center gap-4 p-3">
				<!-- Thumbnail Image -->
				<div
					class="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-muted/40"
				>
					<img
						src={value}
						alt="Selected"
						class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						onerror={(e) => {
							// fallback icon if image fails to load
							(e.currentTarget as HTMLElement).style.display = 'none';
						}}
					/>
					<div
						class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 text-muted-foreground"
					>
						<ImageIcon class="h-6 w-6 opacity-30" />
					</div>
				</div>

				<!-- Details & Control Actions -->
				<div class="flex min-w-0 flex-1 flex-col justify-center space-y-1.5 w-full">
					<div class="flex items-center gap-2">
						<span
							class="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
						>
							<CheckCircle2 class="h-3 w-3" />
							Attached
						</span>
						<span class="text-[10px] font-mono text-muted-foreground uppercase">
							{folder}
						</span>
					</div>

					<p
						class="truncate font-mono text-xs text-muted-foreground"
						title={value}
					>
						{value}
					</p>

					<!-- Action Buttons -->
					<div class="flex flex-wrap items-center gap-2 pt-1">
						<Button
							type="button"
							variant="outline"
							size="sm"
							class="h-7 text-xs gap-1.5"
							disabled={isUploading}
							onclick={() => fileInput?.click()}
						>
							<RefreshCw class="h-3 w-3" />
							<span>Replace</span>
						</Button>

						<Button
							type="button"
							variant="outline"
							size="sm"
							class="h-7 text-xs gap-1.5"
							onclick={openLibrary}
						>
							<FolderOpen class="h-3 w-3" />
							<span>Media Library</span>
						</Button>

						<Button
							type="button"
							variant="ghost"
							size="sm"
							class="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
							href={value}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLink class="h-3 w-3" />
							<span>Preview</span>
						</Button>

						<Button
							type="button"
							variant="ghost"
							size="sm"
							class="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1 ml-auto"
							onclick={removeImage}
						>
							<Trash2 class="h-3 w-3" />
							<span>Remove</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	{:else if activeTab === 'upload'}
		<!-- Upload Dropzone (Empty State) -->
		<div
			class="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all {isDragging
				? 'border-primary bg-primary/5 scale-[0.99]'
				: 'border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-muted/30'}"
			ondragover={onDragOver}
			ondragleave={onDragLeave}
			ondrop={onDrop}
			role="region"
			aria-label="File upload dropzone"
		>
			{#if isUploading}
				<div class="flex flex-col items-center justify-center space-y-2 py-4">
					<LoaderCircle class="h-8 w-8 animate-spin text-primary" />
					<p class="text-xs font-semibold text-foreground">Uploading to files bucket…</p>
					<p class="text-[11px] text-muted-foreground">Optimizing and generating secure asset link</p>
				</div>
			{:else}
				<div
					class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
				>
					<UploadCloud class="h-6 w-6" />
				</div>

				<div class="space-y-1">
					<p class="text-xs font-semibold text-foreground">
						Drag & drop your file here, or
						<button
							type="button"
							class="text-primary font-bold hover:underline cursor-pointer ml-1"
							onclick={() => fileInput?.click()}
						>
							browse files
						</button>
					</p>
					<p class="text-[11px] text-muted-foreground">
						Supports PNG, JPG, WebP, GIF, AVIF up to {maxSizeMB}MB
					</p>
				</div>

				<div class="mt-4 flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						class="h-7 text-xs gap-1.5 font-medium"
						onclick={() => fileInput?.click()}
					>
						<UploadCloud class="h-3.5 w-3.5" />
						<span>Choose File</span>
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="sm"
						class="h-7 text-xs gap-1.5 text-muted-foreground"
						onclick={openLibrary}
					>
						<FolderOpen class="h-3.5 w-3.5" />
						<span>Browse Bucket</span>
					</Button>
				</div>
			{/if}

			{#if uploadError}
				<div
					class="mt-3 flex items-center gap-1.5 text-xs font-semibold text-destructive"
				>
					<AlertCircle class="h-3.5 w-3.5 shrink-0" />
					<span>{uploadError}</span>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Manual URL Input Fallback -->
		<div class="flex gap-2">
			<div class="relative flex-1">
				<LinkIcon class="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
				<Input
					bind:value={manualUrlInput}
					placeholder="https://images.unsplash.com/..."
					class="pl-9 text-xs"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							applyManualUrl();
						}
					}}
				/>
			</div>
			<Button
				type="button"
				size="sm"
				class="text-xs font-bold"
				onclick={applyManualUrl}
				disabled={!manualUrlInput.trim()}
			>
				Set URL
			</Button>
		</div>
	{/if}

	{#if field?.issues?.()?.length}
		<div class="text-xs text-destructive">
			{field.issues()?.[0]?.message}
		</div>
	{/if}
</div>

<!-- Media Library Modal -->
<Dialog.Root bind:open={showLibraryModal}>
	<Dialog.Content class="sm:max-w-2xl max-h-[85vh] flex flex-col">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<FolderOpen class="h-4 w-4 text-primary" />
				<span>Media Library — {folder.toUpperCase()}</span>
			</Dialog.Title>
			<Dialog.Description>
				Select a previously uploaded file from the storage bucket, or close to upload a new one.
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex-1 overflow-y-auto py-2">
			{#if isLoadingLibrary}
				<div class="flex flex-col items-center justify-center py-12 space-y-2">
					<LoaderCircle class="h-8 w-8 animate-spin text-primary" />
					<p class="text-xs text-muted-foreground">Loading bucket files…</p>
				</div>
			{:else if libraryFiles.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center"
				>
					<ImageIcon class="h-10 w-10 text-muted-foreground/50 mb-2" />
					<p class="text-xs font-medium text-foreground">No files found in "{folder}"</p>
					<p class="text-[11px] text-muted-foreground mt-0.5">
						Upload a new file using the dropzone to see it listed here.
					</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					{#each libraryFiles as f (f.id || f.name)}
						<button
							type="button"
							class="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-1 text-left transition-all hover:border-primary hover:shadow-md cursor-pointer"
							onclick={() => selectLibraryFile(f.url)}
						>
							<div
								class="relative aspect-square w-full overflow-hidden rounded-lg bg-muted/40"
							>
								<img
									src={f.url}
									alt={f.name}
									class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
								/>
							</div>
							<div class="p-1.5">
								<p class="truncate text-[11px] font-medium text-foreground">{f.name}</p>
								<p class="text-[10px] text-muted-foreground">
									{(f.size / 1024).toFixed(0)} KB
								</p>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<Dialog.Footer class="border-t border-border/40 pt-3">
			<Button
				type="button"
				variant="outline"
				size="sm"
				onclick={() => (showLibraryModal = false)}
			>
				Close
			</Button>
			<Button
				type="button"
				size="sm"
				class="gap-1.5"
				onclick={() => {
					showLibraryModal = false;
					fileInput?.click();
				}}
			>
				<UploadCloud class="h-3.5 w-3.5" />
				<span>Upload New File</span>
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
