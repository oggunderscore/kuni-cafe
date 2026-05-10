<script lang="ts">
	import type { Order } from '$lib/types';

	let orders = $state<Order[]>([]);
	let loading = $state(true);
	let error = $state('');

	function formatTimeSlot(slotId: string): string {
		const [datePart, timePart] = slotId.split('_');
		if (!datePart || !timePart) return slotId;
		const [year, month, day] = datePart.split('-').map(Number);
		const [hours, minutes] = timePart.split(':').map(Number);
		const date = new Date(year, month - 1, day);
		const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		return `${dayName}, ${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
	}

	async function fetchOrders() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/admin/orders');
			if (!response.ok) throw new Error('Failed to fetch orders');
			const data = await response.json();
			// Only show delivered orders, most recent first
			orders = data.orders
				.filter((o: Order) => o.status === 'Delivered')
				.reverse();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch orders';
		} finally {
			loading = false;
		}
	}

	$effect(() => { fetchOrders(); });
</script>

<div class="order-history">
	{#if loading}
		<p class="loading-state">Loading order history...</p>
	{:else if error}
		<div class="error-msg" role="alert">
			<p>{error}</p>
			<button class="retry-btn" onclick={fetchOrders}>Retry</button>
		</div>
	{:else if orders.length === 0}
		<p class="empty-state">No delivered orders yet.</p>
	{:else}
		<p class="count">{orders.length} delivered order{orders.length !== 1 ? 's' : ''}</p>
		<div class="history-list">
			{#each orders as order (order.id)}
				<div class="history-item">
					<div class="history-header">
						<span class="history-id">#{order.shortId || order.id.slice(0, 4)}</span>
						<span class="history-name">{order.firstName} {order.lastName}</span>
						<span class="history-slot">{formatTimeSlot(order.timeSlot)}</span>
					</div>
					<div class="history-details">
						<span class="history-phone">{order.phone}</span>
						<span class="history-total">${order.totalPrice.toFixed(2)}</span>
					</div>
					<ul class="history-items">
						{#each order.items as item}
							<li>{item.quantity}x {item.name}</li>
						{/each}
					</ul>
					{#if order.comments}
						<p class="history-comments">{order.comments}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.order-history { width: 100%; }
	.loading-state, .empty-state { text-align: center; color: #6b7280; padding: 2rem; }
	.error-msg { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 0.5rem; padding: 1rem; color: #991b1b; text-align: center; }
	.error-msg p { margin: 0 0 0.75rem; }
	.retry-btn { padding: 0.5rem 1rem; background: #991b1b; color: #fff; border: none; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; min-height: 44px; }

	.count { font-size: 0.875rem; color: #6b7280; margin: 0 0 1rem; }

	.history-list { display: flex; flex-direction: column; gap: 0.75rem; }

	.history-item {
		padding: 0.875rem;
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
	}

	.history-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.375rem;
	}

	.history-id {
		font-family: monospace;
		font-weight: 700;
		color: #1a3f08;
		font-size: 0.875rem;
	}

	.history-name {
		font-weight: 600;
		color: #030500;
		font-size: 0.9375rem;
	}

	.history-slot {
		margin-left: auto;
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.history-details {
		display: flex;
		gap: 1rem;
		font-size: 0.8125rem;
		color: #6b7280;
		margin-bottom: 0.375rem;
	}

	.history-total {
		font-weight: 600;
		color: #1a3f08;
	}

	.history-items {
		list-style: none;
		padding: 0;
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: #374151;
	}

	.history-items li { padding: 0.125rem 0; }

	.history-comments {
		font-size: 0.8125rem;
		color: #6b7280;
		font-style: italic;
		margin: 0.375rem 0 0;
	}
</style>
