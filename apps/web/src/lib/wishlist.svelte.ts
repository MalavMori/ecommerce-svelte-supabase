import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';

class WishlistState {
	productIds = $state<string[]>([]);
	isLoading = $state(false);
	initialized = $state(false);

	async init() {
		if (this.initialized) return;
		try {
			const res = await fetch('/api/wishlist');
			if (res.ok) {
				const data = await res.json();
				this.productIds = data.productIds || [];
				this.initialized = true;
			}
		} catch {
			// ignore on background load
		}
	}

	isWishlisted(productId: string): boolean {
		return this.productIds.includes(productId);
	}

	async toggle(productId: string, productName?: string): Promise<boolean> {
		if (this.isLoading) return false;
		this.isLoading = true;

		// Optimistic update
		const wasWishlisted = this.isWishlisted(productId);
		if (wasWishlisted) {
			this.productIds = this.productIds.filter((id) => id !== productId);
		} else {
			this.productIds = [...this.productIds, productId];
		}

		try {
			const res = await fetch('/api/wishlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productId })
			});

			const data = await res.json();

			if (!res.ok) {
				// Rollback
				if (wasWishlisted) {
					this.productIds = [...this.productIds, productId];
				} else {
					this.productIds = this.productIds.filter((id) => id !== productId);
				}

				if (res.status === 401) {
					toast.error('Please sign in to save items to your wishlist', {
						action: {
							label: 'Sign In',
							onClick: () => goto('/login')
						}
					});
					return false;
				}

				toast.error(data.message || 'Failed to update wishlist');
				return false;
			}

			if (data.action === 'added') {
				toast.success(productName ? `Added "${productName}" to wishlist` : 'Saved to wishlist', {
					action: {
						label: 'View Wishlist',
						onClick: () => goto('/account/wishlist')
					}
				});
			} else {
				toast.info(productName ? `Removed "${productName}" from wishlist` : 'Removed from wishlist');
			}

			return true;
		} catch (err: any) {
			// Rollback
			if (wasWishlisted) {
				this.productIds = [...this.productIds, productId];
			} else {
				this.productIds = this.productIds.filter((id) => id !== productId);
			}
			toast.error(err.message || 'Network error');
			return false;
		} finally {
			this.isLoading = false;
		}
	}
}

export const wishlistState = new WishlistState();
