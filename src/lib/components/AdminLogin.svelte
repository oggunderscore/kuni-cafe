<script lang="ts">
	interface Props {
		onLogin: () => void;
	}

	let { onLogin }: Props = $props();

	let username = $state('');
	let password = $state('');
	let error = $state('');
	let isLoading = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		error = '';
		isLoading = true;

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			if (response.ok) {
				onLogin();
			} else if (response.status === 401) {
				error = 'Invalid credentials';
			} else {
				error = 'An error occurred. Please try again.';
			}
		} catch {
			error = 'An error occurred. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="login-container">
	<h1 class="login-title">Admin Login</h1>
	<form class="login-form" onsubmit={handleSubmit}>
		<div class="field">
			<label for="username">Username</label>
			<input
				id="username"
				type="text"
				bind:value={username}
				autocomplete="username"
				required
			/>
		</div>

		<div class="field">
			<label for="password">Password</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				autocomplete="current-password"
				required
			/>
		</div>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<button type="submit" class="submit-btn" disabled={isLoading}>
			{isLoading ? 'Logging in...' : 'Log In'}
		</button>
	</form>
</div>

<style>
	.login-container {
		max-width: 400px;
		margin: 2rem auto;
		padding: 2rem;
		background: #ffffff;
		border-radius: 0.75rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.login-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #2d570f;
		text-align: center;
		margin: 0 0 1.5rem;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.field label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #030500;
	}

	.field input {
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		font-size: 1rem;
		color: #030500;
		min-height: 44px;
	}

	.field input:focus {
		outline: 2px solid #2d570f;
		outline-offset: 1px;
		border-color: #2d570f;
	}

	.error {
		margin: 0;
		padding: 0.75rem;
		background: #fef2f2;
		border: 1px solid #fca5a5;
		border-radius: 0.5rem;
		color: #991b1b;
		font-size: 0.875rem;
		text-align: center;
	}

	.submit-btn {
		padding: 0.75rem 1.5rem;
		background: #2d570f;
		color: #ffffff;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 44px;
		transition: background-color 0.2s ease;
	}

	.submit-btn:hover:not(:disabled) {
		background: #1e3d0a;
	}

	.submit-btn:focus-visible {
		outline: 2px solid #2d570f;
		outline-offset: 2px;
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
