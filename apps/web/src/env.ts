import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		schema: (value) => {
			return value || process.env.PUBLIC_SUPABASE_URL || '';
		}
	},
	PUBLIC_SUPABASE_ANON_KEY: {
		public: true,
		schema: (value) => {
			return value || process.env.PUBLIC_SUPABASE_ANON_KEY || '';
		}
	},
	PUBLIC_STRIPE_PUBLISHABLE_KEY: {
		public: true,
		schema: (value) => {
			return value || process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
		}
	},
	STRIPE_SECRET_KEY: {
		schema: (value) => {
			return value || process.env.STRIPE_SECRET_KEY || '';
		}
	},
	STRIPE_WEBHOOK_SECRET: {
		schema: (value) => {
			return value || process.env.STRIPE_WEBHOOK_SECRET || '';
		}
	},
	SUPABASE_SERVICE_ROLE_KEY: {
		schema: (value) => {
			return value || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
		}
	}
});
