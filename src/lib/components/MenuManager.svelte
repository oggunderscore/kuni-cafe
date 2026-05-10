<script lang="ts">
	interface MenuItemData {
		id: string;
		name: string;
		price: number;
		description?: string;
		category: string;
		available: boolean;
		isPartySized?: boolean;
	}

	let items = $state<MenuItemData[]>([]);
	let loading = $state(true);
	let error = $state('');
	let updating = $state<Set<string>>(new Set());

	async function fetchMenu() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/admin/menu');
			if (!response.ok) throw new Error('Failed to fetch menu');
			const data = await response.json();
			items = data.items;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load menu';
		} finally {
			loading = false;
		}
	}

	async function toggleAvailability(itemId: string, available: boolean) {
		const newUpdating = new Set(updating);
		newUpdating.add(itemId);
		updating = newUpdating;

		try {
			const response = await fetch('/api/admin/menu', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ itemId, available })
			});

			if (response.ok) {
				items = items.map((item) =>
					item.id === itemId ? { ...item, available } : item
				);
			}
		} catch (e) {
			console.error('Failed to update availability:', e);
		} finally {
			const cleared = new Set(updating);
			cleared.delete(itemId);
			updating = cleared;
		}
	}

	function getCategoryLabel(category: string): string {
		switch (category) {
			case 'drink': return 'Drinks';
			case 'addon': return 'Add-Ons';
			case 'dessert': return 'Desserts';
			case 'party-dessert': return 'Party-Sized Desserts';
			default: return category;
		}
	}

	function formatPrice(price: number): string {
		return `$${price.toFixed(2)}`;
	}

	// Group items by category
	let groupedItems = $derived(() => {
		const groups = new Map<string, MenuItemData[]>();
		const order = ['drink', 'addon', 'dessert', 'party-dessert'];

		for (const item of items) {
			if (!groups.has(item.category)) {
				groups.set(item.category, []);
			}
			groups.get(item.category)!.push(item);
		}

		return order
			.filter((cat) => groups.has(cat))
			.map((cat) => ({ category: cat, label: getCategoryLabel(cat), items: groups.get(cat)! }));
	});

	$effect(() => {
		fetchMenu();
	});
</script>

<div class="menu-manager">
	{#if loading}
		<p class="loading-state">Loading menu...</p>
	{:else if error}
		<div class="error-msg" role="alert">
			<p>{error}</p>
			<button class="retry-btn" onclick={fetchMenu}>Retry</button>
		</div>
	{:else}
		<p class="manager-description">Toggle items on/off to mark them as available or out of stock. Changes take effect immediately for customers.</p>

		{#each groupedItems() as group (group.category)}
			<div class="category-group">
				<h3 class="category-title">{group.label}</h3>
				<div class="items-list">
					{#each group.items as item (item.id)}
						<div class="menu-item" class:unavailable={!item.available}>
							<div class="item-info">
								<span class="item-name">{item.name}</span>
								<span class="item-price">{formatPrice(item.price)}</span>
							</div>
							<button
								class="toggle-btn"
								class:available={item.available}
								class:out-of-stock={!item.available}
								disabled={updating.has(item.id)}
								onclick={() => toggleAvailability(item.id, !item.available)}
								aria-label="{item.available ? 'Mark as out of stock' : 'Mark as available'}: {item.name}"
							>
								{#if updating.has(item.id)}
									...
								{:else if item.available}
									Available
								{:else}
									Out of Stock
								{/if}
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.menu-manager {
		width: 100%;
	}

	.loading-state {
		text-align: center;
		color: #6b7280;
		padding: 2rem;
	}

	.error-msg {
		background: #fef2f2;
		border: 1px solid #fca5a5;
		border-radius: 0.5rem;
		padding: 1rem;
		color: #991b1b;
		text-align: center;
	}

	.error-msg p {
		margin: 0 0 0.75rem;
	}

	.retry-btn {
		padding: 0.5rem 1rem;
		background: #991b1b;
		color: #ffffff;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 44px;
	}

	.manager-description {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0 0 1.25rem;
	}

	.category-group {
		margin-bottom: 1.5rem;
	}

	.category-title {
		font-size: 1rem;
		font-weight: 700;
		color: #2d570f;
		margin: 0 0 0.75rem;
		padding-bottom: 0.375rem;
		border-bottom: 2px solid #2d570f;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.menu-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		transition: opacity 0.2s ease;
	}

	.menu-item.unavailable {
		opacity: 0.6;
		background: #f9fafb;
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.item-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #030500;
	}

	.item-price {
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.toggle-btn {
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 36px;
		min-width: 90px;
		border: none;
		transition: background-color 0.2s ease, color 0.2s ease;
	}

	.toggle-btn.available {
		background: #ecfdf5;
		color: #065f46;
		border: 1px solid #6ee7b7;
	}

	.toggle-btn.available:hover {
		background: #d1fae5;
	}

	.toggle-btn.out-of-stock {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}

	.toggle-btn.out-of-stock:hover {
		background: #fee2e2;
	}

	.toggle-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
