import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

// Auto-load vars from wrangler.json if not present in process.env (useful for Cloudflare CI builds)
try {
	const wranglerFile = path.resolve('./wrangler.json');
	if (fs.existsSync(wranglerFile)) {
		const parsed = JSON.parse(fs.readFileSync(wranglerFile, 'utf-8'));
		if (parsed.vars) {
			for (const [key, val] of Object.entries(parsed.vars)) {
				if (!process.env[key] && typeof val === 'string') {
					process.env[key] = val;
				}
			}
		}
	}
} catch {}

export default defineConfig({
	resolve: {
		alias: {
			'$lib': path.resolve('./src/lib')
		}
	},

	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				experimental: { async: true }
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter(),
			experimental: { remoteFunctions: true }
		})
	],
	ssr: {
		noExternal: ['@repo/ui', 'svelte-sonner', 'lucide-svelte', '@lucide/svelte', 'mode-watcher', 'bits-ui', 'formsnap', 'layerchart', 'paneforge', 'sveltekit-superforms', 'vaul-svelte']
	}
});
