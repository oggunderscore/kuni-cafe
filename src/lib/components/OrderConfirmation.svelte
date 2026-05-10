<script lang="ts">
	let { orderSummary }: {
		orderSummary: {
			firstName: string;
			lastName: string;
			shortId: string;
			items: Array<{ name: string; quantity: number; price: number }>;
			totalPrice: number;
			timeSlot: { date: string; time: string };
		};
	} = $props();

	function formatPrice(value: number): string {
		return `$${value.toFixed(2)}`;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatTime(time: string): string {
		const [hours, minutes] = time.split(':').map(Number);
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
	}
</script>

<div class="order-confirmation" role="alert" aria-live="polite">
	<h2 class="success-title">Order Submitted</h2>
	<p class="success-message">
		Thank you, {orderSummary.firstName}. Your order has been received.
	</p>

	<div class="payment-section">
		<h3 class="payment-title">Payment Required</h3>
		<p>
			Send <strong>{formatPrice(orderSummary.totalPrice)}</strong> via Zelle or Venmo.
			Include order ID <strong class="order-id">#{orderSummary.shortId}</strong> in the notes.
		</p>

		<div class="payment-details">
			<p><span class="label">Zelle:</span> kunicafe@email.com</p>
			<p><span class="label">Venmo:</span> @kunicafe</p>
		</div>

		<p class="payment-note">
			Orders not paid within 2 hours may be cancelled.
		</p>
	</div>

	<div class="summary-section">
		<h3 class="summary-title">Summary</h3>

		<p class="detail-line">
			<span class="label">Order ID</span>
			<span class="order-id">#{orderSummary.shortId}</span>
		</p>

		<p class="detail-line">
			<span class="label">Pickup</span>
			<span>{formatDate(orderSummary.timeSlot.date)}, {formatTime(orderSummary.timeSlot.time)}</span>
		</p>

		<ul class="items-list">
			{#each orderSummary.items as item (item.name)}
				<li>
					<span>{item.name} x {item.quantity}</span>
					<span>{formatPrice(item.price * item.quantity)}</span>
				</li>
			{/each}
		</ul>

		<p class="total-line">
			<span>Total</span>
			<span>{formatPrice(orderSummary.totalPrice)}</span>
		</p>
	</div>

	<p class="follow-up">See you soon!</p>
</div>

<style>
	.order-confirmation {
		max-width: 32rem;
		margin: 0 auto;
		padding: 1.5rem 0;
	}

	.success-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a3f08;
		margin: 0 0 0.375rem;
	}

	.success-message {
		font-size: 1rem;
		color: #1f2937;
		margin: 0 0 2rem;
	}

	.payment-section {
		margin-bottom: 2rem;
	}

	.payment-title {
		font-size: 1.0625rem;
		font-weight: 600;
		color: #1a3f08;
		margin: 0 0 0.5rem;
	}

	.payment-section p {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: #1f2937;
		margin: 0 0 0.5rem;
	}

	.order-id {
		font-family: monospace;
		font-weight: 700;
		color: #1a3f08;
	}

	.payment-details {
		margin: 0.75rem 0;
	}

	.payment-details p {
		margin: 0.25rem 0;
	}

	.payment-note {
		font-size: 0.8125rem;
		color: #6b7280;
		font-style: italic;
	}

	.summary-section {
		padding-top: 1.5rem;
		border-top: 1px solid rgba(26, 63, 8, 0.15);
	}

	.summary-title {
		font-size: 1.0625rem;
		font-weight: 600;
		color: #1a3f08;
		margin: 0 0 0.75rem;
	}

	.label {
		font-weight: 600;
		color: #374151;
	}

	.detail-line {
		display: flex;
		justify-content: space-between;
		font-size: 0.9375rem;
		color: #1f2937;
		margin: 0 0 0.375rem;
	}

	.items-list {
		list-style: none;
		margin: 0.75rem 0;
		padding: 0;
	}

	.items-list li {
		display: flex;
		justify-content: space-between;
		font-size: 0.9375rem;
		color: #1f2937;
		padding: 0.25rem 0;
	}

	.total-line {
		display: flex;
		justify-content: space-between;
		font-size: 1.0625rem;
		font-weight: 700;
		color: #1a3f08;
		margin: 0.75rem 0 0;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(26, 63, 8, 0.15);
	}

	.follow-up {
		font-size: 0.9375rem;
		color: #6b7280;
		margin: 2rem 0 0;
	}

	@media (min-width: 480px) {
		.success-title {
			font-size: 1.75rem;
		}
	}
</style>
