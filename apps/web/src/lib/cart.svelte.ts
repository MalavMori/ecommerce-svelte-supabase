import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';

// Global reactive cart state using Svelte 5 runes
class CartState {
	count = $state(0);
	isLoading = $state(false);

	setCount(val: number) {
		this.count = val;
	}

	async addItem(variantId: string, quantity = 1, productName?: string) {
		this.isLoading = true;
		try {
			const res = await fetch('/api/cart', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ variantId, quantity })
			});

			const data = await res.json();

			if (!res.ok) {
				if (res.status === 401) {
					const returnUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
					toast.error('Please sign in to add items to your cart', {
						action: {
							label: 'Sign In',
							onClick: () => goto(`/login?redirectTo=${encodeURIComponent(returnUrl)}`)
						}
					});
					return false;
				}
				toast.error(data.message || 'Failed to add item to cart');
				return false;
			}

			this.count = data.cartCount;
			toast.success(productName ? `Added "${productName}" to cart` : 'Item added to cart', {
				action: {
					label: 'View Cart',
					onClick: () => goto('/cart')
				}
			});
			return true;
		} catch (err: any) {
			toast.error(err.message || 'Network error');
			return false;
		} finally {
			this.isLoading = false;
		}
	}
}

export const cartState = new CartState();
