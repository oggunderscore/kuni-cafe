<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	// Use the page URL as a key to trigger transitions
	let pageKey = $derived($page.url.pathname);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<title>Kuni Cafe</title>
	<meta name="description" content="Kuni Cafe - Home-based matcha cafe in Rowland Heights" />
</svelte:head>

<div class="app">
	<header class="header">
		<a href="/" class="logo-link" aria-label="Kuni Cafe Home">
			<img src="/images/kuni_logo.jpg" alt="Kuni Cafe logo" class="logo" />
		</a>
		<Navbar />
	</header>

	{#key pageKey}
		<main class="main">
			{@render children()}
		</main>
	{/key}
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
		color: #030500;
		min-height: 100vh;
		overflow-x: hidden;
	}

	/* Global smooth animations */
	:global(a),
	:global(button) {
		transition: all 0.2s ease;
	}

	:global(a:active),
	:global(button:active) {
		transform: scale(0.97);
	}

	.app {
		min-height: 100vh;
		background: #b8d4a8;
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow-x: hidden;
		width: 100%;
	}

	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 960px;
		padding: 1.5rem 1rem 0;
	}

	.logo-link {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		transition: transform 0.2s ease;
	}

	.logo-link:hover {
		transform: scale(1.05);
	}

	.logo {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.main {
		width: 100%;
		max-width: 960px;
		padding: 1rem;
		flex: 1;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (min-width: 480px) {
		.header {
			padding: 2rem 1.5rem 0;
		}

		.logo {
			width: 100px;
			height: 100px;
		}

		.main {
			padding: 1.5rem;
		}
	}

	@media (min-width: 768px) {
		.header {
			padding: 2.5rem 2rem 0;
		}

		.logo {
			width: 120px;
			height: 120px;
		}

		.main {
			padding: 2rem;
		}
	}
</style>
