<script lang="ts">
	import type { Order } from '$lib/types';
	import { dndzone } from 'svelte-dnd-action';

	interface SlotGroup {
		id: string;
		label: string;
		items: Order[];
	}

	let slotGroups = $state<SlotGroup[]>([]);
	let loading = $state(true);
	let error = $state('');

	const STATUS_SEQUENCE: Order['status'][] = ['Unpaid', 'Paid', 'Making', 'Made', 'Delivered'];

	const STATUS_COLORS: Record<Order['status'], { bg: string; text: string; border: string }> = {
		Unpaid: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
		Paid: { bg: '#eef2ff', text: '#3730a3', border: '#a5b4fc' },
		Making: { bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
		Made: { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
		Delivered: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' }
	};

	function formatTimeSlotHeader(slotId: string): string {
		const [datePart, timePart] = slotId.split('_');
		if (!datePart || !timePart) return slotId;

		const [year, month, day] = datePart.split('-').map(Number);
		const [hours, minutes] = timePart.split(':').map(Number);

		const date = new Date(year, month - 1, day, hours, minutes);
		const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
		const monthName = date.toLocaleDateString('en-US', { month: 'short' });
		const dayNum = date.getDate();

		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		const displayMinutes = minutes.toString().padStart(2, '0');

		return `${dayName}, ${monthName} ${dayNum} - ${displayHours}:${displayMinutes} ${period}`;
	}

	function buildSlotGroups(orders: Order[]): SlotGroup[] {
		const grouped = new Map<string, Order[]>();

		for (const order of orders) {
			// Skip delivered orders — they go to history
			if (order.status === 'Delivered') continue;
			const slot = order.timeSlot;
			if (!grouped.has(slot)) {
				grouped.set(slot, []);
			}
			grouped.get(slot)!.push(order);
		}

		const sortedSlots = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));

		return sortedSlots.map(([slotId, items]) => ({
			id: slotId,
			label: formatTimeSlotHeader(slotId),
			items: items.sort((a, b) => a.sortOrder - b.sortOrder)
		}));
	}

	function getNextStatus(status: Order['status']): Order['status'] | null {
		const idx = STATUS_SEQUENCE.indexOf(status);
		if (idx < STATUS_SEQUENCE.length - 1) {
			return STATUS_SEQUENCE[idx + 1];
		}
		return null;
	}

	async function fetchOrders() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/admin/orders');
			if (!response.ok) {
				throw new Error('Failed to fetch orders');
			}
			const data = await response.json();
			slotGroups = buildSlotGroups(data.orders);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch orders';
		} finally {
			loading = false;
		}
	}

	async function advanceStatus(orderId: string) {
		try {
			const response = await fetch('/api/admin/orders', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ orderId, action: 'updateStatus' })
			});

			if (response.ok) {
				slotGroups = slotGroups.map((group) => ({
					...group,
					items: group.items.map((o) => {
						if (o.id === orderId) {
							const next = getNextStatus(o.status);
							if (next) return { ...o, status: next };
						}
						return o;
					})
				}));
			}
		} catch (e) {
			console.error('Failed to advance status:', e);
		}
	}

	async function setStatus(orderId: string, newStatus: string) {
		try {
			const response = await fetch('/api/admin/orders', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ orderId, action: 'setStatus', status: newStatus })
			});

			if (response.ok) {
				slotGroups = slotGroups.map((group) => ({
					...group,
					items: group.items.map((o) =>
						o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o
					)
				}));
			}
		} catch (e) {
			console.error('Failed to set status:', e);
		}
	}

	async function persistReorder(orderId: string, sortOrder: number, timeSlot?: string) {
		try {
			const body: Record<string, unknown> = { orderId, action: 'reorder', sortOrder };
			if (timeSlot !== undefined) {
				body.timeSlot = timeSlot;
			}
			await fetch('/api/admin/orders', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
		} catch (e) {
			console.error('Failed to reorder:', e);
		}
	}

	function handleDndConsider(groupIndex: number, e: CustomEvent<{ items: Order[] }>) {
		slotGroups[groupIndex].items = e.detail.items;
	}

	function handleDndFinalize(groupIndex: number, slotId: string, e: CustomEvent<{ items: Order[] }>) {
		const newItems = e.detail.items;
		slotGroups[groupIndex].items = newItems;

		// Persist each item's new position (and time slot if it changed)
		for (let i = 0; i < newItems.length; i++) {
			const item = newItems[i];
			const timeSlotChanged = item.timeSlot !== slotId;
			persistReorder(item.id, i, timeSlotChanged ? slotId : undefined);

			// Update local state to reflect new sortOrder and timeSlot
			newItems[i] = { ...item, sortOrder: i, timeSlot: slotId };
		}

		slotGroups[groupIndex].items = newItems;
	}

	// Fetch orders on mount
	$effect(() => {
		fetchOrders();
	});
</script>

<div class="order-board">
	{#if loading}
		<div class="loading" role="status" aria-live="polite">
			<p>Loading orders...</p>
		</div>
	{:else if error}
		<div class="error-message" role="alert">
			<p>{error}</p>
			<button class="retry-btn" onclick={fetchOrders}>Retry</button>
		</div>
	{:else if slotGroups.length === 0}
		<div class="empty-state">
			<p>No orders yet.</p>
		</div>
	{:else}
		{#each slotGroups as group, groupIndex (group.id)}
			<div class="slot-group">
				<h3 class="slot-header">{group.label}</h3>
				<div
					class="slot-orders"
					use:dndzone={{ items: group.items, dropTargetStyle: { outline: '2px dashed #2d570f', outlineOffset: '2px' } }}
					onconsider={(e) => handleDndConsider(groupIndex, e)}
					onfinalize={(e) => handleDndFinalize(groupIndex, group.id, e)}
				>
					{#each group.items as order (order.id)}
						<div class="order-card" aria-label="Order from {order.firstName} {order.lastName}">
							<div class="order-header">
								<div class="order-name">{order.firstName} {order.lastName}</div>
								<span
									class="status-badge"
									style="background: {STATUS_COLORS[order.status].bg}; color: {STATUS_COLORS[order.status].text}; border: 1px solid {STATUS_COLORS[order.status].border};"
								>
									{order.status}
								</span>
							</div>

							<div class="order-meta">
								<span class="order-id">#{order.shortId || order.id.slice(0, 6).toUpperCase()}</span>
								<span class="order-phone">{order.phone}</span>
							</div>

							<ul class="order-items">
								{#each order.items as item}
									<li>{item.quantity}x {item.name}</li>
									{#if item.customizations}
										<li class="item-customization">
											{item.customizations.iceLevel}, {item.customizations.sugarLevel} sugar
											{#if item.customizations.addOns && item.customizations.addOns.length > 0}
												+ {item.customizations.addOns.join(', ')}
											{/if}
										</li>
									{/if}
								{/each}
							</ul>

							{#if order.comments}
								<div class="order-comments">
									<span class="comments-label">Notes:</span> {order.comments}
								</div>
							{/if}

							{#if getNextStatus(order.status)}
								<button
									class="status-btn"
									onclick={() => advanceStatus(order.id)}
									aria-label="Advance order to {getNextStatus(order.status)}"
								>
									Mark as {getNextStatus(order.status)}
								</button>
							{/if}

							<select
								class="status-dropdown"
								value={order.status}
								onchange={(e) => setStatus(order.id, e.currentTarget.value)}
							>
								{#each STATUS_SEQUENCE as status}
									<option value={status}>{status}</option>
								{/each}
							</select>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.order-board {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.loading,
	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
	}

	.error-message {
		text-align: center;
		padding: 1.5rem;
		background: #fef2f2;
		border: 1px solid #fca5a5;
		border-radius: 0.5rem;
		color: #991b1b;
	}

	.error-message p {
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
		min-width: 44px;
	}

	.retry-btn:hover {
		background: #7f1d1d;
	}

	.slot-group {
		background: #f9fafb;
		border-radius: 0.75rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
	}

	.slot-header {
		font-size: 1rem;
		font-weight: 700;
		color: #2d570f;
		margin: 0 0 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #2d570f;
	}

	.slot-orders {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-height: 3rem;
	}

	.order-card {
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 0.875rem;
		cursor: grab;
		transition: box-shadow 0.15s ease;
	}

	.order-card:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.order-card:active {
		cursor: grabbing;
	}

	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.375rem;
	}

	.order-name {
		font-weight: 600;
		color: #030500;
		font-size: 0.9375rem;
	}

	.status-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		white-space: nowrap;
	}

	.order-meta {
		display: flex;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: #6b7280;
		margin-bottom: 0.5rem;
	}

	.order-id {
		font-family: monospace;
		font-weight: 600;
		color: #2d570f;
	}

	.order-phone {
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.order-items {
		list-style: none;
		padding: 0;
		margin: 0 0 0.5rem;
		font-size: 0.8125rem;
		color: #374151;
	}

	.order-items li {
		padding: 0.125rem 0;
	}

	.item-customization {
		font-size: 0.75rem;
		color: #6b7280;
		font-style: italic;
		padding-left: 1rem;
	}

	.order-comments {
		font-size: 0.8125rem;
		color: #6b7280;
		font-style: italic;
		margin-bottom: 0.5rem;
		padding: 0.375rem 0.5rem;
		background: #f3f4f6;
		border-radius: 0.25rem;
	}

	.comments-label {
		font-weight: 600;
		font-style: normal;
	}

	.status-btn {
		width: 100%;
		padding: 0.5rem;
		background: #2d570f;
		color: #ffffff;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 44px;
		transition: background-color 0.2s ease;
	}

	.status-btn:hover {
		background: #1e3d0a;
	}

	.status-btn:focus-visible {
		outline: 2px solid #2d570f;
		outline-offset: 2px;
	}

	.status-dropdown {
		width: 100%;
		margin-top: 0.375rem;
		padding: 0.375rem 0.5rem;
		border: 1.5px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #374151;
		background: #ffffff;
		cursor: pointer;
		min-height: 32px;
	}

	.status-dropdown:focus {
		outline: none;
		border-color: #1a3f08;
	}

	@media (min-width: 768px) {
		.order-board {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
			gap: 1.5rem;
		}

		.slot-header {
			font-size: 1.0625rem;
		}
	}
</style>
