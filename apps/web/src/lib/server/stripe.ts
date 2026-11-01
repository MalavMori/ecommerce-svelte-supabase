import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$app/env/private';

let stripeInstance: Stripe | null = null;
let currentKey: string | null = null;

/**
 * Returns a singleton Stripe instance configured for Cloudflare Workers / Pages edge runtime.
 * Uses native Web Fetch API (httpClient: Stripe.createFetchHttpClient()) to avoid Node.js HTTP polyfill overhead.
 */
export function getStripe(secretKey: string): Stripe {
	if (!secretKey) {
		throw new Error('Stripe secret key is required');
	}

	if (!stripeInstance || currentKey !== secretKey) {
		currentKey = secretKey;
		stripeInstance = new Stripe(secretKey, {
			apiVersion: '2024-12-18.acacia' as any,
			httpClient: Stripe.createFetchHttpClient()
		});
	}

	return stripeInstance;
}

/**
 * Converts a decimal monetary amount to the smallest integer currency unit required by Stripe.
 * e.g., 49.99 USD -> 4999 cents, 500 INR -> 50000 paise.
 * Automatically accounts for zero-decimal currencies (JPY, KRW, etc.).
 */
export function formatStripeAmount(amount: number, currency: string = 'INR'): number {
	const zeroDecimalCurrencies = [
		'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
	];
	const upper = currency.toUpperCase();
	if (zeroDecimalCurrencies.includes(upper)) {
		return Math.round(amount);
	}
	return Math.round(amount * 100);
}
