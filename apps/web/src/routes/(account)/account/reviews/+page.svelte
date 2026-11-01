<script lang="ts">
	import { enhance } from '$app/forms';
	import { Star, Trash2, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-svelte';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import StarRating from '#lib/components/StarRating.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>My Reviews — Nexus</title>
</svelte:head>

<div class="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs space-y-6">
	
	<div class="border-b border-border/40 pb-4">
		<h1 class="text-xl sm:text-2xl font-black tracking-tight text-foreground">
			My Product Reviews
		</h1>
		<p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
			Manage ratings and feedback you've shared with the community.
		</p>
	</div>

	{#if form?.message}
		<div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
			{form.message}
		</div>
	{/if}

	{#if data.reviews.length > 0}
		<div class="space-y-4">
			{#each data.reviews as rev}
				<div class="p-5 rounded-2xl border border-border/60 bg-card space-y-3">
					<div class="flex items-start justify-between gap-4">
						<!-- Product Thumbnail & Title -->
						<div class="flex items-center gap-3">
							<a href="/products/{rev.productSlug}" class="h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-border/40 bg-muted/30 block">
								{#if rev.primaryImage}
									<img src={rev.primaryImage} alt={rev.productName} class="h-full w-full object-cover" />
								{:else}
									<div class="h-full w-full flex items-center justify-center text-muted-foreground">
										<ShoppingBag class="h-4 w-4" />
									</div>
								{/if}
							</a>

							<div>
								<h3 class="font-bold text-sm text-foreground">
									<a href="/products/{rev.productSlug}" class="hover:text-primary transition-colors">
										{rev.productName}
									</a>
								</h3>
								<div class="flex items-center gap-2 mt-0.5">
									<StarRating rating={rev.rating} size="xs" showCount={false} />
									{#if rev.is_verified_purchase}
										<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
											<CheckCircle2 class="h-3 w-3" />
											Verified
										</span>
									{/if}
									<span class="text-xs text-muted-foreground">
										• {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
									</span>
								</div>
							</div>
						</div>

						<!-- Delete Action -->
						<form method="POST" action="?/deleteReview" use:enhance>
							<input type="hidden" name="reviewId" value={rev.id} />
							<button
								type="submit"
								class="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
								aria-label="Delete review"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						</form>
					</div>

					<!-- Review Comment -->
					<p class="text-sm text-foreground/80 leading-relaxed pl-15">
						"{rev.comment}"
					</p>

					<!-- Review Photos -->
					{#if rev.review_images && rev.review_images.length > 0}
						<div class="flex items-center gap-2 pl-15 pt-1 flex-wrap">
							{#each rev.review_images as img}
								<a
									href={img.url}
									target="_blank"
									rel="noopener noreferrer"
									class="relative h-14 w-14 rounded-xl overflow-hidden border border-border/80 hover:border-primary transition-all group/img"
								>
									<img src={img.url} alt="Review attachment" class="h-full w-full object-cover group-hover/img:scale-105 transition-transform" />
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center p-12 border border-dashed rounded-3xl space-y-3">
			<div class="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mx-auto">
				<Star class="h-6 w-6 stroke-[1.5]" />
			</div>
			<div class="space-y-1">
				<h3 class="text-base font-bold text-foreground">No reviews written yet</h3>
				<p class="text-xs text-muted-foreground max-w-xs mx-auto">
					Share your experience with hardware you've purchased on any product page.
				</p>
			</div>
			<Button size="sm" href="/products" class="mt-2 font-bold">
				<span>Browse Products to Review</span>
				<ArrowRight class="h-4 w-4 ml-1" />
			</Button>
		</div>
	{/if}

</div>
