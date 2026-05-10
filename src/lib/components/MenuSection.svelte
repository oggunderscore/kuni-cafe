<script lang="ts">
	import MenuItem from './MenuItem.svelte';

	let { title, items }: {
		title: string;
		items: Array<{
			name: string;
			price: number;
			description?: string;
			note?: string;
		}>;
	} = $props();
</script>

<section class="menu-section">
	<h2 class="section-title">{title}</h2>
	<div class="section-items">
		{#each items as item (item.name)}
			<MenuItem
				name={item.name}
				price={item.price}
				description={item.description}
				note={item.note}
			/>
		{/each}
	</div>
</section>

<style>
	.menu-section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #2d570f;
		margin: 0 0 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #2d570f;
	}

	.section-items {
		display: flex;
		flex-direction: column;
	}

	@media (min-width: 480px) {
		.section-title {
			font-size: 1.375rem;
		}
	}
</style>
