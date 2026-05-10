<script lang="ts">
	import AdminLogin from '$lib/components/AdminLogin.svelte';
	import OrderBoard from '$lib/components/OrderBoard.svelte';
	import OrderHistory from '$lib/components/OrderHistory.svelte';
	import Analytics from '$lib/components/Analytics.svelte';
	import MenuManager from '$lib/components/MenuManager.svelte';
	import SiteSettings from '$lib/components/SiteSettings.svelte';

	let { data } = $props();
	let isAuthenticated = $state(data.authenticated);
	let activeTab = $state<'orders' | 'history' | 'menu' | 'analytics' | 'settings'>('orders');

	function handleLogin() {
		isAuthenticated = true;
	}

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} catch {
			// Logout locally even if request fails
		}
		isAuthenticated = false;
	}
</script>

{#if !isAuthenticated}
	<AdminLogin onLogin={handleLogin} />
{:else}
	<div class="dashboard">
		<div class="dashboard-header">
			<h1 class="dashboard-title">Admin Dashboard</h1>
			<button class="logout-btn" onclick={handleLogout}>Logout</button>
		</div>

		<nav class="tab-nav" aria-label="Dashboard sections">
			<button
				class="tab-btn"
				class:active={activeTab === 'orders'}
				onclick={() => activeTab = 'orders'}
				aria-pressed={activeTab === 'orders'}
			>
				Orders
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'history'}
				onclick={() => activeTab = 'history'}
				aria-pressed={activeTab === 'history'}
			>
				History
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'menu'}
				onclick={() => activeTab = 'menu'}
				aria-pressed={activeTab === 'menu'}
			>
				Menu
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'analytics'}
				onclick={() => activeTab = 'analytics'}
				aria-pressed={activeTab === 'analytics'}
			>
				Analytics
			</button>
			<button
				class="tab-btn"
				class:active={activeTab === 'settings'}
				onclick={() => activeTab = 'settings'}
				aria-pressed={activeTab === 'settings'}
			>
				Settings
			</button>
		</nav>

		<div class="dashboard-content">
			{#if activeTab === 'orders'}
				<OrderBoard />
			{:else if activeTab === 'history'}
				<OrderHistory />
			{:else if activeTab === 'menu'}
				<MenuManager />
			{:else if activeTab === 'analytics'}
				<Analytics />
			{:else}
				<SiteSettings />
			{/if}
		</div>
	</div>
{/if}

<style>
	.dashboard {
		max-width: 900px;
		margin: 0 auto;
		padding: 1rem;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.dashboard-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #2d570f;
		margin: 0;
	}

	.logout-btn {
		padding: 0.5rem 1.25rem;
		background: transparent;
		color: #991b1b;
		border: 1px solid #991b1b;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 44px;
		min-width: 44px;
		transition: background-color 0.2s ease, color 0.2s ease;
	}

	.logout-btn:hover {
		background: #991b1b;
		color: #ffffff;
	}

	.logout-btn:focus-visible {
		outline: 2px solid #991b1b;
		outline-offset: 2px;
	}

	.tab-nav {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 1.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.tab-btn {
		padding: 0.75rem 1.5rem;
		background: transparent;
		border: none;
		border-bottom: 3px solid transparent;
		font-size: 1rem;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		min-height: 44px;
		transition: color 0.2s ease, border-color 0.2s ease;
		margin-bottom: -2px;
	}

	.tab-btn:hover {
		color: #2d570f;
	}

	.tab-btn.active {
		color: #2d570f;
		font-weight: 600;
		border-bottom-color: #2d570f;
	}

	.tab-btn:focus-visible {
		outline: 2px solid #2d570f;
		outline-offset: 2px;
	}

	.dashboard-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	@media (min-width: 480px) {
		.dashboard-title {
			font-size: 1.75rem;
		}
	}
</style>
