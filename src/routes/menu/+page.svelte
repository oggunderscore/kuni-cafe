<script lang="ts">
	import MenuSection from '$lib/components/MenuSection.svelte';
	import { drinks, addOns, desserts, partySizedDesserts } from '$lib/data/menu';

	const drinkItems = drinks.map((d) => ({
		name: d.name,
		price: d.price,
		description: d.description
	}));

	const addOnItems = addOns.map((a) => ({
		name: a.name,
		price: a.price
	}));

	const dessertItems = desserts.map((d) => ({
		name: d.name,
		price: d.price
	}));

	const partySizedItems = partySizedDesserts.map((d) => ({
		name: d.name,
		price: d.price,
		note: 'Must be ordered 1 week in advance'
	}));
</script>

<svelte:head>
	<title>Menu — Kuni Cafe</title>
</svelte:head>

<div class="menu-page">
	<h1 class="page-title">Menu</h1>

	<p class="drinks-note">All drinks served in 16 oz cups — All drinks come iced</p>

	<MenuSection title="Drinks" items={drinkItems} />
	<MenuSection title="Add-Ons" items={addOnItems} />
	<MenuSection title="Desserts" items={dessertItems} />

	<div class="party-notice">
		<p>Party-sized desserts must be ordered at least 1 week in advance.</p>
	</div>

	<MenuSection title="Party Sized Desserts" items={partySizedItems} />
</div>

<style>
	.menu-page {
		max-width: 600px;
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: #2d570f;
		margin: 0 0 1rem;
		text-align: center;
	}

	.drinks-note {
		text-align: center;
		font-size: 0.9375rem;
		color: #2d570f;
		font-weight: 500;
		background: rgba(45, 87, 15, 0.08);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		margin: 0 0 2rem;
	}

	.party-notice {
		background: rgba(45, 87, 15, 0.08);
		border-left: 3px solid #2d570f;
		border-radius: 0.25rem;
		padding: 0.75rem 1rem;
		margin: 0 0 1rem;
	}

	.party-notice p {
		margin: 0;
		font-size: 0.875rem;
		color: #2d570f;
		font-weight: 500;
	}

	@media (min-width: 480px) {
		.menu-page {
			padding: 2rem 1.5rem;
		}

		.page-title {
			font-size: 2rem;
		}
	}
</style>
