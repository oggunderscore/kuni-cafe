<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';

	interface MenuItemData {
		id: string;
		name: string;
		price: number;
		cost: number;
		description: string;
		category: string;
		available: boolean;
		isCustom: boolean;
	}

	let items = $state<MenuItemData[]>([]);
	let loading = $state(true);
	let error = $state('');

	// Edit state
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editPrice = $state('');
	let editCost = $state('');
	let editDescription = $state('');

	// Add new item state
	let showAddForm = $state(false);
	let newName = $state('');
	let newPrice = $state('');
	let newCost = $state('');
	let newDescription = $state('');
	let newCategory = $state('drink');

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

	async function setAvailability(itemId: string, available: boolean) {
		try {
			const response = await fetch('/api/admin/menu', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'setAvailability', itemId, available })
			});
			if (response.ok) {
				items = items.map((item) => item.id === itemId ? { ...item, available } : item);
			}
		} catch (e) {
			console.error('Failed to update:', e);
		}
	}

	function startEdit(item: MenuItemData) {
		editingId = item.id;
		editName = item.name;
		editPrice = String(item.price);
		editCost = String(item.cost || 0);
		editDescription = item.description;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit(itemId: string) {
		try {
			const response = await fetch('/api/admin/menu', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'editItem',
					itemId,
					name: editName,
					price: parseFloat(editPrice),
					cost: parseFloat(editCost) || 0,
					description: editDescription
				})
			});
			if (response.ok) {
				items = items.map((item) =>
					item.id === itemId
						? { ...item, name: editName, price: parseFloat(editPrice), cost: parseFloat(editCost) || 0, description: editDescription }
						: item
				);
				editingId = null;
			}
		} catch (e) {
			console.error('Failed to save:', e);
		}
	}

	async function removeItem(itemId: string, isCustom: boolean) {
		if (!confirm('Remove this item from the menu?')) return;
		try {
			const response = await fetch('/api/admin/menu', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'removeItem', itemId, isCustom })
			});
			if (response.ok) {
				items = items.filter((item) => item.id !== itemId);
			}
		} catch (e) {
			console.error('Failed to remove:', e);
		}
	}

	async function addItem() {
		if (!newName || !newPrice) return;
		try {
			const response = await fetch('/api/admin/menu', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'addItem',
					name: newName,
					price: parseFloat(newPrice),
					cost: parseFloat(newCost) || 0,
					description: newDescription,
					category: newCategory
				})
			});
			if (response.ok) {
				const data = await response.json();
				items = [...items, {
					id: data.id,
					name: newName,
					price: parseFloat(newPrice),
					cost: parseFloat(newCost) || 0,
					description: newDescription,
					category: newCategory,
					available: true,
					isCustom: true
				}];
				newName = '';
				newPrice = '';
				newCost = '';
				newDescription = '';
				showAddForm = false;
			}
		} catch (e) {
			console.error('Failed to add:', e);
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

	let groupedItems = $derived(() => {
		const groups = new Map<string, MenuItemData[]>();
		const order = ['drink', 'addon', 'dessert', 'party-dessert'];
		for (const item of items) {
			if (!groups.has(item.category)) groups.set(item.category, []);
			groups.get(item.category)!.push(item);
		}
		return order.filter((cat) => groups.has(cat)).map((cat) => ({
			category: cat,
			label: getCategoryLabel(cat),
			items: groups.get(cat)!
		}));
	});

	async function persistOrder(category: string, orderedIds: string[]) {
		try {
			await fetch('/api/admin/menu', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'reorderItems', category, orderedIds })
			});
		} catch (e) {
			console.error('Failed to save order:', e);
		}
	}

	function handleDndConsider(category: string, e: CustomEvent<{ items: MenuItemData[] }>) {
		const newItems = [...items.filter((i) => i.category !== category), ...e.detail.items];
		items = newItems;
	}

	function handleDndFinalize(category: string, e: CustomEvent<{ items: MenuItemData[] }>) {
		const reordered = e.detail.items;
		const newItems = [...items.filter((i) => i.category !== category), ...reordered];
		items = newItems;
		persistOrder(category, reordered.map((i) => i.id));
	}

	$effect(() => { fetchMenu(); });
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
		<div class="manager-header">
			<button class="add-btn" onclick={() => showAddForm = !showAddForm}>
				{showAddForm ? 'Cancel' : '+ Add Item'}
			</button>
		</div>

		{#if showAddForm}
			<div class="add-form">
				<input class="form-input" bind:value={newName} placeholder="Item name" />
				<input class="form-input" bind:value={newPrice} placeholder="Sell price" type="number" step="0.25" />
				<input class="form-input" bind:value={newCost} placeholder="Cost to make (optional)" type="number" step="0.25" />
				<input class="form-input" bind:value={newDescription} placeholder="Description (optional)" />
				<select class="form-input" bind:value={newCategory}>
					<option value="drink">Drink</option>
					<option value="addon">Add-On</option>
					<option value="dessert">Dessert</option>
					<option value="party-dessert">Party-Sized Dessert</option>
				</select>
				<button class="save-btn" onclick={addItem} disabled={!newName || !newPrice}>Add to Menu</button>
			</div>
		{/if}

		{#each groupedItems() as group (group.category)}
			<div class="category-group">
				<h3 class="category-title">{group.label}</h3>
				<div
					class="items-dnd-zone"
					use:dndzone={{ items: group.items, dropTargetStyle: { outline: '2px dashed #1a3f08', outlineOffset: '2px' } }}
					onconsider={(e) => handleDndConsider(group.category, e)}
					onfinalize={(e) => handleDndFinalize(group.category, e)}
				>
				{#each group.items as item (item.id)}
					<div class="menu-item" class:unavailable={!item.available}>
						{#if editingId === item.id}
							<!-- Edit mode -->
							<div class="edit-form">
								<input class="form-input" bind:value={editName} placeholder="Name" />
								<input class="form-input" bind:value={editPrice} placeholder="Sell price" type="number" step="0.25" />
								<input class="form-input" bind:value={editCost} placeholder="Cost to make" type="number" step="0.25" />
								<input class="form-input" bind:value={editDescription} placeholder="Description" />
								<div class="edit-actions">
									<button class="save-btn" onclick={() => saveEdit(item.id)}>Save</button>
									<button class="cancel-btn" onclick={cancelEdit}>Cancel</button>
								</div>
							</div>
						{:else}
							<!-- Display mode -->
							<div class="item-row">
								<div class="drag-handle" aria-hidden="true">::</div>
								<div class="item-info">
									<span class="item-name">{item.name}</span>
									{#if item.description}
										<span class="item-desc">{item.description}</span>
									{/if}
									<span class="item-price">${item.price.toFixed(2)} {#if item.cost}<span class="item-cost">(cost: ${item.cost.toFixed(2)})</span>{/if}</span>
								</div>
								<div class="item-controls">
									<select
										class="status-select"
										class:available={item.available}
										class:unavailable={!item.available}
										value={item.available ? 'available' : 'unavailable'}
										onchange={(e) => setAvailability(item.id, e.currentTarget.value === 'available')}
									>
										<option value="available">Available</option>
										<option value="unavailable">Out of Stock</option>
									</select>
									<button class="edit-btn" onclick={() => startEdit(item)} aria-label="Edit {item.name}">Edit</button>
									<button class="remove-btn" onclick={() => removeItem(item.id, item.isCustom)} aria-label="Remove {item.name}">Remove</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.menu-manager { width: 100%; }
	.loading-state { text-align: center; color: #6b7280; padding: 2rem; }
	.error-msg { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 0.5rem; padding: 1rem; color: #991b1b; text-align: center; }
	.error-msg p { margin: 0 0 0.75rem; }
	.retry-btn { padding: 0.5rem 1rem; background: #991b1b; color: #fff; border: none; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; min-height: 44px; }

	.manager-header { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
	.add-btn { padding: 0.5rem 1.25rem; background: #1a3f08; color: #fff; border: none; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; min-height: 44px; }
	.add-btn:hover { background: #122d05; }

	.add-form { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; padding: 1rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 0.5rem; }

	.form-input { padding: 0.5rem 0.75rem; border: 1.5px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; min-height: 40px; }
	.form-input:focus { outline: none; border-color: #1a3f08; }

	.save-btn { padding: 0.5rem 1rem; background: #1a3f08; color: #fff; border: none; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; min-height: 40px; }
	.save-btn:hover:not(:disabled) { background: #122d05; }
	.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

	.cancel-btn { padding: 0.5rem 1rem; background: transparent; color: #6b7280; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; min-height: 40px; }

	.category-group { margin-bottom: 1.5rem; }
	.category-title { font-size: 1.125rem; font-weight: 700; color: #1a3f08; margin: 0 0 0.75rem; padding-bottom: 0.375rem; border-bottom: 2px solid #1a3f08; }

	.menu-item { padding: 0.75rem; background: #f0f7ec; border: 1px solid rgba(26, 63, 8, 0.15); border-radius: 0.5rem; margin-bottom: 0.5rem; }
	.menu-item.unavailable { opacity: 0.6; background: #f3f4f6; }

	.item-row { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
	.drag-handle { font-size: 1.25rem; color: #9ca3af; cursor: grab; user-select: none; padding: 0 0.25rem; }
	.drag-handle:active { cursor: grabbing; }
	.item-info { display: flex; flex-direction: column; gap: 0.125rem; flex: 1; min-width: 0; }
	.items-dnd-zone { display: flex; flex-direction: column; gap: 0.5rem; min-height: 2rem; }
	.item-name { font-size: 0.9375rem; font-weight: 500; color: #030500; }
	.item-desc { font-size: 0.8125rem; color: #6b7280; }
	.item-price { font-size: 0.8125rem; font-weight: 600; color: #1a3f08; }
	.item-cost { font-weight: 400; color: #6b7280; font-size: 0.75rem; }

	.item-controls { display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; }

	.status-select { padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; border: 1px solid #d1d5db; cursor: pointer; min-height: 32px; }
	.status-select.available { background: #ecfdf5; color: #065f46; border-color: #6ee7b7; }
	.status-select.unavailable { background: #fef2f2; color: #991b1b; border-color: #fca5a5; }

	.edit-btn { padding: 0.25rem 0.625rem; background: rgba(26, 63, 8, 0.08); color: #1a3f08; border: 1.5px solid #1a3f08; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; min-height: 32px; }
	.edit-btn:hover { background: rgba(26, 63, 8, 0.15); }

	.remove-btn { padding: 0.25rem 0.625rem; background: rgba(220, 38, 38, 0.06); color: #dc2626; border: 1.5px solid #dc2626; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; min-height: 32px; }
	.remove-btn:hover { background: rgba(220, 38, 38, 0.12); }

	.edit-form { display: flex; flex-direction: column; gap: 0.5rem; }
	.edit-actions { display: flex; gap: 0.5rem; }

	@media (max-width: 480px) {
		.item-row { flex-direction: column; align-items: flex-start; }
		.item-controls { width: 100%; justify-content: flex-start; margin-top: 0.5rem; }
	}
</style>
