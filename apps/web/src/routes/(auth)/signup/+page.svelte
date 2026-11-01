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
	import User from 'lucide-svelte/icons/user';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { signup } from './auth.remote';

	let signupSuccess = $state(false);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	// Watch for successful signup return value
	$effect(() => {
		if (signup.result && 'success' in signup.result && signup.result.success) {
			signupSuccess = true;
		}
	});
</script>

<svelte:head>
	<title>Create Account — Nexus</title>
	<meta name="description" content="Create your Nexus account to start shopping for the latest tech products." />
</svelte:head>

<div class="space-y-6">
	{#if signupSuccess}
		<!-- Success state -->
		<Card.Root class="relative overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-xl shadow-foreground/5 backdrop-blur-md">
			<div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>

			<Card.Content class="px-6 py-10 sm:px-8 text-center">
				<div class="flex flex-col items-center gap-5">
					<!-- Animated Badge -->
					<div class="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 shadow-inner">
						<CheckCircle2 class="h-8 w-8" />
						<div class="absolute -inset-1 rounded-2xl bg-emerald-500/10 blur-sm -z-10 animate-pulse"></div>
					</div>

					<div class="space-y-2">
						<h2 class="text-2xl font-bold tracking-tight text-foreground">
							Check your inbox
						</h2>
						<p class="mx-auto max-w-[320px] text-sm leading-relaxed text-muted-foreground">
							We sent an activation link to your email address. Click the link inside to verify your account and start shopping.
						</p>
					</div>

					<Alert.Root class="mt-1 border-emerald-500/20 bg-emerald-500/5 text-left text-xs text-muted-foreground">
						<Mail class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
						<div class="ml-2">
							<Alert.Title class="text-xs font-semibold text-foreground">Didn't receive an email?</Alert.Title>
							<Alert.Description class="text-xs text-muted-foreground mt-0.5">
								Be sure to check your spam/junk folder. If it hasn't arrived in a few minutes, you can try signing up again.
							</Alert.Description>
						</div>
					</Alert.Root>

					<div class="w-full pt-2">
						<Button
							href="/login"
							class="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/20"
						>
							<span>Go to Sign In</span>
							<ArrowRight class="ml-2 h-4 w-4" />
						</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- Signup Form Card -->
		<Card.Root class="relative overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-xl shadow-foreground/5 backdrop-blur-md">
			<!-- Top accent gradient -->
			<div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-primary to-accent"></div>

			<!-- Card Header -->
			<Card.Header class="space-y-1.5 px-6 pt-7 pb-4 text-center sm:px-8">
				<Card.Title class="text-2xl font-bold tracking-tight text-foreground">
					Create an account
				</Card.Title>
				<Card.Description class="text-sm text-muted-foreground">
					Join Nexus for exclusive hardware deals & rapid checkout
				</Card.Description>
			</Card.Header>

			<!-- Card Body -->
			<Card.Content class="px-6 pb-6 pt-2 sm:px-8 sm:pb-8">
				<form {...signup}>
					<div class="grid gap-4.5">
						<!-- Global or Email Error Alert -->
						{#if signup.fields.email.issues() && signup.fields.email.issues()?.length}
							<Alert.Root variant="destructive" class="border-destructive/30 bg-destructive/10 text-destructive-foreground">
								<CircleAlert class="h-4 w-4 text-destructive" />
								<div class="ml-2">
									<Alert.Title class="text-xs font-semibold">Registration failed</Alert.Title>
									<Alert.Description class="text-xs text-muted-foreground mt-0.5">
										{signup.fields.email.issues()?.[0]?.message}
									</Alert.Description>
								</div>
							</Alert.Root>
						{/if}

						<!-- Full Name field -->
						<div class="grid gap-2">
							<Label for="signup-name" class="text-xs font-medium text-foreground">Full name</Label>
							<div class="relative">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
									<User class="h-4 w-4" />
								</div>
								<Input
									id="signup-name"
									placeholder="Jane Doe"
									required
									autocomplete="name"
									class="h-10.5 pl-10 rounded-xl transition-all duration-200 focus-visible:ring-primary/25 focus-visible:border-primary"
									{...signup.fields.name.as('text')}
								/>
							</div>
							{#if signup.fields.name.issues() && signup.fields.name.issues()?.length}
								<p class="text-xs font-medium text-destructive">
									{signup.fields.name.issues()?.[0]?.message}
								</p>
							{/if}
						</div>

						<!-- Email field -->
						<div class="grid gap-2">
							<Label for="signup-email" class="text-xs font-medium text-foreground">Email address</Label>
							<div class="relative">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
									<Mail class="h-4 w-4" />
								</div>
								<Input
									id="signup-email"
									placeholder="name@example.com"
									required
									autocomplete="email"
									class="h-10.5 pl-10 rounded-xl transition-all duration-200 focus-visible:ring-primary/25 focus-visible:border-primary"
									{...signup.fields.email.as('email')}
								/>
							</div>
						</div>

						<!-- Password field -->
						<div class="grid gap-2">
							<div class="flex items-center justify-between">
								<Label for="signup-password" class="text-xs font-medium text-foreground">Password</Label>
								<span class="text-[11px] text-muted-foreground">Min. 8 characters</span>
							</div>
							<div class="relative">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
									<Lock class="h-4 w-4" />
								</div>
								<Input
									id="signup-password"
									required
									autocomplete="new-password"
									class="h-10.5 pl-10 pr-10 rounded-xl transition-all duration-200 focus-visible:ring-primary/25 focus-visible:border-primary"
									{...signup.fields.password.as(showPassword ? 'text' : 'password')}
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
							{#if signup.fields.password.issues() && signup.fields.password.issues()?.length}
								<p class="text-xs font-medium text-destructive">
									{signup.fields.password.issues()?.[0]?.message}
								</p>
							{/if}
						</div>

						<!-- Confirm Password field -->
						<div class="grid gap-2">
							<Label for="signup-confirm-password" class="text-xs font-medium text-foreground">Confirm password</Label>
							<div class="relative">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
									<Lock class="h-4 w-4" />
								</div>
								<Input
									id="signup-confirm-password"
									required
									autocomplete="new-password"
									class="h-10.5 pl-10 pr-10 rounded-xl transition-all duration-200 focus-visible:ring-primary/25 focus-visible:border-primary"
									{...signup.fields.confirmPassword.as(showConfirmPassword ? 'text' : 'password')}
								/>
								<button
									type="button"
									onclick={() => (showConfirmPassword = !showConfirmPassword)}
									class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
									aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
									tabindex="-1"
								>
									{#if showConfirmPassword}
										<EyeOff class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
							{#if signup.fields.confirmPassword.issues() && signup.fields.confirmPassword.issues()?.length}
								<p class="text-xs font-medium text-destructive">
									{signup.fields.confirmPassword.issues()?.[0]?.message}
								</p>
							{/if}
						</div>

						<!-- Submit button -->
						<Button
							type="submit"
							size="lg"
							class="mt-2 h-11 w-full rounded-xl font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99]"
							disabled={signup.pending > 0}
						>
							{#if signup.pending > 0}
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
								Creating account…
							{:else}
								Create account
							{/if}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Login link footer -->
		<div class="rounded-xl border border-border/50 bg-card/50 py-3.5 text-center text-xs text-muted-foreground backdrop-blur-xs">
			Already have an account?{' '}
			<a
				href="/login"
				class="font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
			>
				Sign in
			</a>
		</div>
	{/if}
</div>
