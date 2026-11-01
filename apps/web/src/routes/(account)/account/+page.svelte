<script lang="ts">
	import { enhance } from '$app/forms';
	import { 
		User, 
		Phone, 
		Mail, 
		Save, 
		CheckCircle2, 
		AlertCircle, 
		LoaderCircle, 
		Camera, 
		Upload, 
		Trash2, 
		X 
	} from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Label } from '@repo/ui/lib/components/ui/label/index.js';
	import * as Avatar from '@repo/ui/lib/components/ui/avatar/index.js';

	let { data, form } = $props();

	let isSaving = $state(false);
	let isDeletingAvatar = $state(false);
	let fullName = $state('');
	let phone = $state('');
	let fileInputEl = $state<HTMLInputElement | null>(null);
	let selectedFile = $state<File | null>(null);
	let selectedPreviewUrl = $state<string | null>(null);
	let fileError = $state<string | null>(null);

	$effect(() => {
		fullName = data.profile?.full_name || '';
		phone = data.profile?.phone || '';
	});

	$effect(() => {
		return () => {
			if (selectedPreviewUrl) {
				URL.revokeObjectURL(selectedPreviewUrl);
			}
		};
	});

	const userInitials = $derived(
		fullName.trim()
			? fullName
					.trim()
					.split(' ')
					.map((n: string) => n[0])
					.join('')
					.slice(0, 2)
					.toUpperCase()
			: (data.email?.[0] ?? 'U').toUpperCase()
	);

	const displayAvatarUrl = $derived(
		selectedPreviewUrl || data.profile?.avatar_url || null
	);

	function handleFileSelect(e: Event) {
		fileError = null;
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
		if (!allowedTypes.includes(file.type)) {
			fileError = 'Please select a valid image (JPEG, PNG, WebP, GIF, or AVIF)';
			input.value = '';
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			fileError = 'Image size exceeds 5MB limit. Please choose a smaller file.';
			input.value = '';
			return;
		}

		selectedFile = file;
		if (selectedPreviewUrl) {
			URL.revokeObjectURL(selectedPreviewUrl);
		}
		selectedPreviewUrl = URL.createObjectURL(file);
	}

	function resetFileInput() {
		selectedFile = null;
		fileError = null;
		if (selectedPreviewUrl) {
			URL.revokeObjectURL(selectedPreviewUrl);
			selectedPreviewUrl = null;
		}
		if (fileInputEl) {
			fileInputEl.value = '';
		}
	}
</script>

<svelte:head>
	<title>Profile & Settings — Nexus</title>
</svelte:head>

<div class="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-6">
	<div>
		<h1 class="text-xl sm:text-2xl font-black tracking-tight text-foreground">
			Profile & Account Settings
		</h1>
		<p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
			Manage your personal information, contact phone, and avatar.
		</p>
	</div>

	{#if form?.message}
		<div class="p-4 rounded-2xl {form?.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/10 border border-destructive/20 text-destructive'} text-xs font-semibold flex items-center gap-2">
			{#if form?.success}
				<CheckCircle2 class="h-4 w-4 shrink-0" />
			{:else}
				<AlertCircle class="h-4 w-4 shrink-0" />
			{/if}
			<span>{form.message}</span>
		</div>
	{/if}

	<form
		method="POST"
		action="?/updateProfile"
		enctype="multipart/form-data"
		use:enhance={({ action }) => {
			if (action.search.includes('deleteAvatar')) {
				isDeletingAvatar = true;
			} else {
				isSaving = true;
			}
			return async ({ update, result }) => {
				await update({ reset: false });
				isSaving = false;
				isDeletingAvatar = false;
				if (result.type === 'success') {
					resetFileInput();
				}
			};
		}}
		class="space-y-6 pt-2"
	>
		<!-- Avatar Upload / Management Section -->
		<div class="space-y-3 pb-6 border-b border-border/40">
			<Label class="text-xs font-semibold">Profile Avatar</Label>
			<div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
				<!-- Avatar Preview with Hover Overlay -->
				<div class="relative group shrink-0">
					<Avatar.Root class="h-20 w-20 sm:h-24 sm:w-24 border-2 border-border/80 shadow-md ring-2 ring-primary/10 overflow-hidden">
						{#if displayAvatarUrl}
							<Avatar.Image
								src={displayAvatarUrl}
								alt={fullName || 'User avatar'}
								class="h-full w-full object-cover"
							/>
						{/if}
						<Avatar.Fallback class="bg-primary/10 font-mono text-xl sm:text-2xl font-bold text-primary">
							{userInitials}
						</Avatar.Fallback>
					</Avatar.Root>
					<button
						type="button"
						onclick={() => fileInputEl?.click()}
						class="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer backdrop-blur-[2px]"
						title="Choose new avatar"
					>
						<Camera class="h-5 w-5" />
						<span class="text-[10px] font-semibold">Change</span>
					</button>
				</div>

				<!-- Avatar Actions & Details -->
				<div class="flex-1 space-y-2">
					<div class="flex flex-wrap items-center gap-2.5">
						<!-- Hidden File Input -->
						<input
							bind:this={fileInputEl}
							id="avatar-file-input"
							name="avatarFile"
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
							onchange={handleFileSelect}
							class="hidden"
						/>

						<!-- Upload Button -->
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={() => fileInputEl?.click()}
							class="gap-1.5 text-xs font-semibold h-9"
						>
							<Upload class="h-3.5 w-3.5" />
							<span>{selectedFile ? 'Choose Different File' : 'Upload Image'}</span>
						</Button>

						<!-- Cancel local selection button -->
						{#if selectedFile}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onclick={resetFileInput}
								class="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-9"
							>
								<X class="h-3.5 w-3.5" />
								<span>Cancel</span>
							</Button>
						<!-- Delete existing avatar button -->
						{:else if data.profile?.avatar_url}
							<Button
								type="submit"
								formaction="?/deleteAvatar"
								variant="ghost"
								size="sm"
								disabled={isDeletingAvatar || isSaving}
								class="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-9"
							>
								{#if isDeletingAvatar}
									<LoaderCircle class="h-3.5 w-3.5 animate-spin" />
									<span>Removing...</span>
								{:else}
									<Trash2 class="h-3.5 w-3.5" />
									<span>Remove Avatar</span>
								{/if}
							</Button>
						{/if}
					</div>

					{#if selectedFile}
						<p class="text-xs font-medium text-primary flex items-center gap-1.5">
							<CheckCircle2 class="h-3.5 w-3.5 text-emerald-500 shrink-0" />
							<span class="truncate">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB) — Click "Save Profile" to apply</span>
						</p>
					{/if}

					{#if fileError}
						<p class="text-xs font-medium text-destructive flex items-center gap-1.5">
							<AlertCircle class="h-3.5 w-3.5 shrink-0" />
							<span>{fileError}</span>
						</p>
					{/if}

					<p class="text-[11px] text-muted-foreground">
						Recommended: Square format. JPG, PNG, WebP, GIF, or AVIF up to 5MB.
					</p>
				</div>
			</div>
		</div>

		<!-- Email (Read-only) -->
		<div class="space-y-1.5 max-w-md">
			<Label for="profile-email" class="text-xs font-semibold">Account Email</Label>
			<div class="relative">
				<Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					id="profile-email"
					type="email"
					value={data.email}
					disabled
					class="pl-9 h-10 text-sm bg-muted/40 cursor-not-allowed opacity-75"
				/>
			</div>
			<p class="text-[11px] text-muted-foreground">
				Your email is managed through Supabase authentication.
			</p>
		</div>

		<!-- Full Name -->
		<div class="space-y-1.5 max-w-md">
			<Label for="profile-fullname" class="text-xs font-semibold">Full Name</Label>
			<div class="relative">
				<User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					id="profile-fullname"
					name="fullName"
					type="text"
					placeholder="Alex Morgan"
					bind:value={fullName}
					class="pl-9 h-10 text-sm"
				/>
			</div>
		</div>

		<!-- Phone -->
		<div class="space-y-1.5 max-w-md">
			<Label for="profile-phone" class="text-xs font-semibold">Phone Number</Label>
			<div class="relative">
				<Phone class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					id="profile-phone"
					name="phone"
					type="tel"
					placeholder="+1 (555) 019-2834"
					bind:value={phone}
					class="pl-9 h-10 text-sm"
				/>
			</div>
		</div>

		<div class="pt-4 border-t border-border/40">
			<Button type="submit" disabled={isSaving || isDeletingAvatar} class="font-bold gap-2">
				{#if isSaving}
					<LoaderCircle class="h-4 w-4 animate-spin" />
					<span>Saving Changes...</span>
				{:else}
					<Save class="h-4 w-4" />
					<span>Save Profile</span>
				{/if}
			</Button>
		</div>
	</form>
</div>
