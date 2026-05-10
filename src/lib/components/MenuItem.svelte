<script lang="ts">
	let { name, price, description, note }: {
		name: string;
		price: number;
		description?: string;
		note?: string;
	} = $props();

	function formatPrice(value: number): string {
		return `$${value.toFixed(2)}`;
	}
</script>

<div class="menu-item">
	<div class="item-header">
		<span class="item-name">{name}</span>
		<span class="item-price">{formatPrice(price)}</span>
	</div>
	{#if description}
		<p class="item-description">{description}</p>
	{/if}
	{#if note}
		<p class="item-note">{note}</p>
	{/if}
</div>

<style>
	.menu-item {
		padding: 0.75rem 0;
		border-bottom: 1px solid rgba(45, 87, 15, 0.1);
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
	}

	.item-name {
		font-weight: 500;
		color: #030500;
		font-size: 1rem;
	}

	.item-price {
		font-weight: 600;
		color: #2d570f;
		font-size: 1rem;
		white-space: nowrap;
	}

	.item-description {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: #555;
	}

	.item-note {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: #2d570f;
		font-style: italic;
	}
</style>
