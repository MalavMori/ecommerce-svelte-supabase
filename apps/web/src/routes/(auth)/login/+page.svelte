<script lang="ts">
	import * as Card from '@repo/ui/lib/components/ui/card/index.js';
	import * as Alert from '@repo/ui/lib/components/ui/alert/index.js';
	import { Button } from '@repo/ui/lib/components/ui/button/index.js';
	import { Input } from '@repo/ui/lib/components/ui/input/index.js';
	import { Label } from '@repo/ui/lib/components/ui/label/index.js';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import CircleAlert from 'lucide-svelte/icons/circle-alert';
	import Mail from 'lucide-svelte/icons/mail';
	import Lock from 'lucide-svelte/icons/lock';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import { login } from './auth.remote';

	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Sign In — Nexus</title>
	<meta name="description" content="Sign in to your Nexus account to browse products and manage orders." />
</svelte:head>

<div class="space-y-6">
	<Card.Root class="relative overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-xl shadow-foreground/5 backdrop-blur-md">
		<!-- Top brand accent line -->
		<div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/30 via-accent to-primary/30"></div>

		<!-- Card Header -->
		<Card.Header class="space-y-1.5 px-6 pt-7 pb-4 text-center sm:px-8">
			<Card.Title class="text-2xl font-bold tracking-tight text-foreground">
				Welcome back
			</Card.Title>
			<Card.Description class="text-sm text-muted-foreground">
				Enter your credentials to access your account
			</Card.Description>
		</Card.Header>

		<!-- Card Body -->
		<Card.Content class="px-6 pb-6 pt-2 sm:px-8 sm:pb-8">
			<form {...login}>
				<div class="grid gap-5">
					<!-- Error Alert -->
					{#if login.fields.email.issues() && login.fields.email.issues()?.length}
						<Alert.Root variant="destructive" class="border-destructive/30 bg-destructive/10 text-destructive-foreground">
							<CircleAlert class="h-4 w-4 text-destructive" />
							<div class="ml-2">
								<Alert.Title class="text-xs font-semibold">Authentication failed</Alert.Title>
								<Alert.Description class="text-xs text-muted-foreground mt-0.5">
									{login.fields.email.issues()?.[0]?.message}
								</Alert.Description>
							</div>
						</Alert.Root>
					{/if}

					<!-- Email field -->
					<div class="grid gap-2">
						<Label for="login-email" class="text-xs font-medium text-foreground">Email address</Label>
						<div class="relative">
							<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
								<Mail class="h-4 w-4" />
							</div>
							<Input
								id="login-email"
								placeholder="name@example.com"
								required
								autocomplete="email"
								class="h-10.5 pl-10 rounded-xl transition-all duration-200 focus-visible:ring-primary/25 focus-visible:border-primary"
								{...login.fields.email.as('email')}
							/>
						</div>
					</div>

					<!-- Password field -->
					<div class="grid gap-2">
						<div class="flex items-center justify-between">
							<Label for="login-password" class="text-xs font-medium text-foreground">Password</Label>
							<a
								href="/forgot-password"
								class="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
							>
								Forgot password?
							</a>
						</div>
						<div class="relative">
							<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
								<Lock class="h-4 w-4" />
							</div>
							<Input
								id="login-password"
								required
								autocomplete="current-password"
								class="h-10.5 pl-10 pr-10 rounded-xl transition-all duration-200 focus-visible:ring-primary/25 focus-visible:border-primary"
								{...login.fields.password.as(showPassword ? 'text' : 'password')}
							/>
							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
								aria-label={showPassword ? 'Hide password' : 'Show password'}
								tabindex="-1"
							>
								{#if showPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
						{#if login.fields.password.issues() && login.fields.password.issues()?.length}
							<p class="text-xs font-medium text-destructive">
								{login.fields.password.issues()?.[0]?.message}
							</p>
						{/if}
					</div>

					<!-- Submit button -->
					<Button
						type="submit"
						size="lg"
						class="mt-1 h-11 w-full rounded-xl font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99]"
						disabled={login.pending > 0}
					>
						{#if login.pending > 0}
							<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
							Signing in…
						{:else}
							Sign in
						{/if}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Signup link footer -->
	<div class="rounded-xl border border-border/50 bg-card/50 py-3.5 text-center text-xs text-muted-foreground backdrop-blur-xs">
		Don't have an account?{' '}
		<a
			href="/signup"
			class="font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
		>
			Create an account
		</a>
	</div>
</div>
