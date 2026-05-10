<script lang="ts">
	import { drinks, addOns, desserts, partySizedDesserts } from '$lib/data/menu';

	interface ItemAnalytics {
		name: string;
		count: number;
		revenue: number;
	}

	interface AnalyticsData {
		totalOrders: number;
		totalRevenue: number;
		itemCounts: Record<string, ItemAnalytics>;
		dateRange: { startDate: string | null; endDate: string | null };
	}

	// Build cost lookup from menu data
	const allMenuItems = [
		...drinks.map((d) => ({ id: d.id, name: d.name, price: d.price, cost: d.cost ?? 0 })),
		...addOns.map((a) => ({ id: a.id, name: a.name, price: a.price, cost: a.cost ?? 0 })),
		...desserts.map((d) => ({ id: d.id, name: d.name, price: d.price, cost: d.cost ?? 0 })),
		...partySizedDesserts.map((d) => ({ id: d.id, name: d.name, price: d.price, cost: d.cost ?? 0 }))
	];
	const costMap = new Map(allMenuItems.map((item) => [item.id, item.cost]));
	const priceMap = new Map(allMenuItems.map((item) => [item.id, item.price]));

	let startDate = $state('');
	let endDate = $state('');
	let loading = $state(false);
	let analyticsData = $state<AnalyticsData | null>(null);
	let error = $state('');

	async function fetchAnalytics() {
		loading = true;
		error = '';
		try {
			const params = new URLSearchParams();
			if (startDate) params.set('startDate', startDate);
			if (endDate) params.set('endDate', endDate);

			const response = await fetch(`/api/admin/analytics?${params.toString()}`);
			if (!response.ok) throw new Error('Failed to fetch analytics');
			analyticsData = await response.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load analytics';
		} finally {
			loading = false;
		}
	}

	function formatCurrency(value: number): string {
		return `$${value.toFixed(2)}`;
	}

	function getProfit(itemId: string, count: number): number {
		const price = priceMap.get(itemId) ?? 0;
		const cost = costMap.get(itemId) ?? 0;
		return (price - cost) * count;
	}

	function getTotalCost(): number {
		if (!analyticsData) return 0;
		let total = 0;
		for (const [itemId, data] of Object.entries(analyticsData.itemCounts)) {
			const cost = costMap.get(itemId) ?? 0;
			total += cost * data.count;
		}
		return total;
	}

	// Fetch on mount
	$effect(() => {
		fetchAnalytics();
	});
</script>

<div class="analytics">
	<div class="date-filters">
		<div class="filter-group">
			<label for="start-date" class="filter-label">Start Date</label>
			<input
				id="start-date"
				type="date"
				class="filter-input"
				bind:value={startDate}
			/>
		</div>
		<div class="filter-group">
			<label for="end-date" class="filter-label">End Date</label>
			<input
				id="end-date"
				type="date"
				class="filter-input"
				bind:value={endDate}
			/>
		</div>
		<button class="filter-btn" onclick={fetchAnalytics} disabled={loading}>
			{loading ? 'Loading...' : 'Apply'}
		</button>
	</div>

	{#if error}
		<div class="error-msg" role="alert">{error}</div>
	{:else if analyticsData}
		<!-- Summary Cards -->
		<div class="summary-cards">
			<div class="card">
				<span class="card-label">Total Orders</span>
				<span class="card-value">{analyticsData.totalOrders}</span>
			</div>
			<div class="card">
				<span class="card-label">Total Revenue</span>
				<span class="card-value">{formatCurrency(analyticsData.totalRevenue)}</span>
			</div>
			<div class="card">
				<span class="card-label">Total Cost</span>
				<span class="card-value">{formatCurrency(getTotalCost())}</span>
			</div>
			<div class="card">
				<span class="card-label">Profit</span>
				<span class="card-value profit">{formatCurrency(analyticsData.totalRevenue - getTotalCost())}</span>
			</div>
		</div>

		<!-- Item Breakdown Table -->
		<div class="table-container">
			<h3 class="table-title">Item Breakdown</h3>
			<table class="analytics-table">
				<thead>
					<tr>
						<th>Item</th>
						<th>Qty Sold</th>
						<th>Revenue</th>
						<th>Cost/Unit</th>
						<th>Total Cost</th>
						<th>Profit</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(analyticsData.itemCounts).sort((a, b) => b[1].count - a[1].count) as [itemId, data]}
						<tr>
							<td class="item-name">{data.name}</td>
							<td class="num">{data.count}</td>
							<td class="num">{formatCurrency(data.revenue)}</td>
							<td class="num">{formatCurrency(costMap.get(itemId) ?? 0)}</td>
							<td class="num">{formatCurrency((costMap.get(itemId) ?? 0) * data.count)}</td>
							<td class="num profit">{formatCurrency(getProfit(itemId, data.count))}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if Object.keys(analyticsData.itemCounts).length === 0}
			<p class="empty-state">No orders found for the selected date range.</p>
		{/if}
	{:else if loading}
		<p class="loading-state">Loading analytics...</p>
	{/if}
</div>

<style>
	.analytics {
		width: 100%;
	}

	.date-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: flex-end;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 140px;
	}

	.filter-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #374151;
	}

	.filter-input {
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		min-height: 44px;
	}

	.filter-input:focus {
		outline: none;
		border-color: #2d570f;
		box-shadow: 0 0 0 2px rgba(45, 87, 15, 0.1);
	}

	.filter-btn {
		padding: 0.5rem 1.25rem;
		background: #2d570f;
		color: #ffffff;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 44px;
		white-space: nowrap;
	}

	.filter-btn:hover:not(:disabled) {
		background: #1e3d0a;
	}

	.filter-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.summary-cards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.card {
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.card-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.card-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #030500;
	}

	.card-value.profit {
		color: #2d570f;
	}

	.table-container {
		overflow-x: auto;
	}

	.table-title {
		font-size: 1rem;
		font-weight: 600;
		color: #2d570f;
		margin: 0 0 0.75rem;
	}

	.analytics-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}

	.analytics-table th {
		text-align: left;
		padding: 0.625rem 0.5rem;
		border-bottom: 2px solid #2d570f;
		font-weight: 600;
		color: #374151;
		white-space: nowrap;
	}

	.analytics-table td {
		padding: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
		color: #030500;
	}

	.analytics-table .item-name {
		font-weight: 500;
	}

	.analytics-table .num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.analytics-table .profit {
		color: #2d570f;
		font-weight: 600;
	}

	.error-msg {
		background: #fef2f2;
		border: 1px solid #fca5a5;
		border-radius: 0.5rem;
		padding: 1rem;
		color: #991b1b;
		font-size: 0.875rem;
	}

	.empty-state,
	.loading-state {
		text-align: center;
		color: #6b7280;
		padding: 2rem;
	}

	@media (min-width: 640px) {
		.summary-cards {
			grid-template-columns: repeat(4, 1fr);
		}

		.analytics-table {
			font-size: 0.875rem;
		}
	}
</style>
