<script lang="ts">
	import { addOns } from '$lib/data/menu';

	export interface CartItem {
		menuItemId: string;
		name: string;
		price: number;
		quantity: number;
		category: string;
		customizations?: {
			addOns: string[]; // add-on IDs
			iceLevel: string;
			sugarLevel: string;
		};
	}

	let { items, cartItems, onCartUpdate }: {
		items: Array<{ id: string; name: string; price: number; category: string; description?: string }>;
		cartItems: CartItem[];
		onCartUpdate: (items: CartItem[]) => void;
	} = $props();

	// Customization popup state
	let showCustomize = $state(false);
	let customizeItem = $state<{ id: string; name: string; price: number; category: string } | null>(null);
	let selectedAddOns = $state<Set<string>>(new Set());
	let iceLevel = $state('Regular');
	let sugarLevel = $state('100%');

	const ICE_OPTIONS = ['Regular', 'Less Ice', 'No Ice'];
	const SUGAR_OPTIONS = ['0%', '25%', '50%', '75%', '100%'];

	// Group items by category (exclude add-ons from main list)
	let groupedItems = $derived(
		items
			.filter((item) => item.category !== 'addon')
			.reduce<Record<string, Array<{ id: string; name: string; price: number; category: string; description?: string }>>>((groups, item) => {
				if (!groups[item.category]) {
					groups[item.category] = [];
				}
				groups[item.category].push(item);
				return groups;
			}, {})
	);

	let categoryOrder = ['drink', 'dessert', 'party-dessert'];

	let sortedCategories = $derived(
		Object.keys(groupedItems).sort((a, b) => {
			const aIndex = categoryOrder.indexOf(a);
			const bIndex = categoryOrder.indexOf(b);
			return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
		})
	);

	function getCategoryLabel(category: string): string {
		switch (category) {
			case 'drink': return 'Drinks';
			case 'dessert': return 'Desserts';
			case 'party-dessert': return 'Party Sized Desserts';
			default: return category;
		}
	}

	function formatPrice(value: number): string {
		return `$${value.toFixed(2)}`;
	}

	function getQuantity(itemId: string): number {
		return cartItems.filter((c) => c.menuItemId === itemId).reduce((sum, c) => sum + c.quantity, 0);
	}

	function openCustomize(item: { id: string; name: string; price: number; category: string }) {
		customizeItem = item;
		selectedAddOns = new Set();
		iceLevel = 'Regular';
		sugarLevel = '100%';
		showCustomize = true;
	}

	function closeCustomize() {
		showCustomize = false;
		customizeItem = null;
	}

	function toggleAddOn(addOnId: string) {
		const newSet = new Set(selectedAddOns);
		if (newSet.has(addOnId)) {
			newSet.delete(addOnId);
		} else {
			newSet.add(addOnId);
		}
		selectedAddOns = newSet;
	}

	function confirmAdd() {
		if (!customizeItem) return;

		// Calculate total price including add-ons
		let totalPrice = customizeItem.price;
		const addOnIds = [...selectedAddOns];
		for (const id of addOnIds) {
			const addon = addOns.find((a) => a.id === id);
			if (addon) totalPrice += addon.price;
		}

		const newItem: CartItem = {
			menuItemId: customizeItem.id,
			name: customizeItem.name,
			price: totalPrice,
			quantity: 1,
			category: customizeItem.category,
			customizations: {
				addOns: addOnIds,
				iceLevel,
				sugarLevel
			}
		};

		onCartUpdate([...cartItems, newItem]);
		closeCustomize();
	}

	function addNonDrink(item: { id: string; name: string; price: number; category: string }) {
		const existing = cartItems.find((c) => c.menuItemId === item.id && !c.customizations);
		if (existing) {
			onCartUpdate(cartItems.map((c) =>
				c === existing ? { ...c, quantity: c.quantity + 1 } : c
			));
		} else {
			onCartUpdate([...cartItems, {
				menuItemId: item.id,
				name: item.name,
				price: item.price,
				quantity: 1,
				category: item.category
			}]);
		}
	}

	function decrementItem(itemId: string) {
		// Find the last cart entry for this item and reduce or remove
		const idx = cartItems.findLastIndex((c) => c.menuItemId === itemId);
		if (idx === -1) return;
		const item = cartItems[idx];
		if (item.quantity > 1) {
			const updated = [...cartItems];
			updated[idx] = { ...item, quantity: item.quantity - 1 };
			onCartUpdate(updated);
		} else {
			onCartUpdate(cartItems.filter((_, i) => i !== idx));
		}
	}
</script>

<div class="order-item-selector" role="group" aria-label="Menu item selection">
	{#each sortedCategories as category (category)}
		<div class="category-group">
			<h3 class="category-header">{getCategoryLabel(category)}</h3>
			<div class="items-list">
				{#each groupedItems[category] as item (item.id)}
					<div class="item-row">
						<div class="item-info">
							<span class="item-name">{item.name}</span>
							{#if item.description}
								<span class="item-description">{item.description}</span>
							{/if}
						</div>
						<span class="item-price">{formatPrice(item.price)}</span>
						<div class="quantity-controls" role="group" aria-label="Quantity for {item.name}">
							<button
								type="button"
								class="qty-button"
								onclick={() => decrementItem(item.id)}
								disabled={getQuantity(item.id) === 0}
								aria-label="Decrease quantity of {item.name}"
							>
								-
							</button>
							<span class="qty-value" aria-live="polite" aria-atomic="true">
								{getQuantity(item.id)}
							</span>
							{#if item.category === 'drink'}
								<button
									type="button"
									class="qty-button"
									onclick={() => openCustomize(item)}
									aria-label="Add {item.name} with customizations"
								>
									+
								</button>
							{:else}
								<button
									type="button"
									class="qty-button"
									onclick={() => addNonDrink(item)}
									aria-label="Increase quantity of {item.name}"
								>
									+
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<!-- Customization Popup -->
{#if showCustomize && customizeItem}
	<div class="overlay" onclick={closeCustomize} role="presentation"></div>
	<div class="customize-popup" role="dialog" aria-modal="true" aria-label="Customize {customizeItem.name}">
		<h3 class="popup-title">{customizeItem.name}</h3>
		<p class="popup-price">{formatPrice(customizeItem.price)}</p>

		<!-- Ice Level -->
		<div class="option-section">
			<h4 class="option-title">Ice Level</h4>
			<div class="option-row">
				{#each ICE_OPTIONS as option}
					<button
						type="button"
						class="option-chip"
						class:selected={iceLevel === option}
						onclick={() => iceLevel = option}
					>
						{option}
					</button>
				{/each}
			</div>
		</div>

		<!-- Sugar Level -->
		<div class="option-section">
			<h4 class="option-title">Sugar Level</h4>
			<div class="option-row">
				{#each SUGAR_OPTIONS as option}
					<button
						type="button"
						class="option-chip"
						class:selected={sugarLevel === option}
						onclick={() => sugarLevel = option}
					>
						{option}
					</button>
				{/each}
			</div>
		</div>

		<!-- Add-Ons -->
		<div class="option-section">
			<h4 class="option-title">Add-Ons</h4>
			{#each addOns as addon (addon.id)}
				<label class="addon-option">
					<input
						type="checkbox"
						checked={selectedAddOns.has(addon.id)}
						onchange={() => toggleAddOn(addon.id)}
					/>
					<span class="addon-name">{addon.name}</span>
					<span class="addon-price">+{formatPrice(addon.price)}</span>
				</label>
			{/each}
		</div>

		<div class="popup-actions">
			<button type="button" class="popup-cancel" onclick={closeCustomize}>Cancel</button>
			<button type="button" class="popup-confirm" onclick={confirmAdd}>Add to Order</button>
		</div>
	</div>
{/if}

<style>
	.order-item-selector { width: 100%; }
	.category-group { margin-bottom: 1.5rem; }
	.category-header { font-size: 1.25rem; font-weight: 700; color: #1a3f08; margin: 0 0 0.625rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(26, 63, 8, 0.2); }
	.items-list { display: flex; flex-direction: column; }

	.item-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0;
		border-bottom: 1px solid rgba(26, 63, 8, 0.06);
	}
	.item-row:last-child { border-bottom: none; }

	.item-info { display: flex; flex-direction: column; gap: 0.125rem; flex: 1; min-width: 0; }
	.item-name { font-size: 0.9375rem; font-weight: 500; color: #030500; }
	.item-description { font-size: 0.8125rem; color: #6b7280; line-height: 1.3; font-style: italic; }

	.item-price {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #1a3f08;
		white-space: nowrap;
		min-width: 3.5rem;
		text-align: right;
	}

	.quantity-controls { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }
	.qty-button { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: 2px solid rgba(26, 63, 8, 0.3); border-radius: 0.375rem; background-color: #ffffff; color: #1a3f08; font-size: 1.25rem; font-weight: 700; cursor: pointer; transition: border-color 0.2s ease, background-color 0.2s ease; user-select: none; }
	.qty-button:hover:not(:disabled) { border-color: #1a3f08; background-color: rgba(26, 63, 8, 0.06); }
	.qty-button:focus-visible { outline: 2px solid #1a3f08; outline-offset: 2px; }
	.qty-button:disabled { opacity: 0.35; cursor: not-allowed; }
	.qty-value { display: flex; align-items: center; justify-content: center; min-width: 1.75rem; font-size: 1rem; font-weight: 600; color: #030500; text-align: center; }

	/* Popup */
	.overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); z-index: 100; animation: fadeIn 0.15s ease; }
	.customize-popup { position: fixed; bottom: 0; left: 0; right: 0; background: #ffffff; border-radius: 1rem 1rem 0 0; padding: 1.5rem; z-index: 101; max-height: 85vh; overflow-y: auto; animation: slideUp 0.2s ease; }
	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
	@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

	.popup-title { font-size: 1.25rem; font-weight: 700; color: #1a3f08; margin: 0 0 0.25rem; }
	.popup-price { font-size: 1rem; color: #374151; margin: 0 0 1.25rem; }

	.option-section { margin-bottom: 1.25rem; }
	.option-title { font-size: 0.8125rem; font-weight: 600; color: #374151; margin: 0 0 0.5rem; text-transform: uppercase; letter-spacing: 0.025em; }

	.option-row { display: flex; flex-wrap: wrap; gap: 0.375rem; }
	.option-chip { padding: 0.5rem 0.875rem; border: 1.5px solid #d1d5db; border-radius: 9999px; background: #ffffff; color: #374151; font-size: 0.8125rem; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
	.option-chip:hover { border-color: #1a3f08; }
	.option-chip.selected { background: #1a3f08; color: #ffffff; border-color: #1a3f08; }

	.addon-option { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; cursor: pointer; border-bottom: 1px solid #f3f4f6; }
	.addon-option:last-child { border-bottom: none; }
	.addon-option input[type="checkbox"] { width: 20px; height: 20px; accent-color: #1a3f08; cursor: pointer; }
	.addon-name { flex: 1; font-size: 0.9375rem; color: #030500; }
	.addon-price { font-size: 0.875rem; font-weight: 600; color: #1a3f08; }

	.popup-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
	.popup-cancel { flex: 1; min-height: 48px; padding: 0.75rem; font-size: 1rem; font-weight: 600; color: #374151; background: transparent; border: 2px solid #d1d5db; border-radius: 0.5rem; cursor: pointer; }
	.popup-cancel:hover { background: #f9fafb; }
	.popup-confirm { flex: 1; min-height: 48px; padding: 0.75rem; font-size: 1rem; font-weight: 600; color: #ffffff; background: #1a3f08; border: none; border-radius: 0.5rem; cursor: pointer; }
	.popup-confirm:hover { background: #122d05; }

	@media (min-width: 480px) {
		.customize-popup { bottom: auto; top: 50%; left: 50%; right: auto; transform: translate(-50%, -50%); border-radius: 1rem; max-width: 420px; width: 90%; animation: popIn 0.2s ease; }
		@keyframes popIn { from { opacity: 0; transform: translate(-50%, -48%); } to { opacity: 1; transform: translate(-50%, -50%); } }
	}
</style>
