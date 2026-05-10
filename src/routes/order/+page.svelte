<script lang="ts">
	import TimeSlotPicker from '$lib/components/TimeSlotPicker.svelte';
	import OrderItemSelector from '$lib/components/OrderItemSelector.svelte';
	import OrderConfirmation from '$lib/components/OrderConfirmation.svelte';
	import { drinks, addOns, desserts, partySizedDesserts } from '$lib/data/menu';
	import { validateOrderSubmission } from '$lib/validation';
	import { generateTimeSlots, filterSlotsForPartyDessert } from '$lib/timeslots';
	import type { TimeSlot, OrderSubmission } from '$lib/types';

	// Build flat menu items array with category field
	const allMenuItems = [
		...drinks.map((d) => ({ id: d.id, name: d.name, price: d.price, category: 'drink', description: d.description })),
		...addOns.map((a) => ({ id: a.id, name: a.name, price: a.price, category: 'addon', description: a.description ?? '' })),
		...desserts.map((d) => ({ id: d.id, name: d.name, price: d.price, category: 'dessert', description: d.description ?? '' })),
		...partySizedDesserts.map((d) => ({ id: d.id, name: d.name, price: d.price, category: 'party-dessert', description: d.description ?? '' }))
	];

	// Party-sized dessert IDs for detection
	const partySizedIds = new Set(partySizedDesserts.map((d) => d.id));

	// Availability state
	let unavailableIds = $state<Set<string>>(new Set());

	// Site settings (announcement + blocked dates)
	let announcement = $state('');
	let blockedDates = $state<Set<string>>(new Set());

	// Inline validation
	let phoneError = $state('');

	// Form state
	let firstName = $state('');
	let lastName = $state('');
	let phone = $state('');
	let comments = $state('');
	let selectedItems = $state(new Map<string, number>());
	let selectedSlotId = $state('');
	let errors = $state<string[]>([]);
	let submitting = $state(false);
	let submitted = $state(false);
	let reviewing = $state(false);
	let orderSummary = $state<{
		firstName: string;
		lastName: string;
		shortId: string;
		items: Array<{ name: string; quantity: number; price: number }>;
		totalPrice: number;
		timeSlot: { date: string; time: string };
	} | null>(null);

	// Fetch availability on mount
	async function fetchAvailability() {
		try {
			const response = await fetch('/api/menu/availability');
			if (response.ok) {
				const data = await response.json();
				const ids = new Set<string>();
				for (const [id, available] of Object.entries(data.availability)) {
					if (available === false) ids.add(id);
				}
				unavailableIds = ids;
			}
		} catch {
			// Silently fail — treat all as available
		}
	}

	async function fetchSettings() {
		try {
			const response = await fetch('/api/settings');
			if (response.ok) {
				const data = await response.json();
				announcement = data.announcement ?? '';
				blockedDates = new Set(data.blockedDates ?? []);
			}
		} catch {
			// Silently fail
		}
	}

	$effect(() => {
		fetchAvailability();
		fetchSettings();
	});

	// Available menu items (filtered by availability)
	let availableMenuItems = $derived(
		allMenuItems.filter((item) => !unavailableIds.has(item.id))
	);

	// Detect if any party-sized dessert is selected
	let hasPartyDessert = $derived(() => {
		for (const [itemId, qty] of selectedItems) {
			if (qty > 0 && partySizedIds.has(itemId)) return true;
		}
		return false;
	});

	// Generate time slots client-side and filter based on party dessert selection and blocked dates
	let availableSlots = $derived(() => {
		let allSlots = generateTimeSlots(new Date());
		// Remove slots on blocked dates
		if (blockedDates.size > 0) {
			allSlots = allSlots.filter((slot) => !blockedDates.has(slot.date));
		}
		if (hasPartyDessert()) {
			return filterSlotsForPartyDessert(allSlots);
		}
		return allSlots;
	});

	// Clear selected slot if it's no longer in available slots
	$effect(() => {
		const slots = availableSlots();
		if (selectedSlotId && !slots.find((s: TimeSlot) => s.id === selectedSlotId)) {
			selectedSlotId = '';
		}
	});

	function validatePhone(value: string) {
		if (!value.trim()) {
			phoneError = '';
			return;
		}
		const digits = value.replace(/[^\d]/g, '');
		if (digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))) {
			phoneError = '';
		} else {
			phoneError = 'Please enter a valid 10-digit phone number';
		}
	}

	function handleItemUpdate(itemId: string, quantity: number) {
		const newMap = new Map(selectedItems);
		if (quantity <= 0) {
			newMap.delete(itemId);
		} else {
			newMap.set(itemId, quantity);
		}
		selectedItems = newMap;
	}

	function handleSlotSelect(slotId: string) {
		selectedSlotId = slotId;
	}

	function getSelectedSlot(): TimeSlot | undefined {
		return availableSlots().find((s: TimeSlot) => s.id === selectedSlotId);
	}

	async function handleReview() {
		errors = [];

		// Re-check availability before reviewing
		await fetchAvailability();

		// Build items array for submission
		const items = Array.from(selectedItems.entries())
			.filter(([, qty]) => qty > 0)
			.map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

		// Check if any selected items are now unavailable
		const nowUnavailable = items.filter((item) => unavailableIds.has(item.menuItemId));
		if (nowUnavailable.length > 0) {
			const names = nowUnavailable.map((item) => {
				const menuItem = allMenuItems.find((m) => m.id === item.menuItemId);
				return menuItem?.name ?? item.menuItemId;
			});
			errors = names.map((name) => `"${name}" is no longer available. Please remove it from your order.`);
			return;
		}

		const submission: OrderSubmission = {
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			phone: phone.trim(),
			items,
			timeSlot: selectedSlotId,
			comments: comments.trim() || undefined
		};

		// Get slot date for validation
		const slot = getSelectedSlot();
		const slotDate = slot?.date;

		// Validate
		const result = validateOrderSubmission(submission, slotDate);
		if (!result.valid) {
			errors = result.errors;
			return;
		}

		// Show review step
		reviewing = true;
	}

	function handleBackToEdit() {
		reviewing = false;
	}

	// Build review data
	let reviewItems = $derived(() => {
		return Array.from(selectedItems.entries())
			.filter(([, qty]) => qty > 0)
			.map(([itemId, quantity]) => {
				const menuItem = allMenuItems.find((m) => m.id === itemId);
				return {
					name: menuItem?.name ?? itemId,
					quantity,
					price: menuItem?.price ?? 0
				};
			});
	});

	let reviewTotal = $derived(() => {
		return reviewItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
	});

	function formatReviewDate(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
	}

	function formatReviewTime(time: string): string {
		const [hours, minutes] = time.split(':').map(Number);
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
	}

	async function handleConfirmOrder() {
		errors = [];
		submitting = true;

		const items = Array.from(selectedItems.entries())
			.filter(([, qty]) => qty > 0)
			.map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

		const submission: OrderSubmission = {
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			phone: phone.trim(),
			items,
			timeSlot: selectedSlotId,
			comments: comments.trim() || undefined
		};

		const slot = getSelectedSlot();

		try {
			const response = await fetch('/api/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(submission)
			});

			if (response.ok) {
				const data = await response.json();

				const summaryItems = reviewItems();
				const totalPrice = reviewTotal();

				orderSummary = {
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					shortId: data.shortId,
					items: summaryItems,
					totalPrice,
					timeSlot: {
						date: slot!.date,
						time: slot!.time
					}
				};

				submitted = true;
				reviewing = false;
			} else if (response.status === 400) {
				const data = await response.json();
				errors = data.errors ?? ['There was a problem with your order. Please check your details.'];
				reviewing = false;
			} else if (response.status === 500) {
				const data = await response.json().catch(() => ({}));
				errors = [data.message ?? 'Something went wrong on our end. Please try again or contact us on Instagram.'];
				reviewing = false;
			} else {
				errors = ['Something went wrong. Please try again.'];
				reviewing = false;
			}
		} catch (err) {
			errors = ['Network error. Please check your connection and try again.'];
			reviewing = false;
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Place Order | Kuni Cafe</title>
</svelte:head>

<div class="order-page">
	{#if submitted && orderSummary}
		<OrderConfirmation {orderSummary} />
	{:else if reviewing}
		<!-- Order Review Step -->
		<h1 class="page-title">Review Your Order</h1>
		<p class="page-subtitle">Please double-check everything before confirming.</p>

		{#if errors.length > 0}
			<div class="error-container" role="alert" aria-live="assertive">
				<ul class="error-list">
					{#each errors as error}
						<li class="error-item">{error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="review-card">
			<div class="review-section">
				<span class="review-label">Name</span>
				<span class="review-value">{firstName.trim()} {lastName.trim()}</span>
			</div>

			<div class="review-section">
				<span class="review-label">Phone</span>
				<span class="review-value">{phone.trim()}</span>
			</div>

			<div class="review-section">
				<span class="review-label">Pickup Time</span>
				<span class="review-value">
					{#if getSelectedSlot()}
						{formatReviewDate(getSelectedSlot()!.date)}, {formatReviewTime(getSelectedSlot()!.time)}
					{/if}
				</span>
			</div>

			<div class="review-section">
				<span class="review-label">Items</span>
				<ul class="review-items-list">
					{#each reviewItems() as item}
						<li class="review-item">
							<span>{item.name} × {item.quantity}</span>
							<span class="review-item-price">${(item.price * item.quantity).toFixed(2)}</span>
						</li>
					{/each}
				</ul>
			</div>

			{#if comments.trim()}
				<div class="review-section">
					<span class="review-label">Special Requests</span>
					<span class="review-value">{comments.trim()}</span>
				</div>
			{/if}

			<div class="review-total">
				<span class="review-total-label">Total</span>
				<span class="review-total-value">${reviewTotal().toFixed(2)}</span>
			</div>
		</div>

		<div class="review-actions">
			<button class="back-button" onclick={handleBackToEdit} type="button">
				← Edit Order
			</button>
			<button
				class="confirm-button"
				onclick={handleConfirmOrder}
				disabled={submitting}
				type="button"
			>
				{#if submitting}
					Placing Order...
				{:else}
					Confirm & Place Order
				{/if}
			</button>
		</div>
	{:else}
		<h1 class="page-title">Place Your Order</h1>
		<p class="page-subtitle">Select your items, choose a pickup time, and we'll have everything ready for you.</p>

		{#if announcement}
			<div class="announcement-banner" role="alert">
				<p>{announcement}</p>
			</div>
		{/if}

		{#if errors.length > 0}
			<div class="error-container" role="alert" aria-live="assertive">
				<ul class="error-list">
					{#each errors as error}
						<li class="error-item">{error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleReview(); }} novalidate>
			<!-- Customer Info Section -->
			<section class="form-section">
				<h2 class="section-title">Your Information</h2>

				<div class="form-field">
					<label for="first-name" class="form-label">First Name</label>
					<input
						id="first-name"
						type="text"
						class="form-input"
						bind:value={firstName}
						placeholder="First name"
						required
						aria-required="true"
					/>
				</div>

				<div class="form-field">
					<label for="last-name" class="form-label">Last Name</label>
					<input
						id="last-name"
						type="text"
						class="form-input"
						bind:value={lastName}
						placeholder="Last name"
						required
						aria-required="true"
					/>
				</div>

				<div class="form-field">
					<label for="phone" class="form-label">Phone Number</label>
					<input
						id="phone"
						type="tel"
						class="form-input"
						class:input-error={phoneError !== ''}
						bind:value={phone}
						oninput={() => validatePhone(phone)}
						placeholder="555-123-4567"
						required
						aria-required="true"
						aria-describedby={phoneError ? 'phone-error' : undefined}
					/>
					{#if phoneError}
						<span id="phone-error" class="field-error">{phoneError}</span>
					{/if}
				</div>
			</section>

			<!-- Item Selection Section -->
			<section class="form-section">
				<h2 class="section-title">Select Items</h2>
				<OrderItemSelector
					items={availableMenuItems}
					{selectedItems}
					onUpdate={handleItemUpdate}
				/>
			</section>

			<!-- Party Dessert Warning -->
			{#if hasPartyDessert()}
				<div class="advance-notice-warning" role="alert" aria-live="polite">
					<span class="warning-icon" aria-hidden="true">*</span>
					<p class="warning-text">
						Party-sized desserts require at least <strong>7 days advance notice</strong>. 
						Only pickup times 7+ days from today are shown below.
					</p>
				</div>
			{/if}

			<!-- Time Slot Selection Section -->
			<section class="form-section">
				<h2 class="section-title">Choose Pickup Time</h2>
				<TimeSlotPicker
					slots={availableSlots()}
					{selectedSlotId}
					onSelect={handleSlotSelect}
				/>
			</section>

			<!-- Comments Section -->
			<section class="form-section">
				<h2 class="section-title">Special Requests</h2>
				<div class="form-field">
					<label for="comments" class="form-label">Comments (optional)</label>
					<textarea
						id="comments"
						class="form-input form-textarea"
						bind:value={comments}
						placeholder="Any special requests or notes for your order..."
						rows="3"
					></textarea>
				</div>
			</section>

			<!-- Submit Button -->
			<div class="submit-section">
				<button
					type="submit"
					class="submit-button"
					disabled={submitting}
				>
					Review Order
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.order-page {
		width: 100%;
		max-width: 40rem;
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a3f08;
		margin: 0 0 0.5rem;
	}

	.page-subtitle {
		font-size: 0.9375rem;
		color: #555;
		margin: 0 0 1.5rem;
		line-height: 1.4;
	}

	.announcement-banner {
		padding: 0.75rem 1rem;
		margin-bottom: 1.25rem;
		border-radius: 0.5rem;
		background: #fefce8;
		border: 1.5px solid #ca8a04;
	}

	.announcement-banner p {
		margin: 0;
		font-size: 0.9375rem;
		color: #854d0e;
		line-height: 1.5;
		font-weight: 500;
	}

	.error-container {
		background-color: #fef2f2;
		border: 1px solid #fca5a5;
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		margin-bottom: 1.25rem;
	}

	.error-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.error-item {
		font-size: 0.875rem;
		color: #991b1b;
		padding: 0.125rem 0;
	}

	.error-item::before {
		content: '• ';
	}

	.form-section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1.375rem;
		font-weight: 700;
		color: #1a3f08;
		margin: 0 0 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid rgba(26, 63, 8, 0.2);
	}

	.form-field {
		margin-bottom: 1rem;
	}

	.form-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #030500;
		margin-bottom: 0.375rem;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem;
		font-size: 1rem;
		border: 2px solid rgba(26, 63, 8, 0.3);
		border-radius: 0.5rem;
		background-color: #ffffff;
		color: #030500;
		transition: border-color 0.2s ease;
		box-sizing: border-box;
	}

	.form-input:focus {
		outline: none;
		border-color: #1a3f08;
		box-shadow: 0 0 0 3px rgba(26, 63, 8, 0.12);
	}

	.form-input::placeholder {
		color: #999;
	}

	.form-input.input-error {
		border-color: #dc2626;
	}

	.form-input.input-error:focus {
		border-color: #dc2626;
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}

	.field-error {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.8125rem;
		color: #dc2626;
	}

	.form-textarea {
		resize: vertical;
		min-height: 4.5rem;
		font-family: inherit;
	}

	.advance-notice-warning {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		background-color: #fffbeb;
		border: 1px solid #f59e0b;
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
	}

	.warning-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
		line-height: 1.4;
	}

	.warning-text {
		font-size: 0.875rem;
		color: #92400e;
		margin: 0;
		line-height: 1.4;
	}

	.submit-section {
		padding-top: 0.5rem;
	}

	.submit-button {
		width: 100%;
		min-height: 48px;
		padding: 0.875rem 1.5rem;
		font-size: 1.0625rem;
		font-weight: 600;
		color: #ffffff;
		background-color: #1a3f08;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.2s ease, opacity 0.2s ease;
	}

	.submit-button:hover:not(:disabled) {
		background-color: #122d05;
	}

	.submit-button:focus-visible {
		outline: 2px solid #2d570f;
		outline-offset: 2px;
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (min-width: 480px) {
		.order-page {
			padding: 2rem 1.5rem;
		}

		.page-title {
			font-size: 2rem;
		}
	}

	@media (min-width: 768px) {
		.order-page {
			padding: 2.5rem 2rem;
		}
	}

	/* Review Step Styles */
	.review-card {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid rgba(26, 63, 8, 0.15);
	}

	.review-section {
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.review-section:last-of-type {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}

	.review-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		margin-bottom: 0.25rem;
	}

	.review-value {
		font-size: 1rem;
		color: #030500;
		font-weight: 500;
	}

	.review-items-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.review-item {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 0.25rem 0;
		font-size: 0.9375rem;
		color: #030500;
	}

	.review-item-price {
		font-weight: 600;
		color: #2d570f;
		white-space: nowrap;
	}

	.review-total {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding-top: 1rem;
		margin-top: 0.75rem;
		border-top: 2px solid rgba(45, 87, 15, 0.2);
	}

	.review-total-label {
		font-size: 1.125rem;
		font-weight: 700;
		color: #030500;
	}

	.review-total-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: #2d570f;
	}

	.review-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.back-button {
		width: 100%;
		min-height: 48px;
		padding: 0.875rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: #1a3f08;
		background-color: transparent;
		border: 2px solid #1a3f08;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.back-button:hover {
		background-color: rgba(26, 63, 8, 0.08);
	}

	.confirm-button {
		width: 100%;
		min-height: 48px;
		padding: 0.875rem 1.5rem;
		font-size: 1.0625rem;
		font-weight: 600;
		color: #ffffff;
		background-color: #1a3f08;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.2s ease, opacity 0.2s ease;
	}

	.confirm-button:hover:not(:disabled) {
		background-color: #122d05;
	}

	.confirm-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (min-width: 480px) {
		.review-actions {
			flex-direction: row-reverse;
		}

		.back-button,
		.confirm-button {
			flex: 1;
		}
	}
</style>
