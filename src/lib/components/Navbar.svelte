<script lang="ts">
	import { page } from '$app/stores';

	let currentPath = $derived($page.url.pathname);

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/menu', label: 'Menu' },
		{ href: '/order', label: 'Order' },
		{ href: '/info', label: 'Info' },
		{ href: '/about', label: 'About' }
	];

	function isActive(href: string): boolean {
		if (href === '/') return currentPath === '/';
		return currentPath === href || currentPath.startsWith(href + '/');
	}
</script>

<nav class="navbar" aria-label="Main navigation">
	<ul class="nav-list">
		{#each navLinks as link}
			<li>
				<a
					href={link.href}
					class="nav-link"
					class:active={isActive(link.href)}
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.navbar {
		width: 100%;
		padding: 0.5rem 0;
		overflow: hidden;
	}

	.nav-list {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.25rem;
		list-style: none;
		margin: 0;
		padding: 0;
		flex-wrap: wrap;
	}

	.nav-link {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 40px;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: #1a3f08;
		transition: background-color 0.2s ease, color 0.2s ease;
		white-space: nowrap;
	}

	.nav-link:hover {
		background-color: rgba(26, 63, 8, 0.1);
	}

	.nav-link:focus-visible {
		outline: 2px solid #1a3f08;
		outline-offset: 2px;
	}

	.nav-link.active {
		background-color: #1a3f08;
		color: #ffffff;
		font-weight: 600;
	}

	@media (min-width: 480px) {
		.nav-list {
			gap: 0.5rem;
		}

		.nav-link {
			padding: 0.625rem 1.25rem;
			font-size: 1rem;
			min-height: 44px;
		}
	}
</style>
