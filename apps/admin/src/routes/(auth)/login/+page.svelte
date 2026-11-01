<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Label } from '@repo/ui/lib/components/ui/label/index.js';
	import { LoaderCircle, ShieldAlert } from 'lucide-svelte';
	import { page } from '$app/state';
	import { login } from './auth.remote';

	let isUnauthorized = $derived(page.url.searchParams.get('unauthorized') === '1');
</script>

<Card.Root class="mx-auto w-full max-w-sm shadow-sm">
	<Card.Header class="space-y-1">
		<Card.Title class="text-2xl font-semibold tracking-tight">Admin Login</Card.Title>
		<Card.Description>Enter your credentials to access the dashboard</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if isUnauthorized}
			<div
				class="mb-4 flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive"
			>
				<ShieldAlert class="h-4 w-4 shrink-0" />
				<span>Access denied. Your account does not have administrator privileges.</span>
			</div>
		{/if}

		<form {...login}>
			<div class="grid gap-4">
				{#if login.fields.email.issues() && login.fields.email.issues()?.length}
					<div
						class="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
					>
						{login.fields.email.issues()?.[0]?.message}
					</div>
				{/if}

				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						placeholder="admin@example.com"
						required
						{...login.fields.email.as('email')}
					/>
				</div>
				<div class="grid gap-2">
					<div class="flex items-center justify-between">
						<Label for="password">Password</Label>
						<a
							href="#"
							class="text-sm text-muted-foreground hover:text-primary hover:underline"
							onclick={(e) => e.preventDefault()}
						>
							Forgot password?
						</a>
					</div>
					<Input id="password" required {...login.fields.password.as('password')} />
					{#if login.fields.password.issues() && login.fields.password.issues()?.length}
						<div class="text-xs text-destructive">
							{login.fields.password.issues()?.[0]?.message}
						</div>
					{/if}
				</div>
				<Button type="submit" class="w-full" disabled={login.pending > 0}>
					{#if login.pending > 0}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Login
				</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
