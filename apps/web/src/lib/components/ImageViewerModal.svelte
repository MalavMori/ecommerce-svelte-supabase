<script lang="ts">
	import { 
		X, 
		ChevronLeft, 
		ChevronRight, 
		ZoomIn, 
		ZoomOut, 
		RotateCcw, 
		ExternalLink,
		Sparkles
	} from 'lucide-svelte';

	export interface ViewerImage {
		url: string;
		alt?: string;
		caption?: string;
		subcaption?: string;
		tag?: string;
	}

	let {
		isOpen = $bindable(false),
		images = [],
		initialIndex = 0,
		onClose
	}: {
		isOpen: boolean;
		images: ViewerImage[];
		initialIndex?: number;
		onClose?: (finalIndex: number) => void;
	} = $props();

	let currentIndex = $state(0);
	let zoomScale = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);

	// Sync currentIndex with initialIndex whenever isOpen becomes true
	$effect(() => {
		if (isOpen) {
			currentIndex = Math.max(0, Math.min(initialIndex, Math.max(0, images.length - 1)));
			resetZoom();
		}
	});

	// Body scroll lock
	$effect(() => {
		if (typeof document === 'undefined') return;

		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	});

	const currentImage = $derived(images[currentIndex] || null);

	function resetZoom() {
		zoomScale = 1;
		panX = 0;
		panY = 0;
		isDragging = false;
	}

	function handleZoomIn() {
		zoomScale = Math.min(zoomScale + 0.5, 3.5);
	}

	function handleZoomOut() {
		zoomScale = Math.max(zoomScale - 0.5, 1);
		if (zoomScale === 1) {
			panX = 0;
			panY = 0;
		}
	}

	function toggleZoom(event: MouseEvent) {
		if (zoomScale === 1) {
			zoomScale = 2;
		} else {
			resetZoom();
		}
	}

	function handlePrev() {
		if (images.length <= 1) return;
		currentIndex = (currentIndex - 1 + images.length) % images.length;
		resetZoom();
	}

	function handleNext() {
		if (images.length <= 1) return;
		currentIndex = (currentIndex + 1) % images.length;
		resetZoom();
	}

	function handleClose() {
		const finalIdx = currentIndex;
		isOpen = false;
		resetZoom();
		onClose?.(finalIdx);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) return;

		switch (event.key) {
			case 'Escape':
				event.preventDefault();
				handleClose();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				handlePrev();
				break;
			case 'ArrowRight':
				event.preventDefault();
				handleNext();
				break;
			case '+':
			case '=':
				event.preventDefault();
				handleZoomIn();
				break;
			case '-':
			case '_':
				event.preventDefault();
				handleZoomOut();
				break;
			case '0':
				event.preventDefault();
				resetZoom();
				break;
		}
	}

	function handleMouseDown(event: MouseEvent) {
		if (zoomScale <= 1) return;
		isDragging = true;
		dragStartX = event.clientX - panX;
		dragStartY = event.clientY - panY;
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || zoomScale <= 1) return;
		event.preventDefault();
		panX = event.clientX - dragStartX;
		panY = event.clientY - dragStartY;
	}

	function handleMouseUp() {
		isDragging = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && currentImage}
	<!-- Backdrop & Full-Screen Container -->
	<div
		class="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md text-white select-none transition-all duration-300 animate-in fade-in"
		role="dialog"
		aria-modal="true"
		aria-label="Image lightbox"
	>
		<!-- Top Bar: Image Index, Caption, Controls -->
		<header class="relative z-20 flex items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
			<!-- Image counter & caption preview -->
			<div class="flex items-center gap-3 min-w-0">
				{#if images.length > 1}
					<span class="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 shrink-0">
						{currentIndex + 1} / {images.length}
					</span>
				{/if}

				<div class="min-w-0">
					{#if currentImage.caption}
						<h3 class="text-sm font-semibold text-white/95 truncate">
							{currentImage.caption}
						</h3>
					{/if}
					{#if currentImage.subcaption}
						<p class="text-xs text-white/60 truncate">
							{currentImage.subcaption}
						</p>
					{/if}
				</div>

				{#if currentImage.tag}
					<span class="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
						<Sparkles class="h-3 w-3" />
						{currentImage.tag}
					</span>
				{/if}
			</div>

			<!-- Action Toolbar -->
			<div class="flex items-center gap-1 sm:gap-2 shrink-0">
				<!-- Zoom Out -->
				<button
					type="button"
					onclick={handleZoomOut}
					disabled={zoomScale <= 1}
					aria-label="Zoom out"
					title="Zoom out (-)"
					class="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
				>
					<ZoomOut class="h-4 w-4" />
				</button>

				<!-- Zoom Scale Display -->
				<button
					type="button"
					onclick={resetZoom}
					title="Reset zoom (0)"
					class="px-2 py-1 text-xs font-mono rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
				>
					{Math.round(zoomScale * 100)}%
				</button>

				<!-- Zoom In -->
				<button
					type="button"
					onclick={handleZoomIn}
					disabled={zoomScale >= 3.5}
					aria-label="Zoom in"
					title="Zoom in (+)"
					class="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
				>
					<ZoomIn class="h-4 w-4" />
				</button>

				<!-- Reset Zoom Button -->
				{#if zoomScale > 1}
					<button
						type="button"
						onclick={resetZoom}
						aria-label="Reset zoom"
						title="Reset zoom"
						class="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
					>
						<RotateCcw class="h-4 w-4" />
					</button>
				{/if}

				<!-- Open original in new tab -->
				<a
					href={currentImage.url}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Open original image in new tab"
					title="Open original"
					class="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
				>
					<ExternalLink class="h-4 w-4" />
				</a>

				<div class="h-4 w-[1px] bg-white/20 mx-1"></div>

				<!-- Close Button -->
				<button
					type="button"
					onclick={handleClose}
					aria-label="Close image viewer"
					title="Close (Esc)"
					class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ring-1 ring-white/20"
				>
					<X class="h-5 w-5" />
				</button>
			</div>
		</header>

		<!-- Main Image Stage -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative flex-1 flex items-center justify-center p-4 overflow-hidden"
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
		>
			<!-- Previous Image Button -->
			{#if images.length > 1}
				<button
					type="button"
					onclick={handlePrev}
					aria-label="Previous image"
					title="Previous (Left Arrow)"
					class="absolute left-3 sm:left-6 z-30 h-12 w-12 rounded-full bg-black/60 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-xl cursor-pointer"
				>
					<ChevronLeft class="h-6 w-6" />
				</button>
			{/if}

			<!-- The Displayed Image -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="relative max-h-full max-w-full flex items-center justify-center transition-transform {isDragging ? 'duration-0' : 'duration-200'}"
				style="transform: translate({panX}px, {panY}px) scale({zoomScale}); transform-origin: center center;"
			>
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<img
					src={currentImage.url}
					alt={currentImage.alt || 'Full view image'}
					onclick={toggleZoom}
					class="max-h-[72vh] sm:max-h-[78vh] max-w-[92vw] sm:max-w-[88vw] object-contain rounded-lg shadow-2xl transition-all {zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}"
					draggable="false"
				/>
			</div>

			<!-- Next Image Button -->
			{#if images.length > 1}
				<button
					type="button"
					onclick={handleNext}
					aria-label="Next image"
					title="Next (Right Arrow)"
					class="absolute right-3 sm:right-6 z-30 h-12 w-12 rounded-full bg-black/60 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-xl cursor-pointer"
				>
					<ChevronRight class="h-6 w-6" />
				</button>
			{/if}
		</div>

		<!-- Bottom Thumbnail Strip & Information -->
		<footer class="relative z-20 flex flex-col items-center gap-3 px-4 py-3 bg-gradient-to-t from-black/90 to-transparent">
			{#if images.length > 1}
				<div class="flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1 scrollbar-thin scrollbar-thumb-white/20">
					{#each images as img, idx}
						{@const isSelected = idx === currentIndex}
						<button
							type="button"
							onclick={() => {
								currentIndex = idx;
								resetZoom();
							}}
							aria-label="Go to image {idx + 1}"
							class="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer {isSelected ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-90'}"
						>
							<img src={img.url} alt={img.alt || `Thumbnail ${idx + 1}`} class="h-full w-full object-cover" />
						</button>
					{/each}
				</div>
			{/if}

			<!-- Hint bar -->
			<div class="text-[11px] text-white/50 flex items-center gap-4 text-center">
				<span>Click image to toggle 2x zoom</span>
				<span class="hidden sm:inline">•</span>
				<span class="hidden sm:inline">Use Arrow keys to navigate</span>
				<span class="hidden sm:inline">•</span>
				<span class="hidden sm:inline">Press Esc to exit</span>
			</div>
		</footer>
	</div>
{/if}
