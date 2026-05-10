<script lang="ts">
	import type { TimeSlot } from '$lib/types';

	let { slots, selectedSlotId, onSelect }: {
		slots: TimeSlot[];
		selectedSlotId: string;
		onSelect: (slotId: string) => void;
	} = $props();

	let expanded = $state(true);

	// Group slots by date
	let groupedSlots = $derived(
		slots.reduce<Record<string, TimeSlot[]>>((groups, slot) => {
			if (!groups[slot.date]) {
				groups[slot.date] = [];
			}
			groups[slot.date].push(slot);
			return groups;
		}, {})
	);

	let sortedDates = $derived(Object.keys(groupedSlots).sort());

	// Get the selected slot object
	let selectedSlot = $derived(
		slots.find((s) => s.id === selectedSlotId)
	);

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

	function handleSelect(slotId: string) {
		onSelect(slotId);
		expanded = false;
	}

	function showTimes() {
		expanded = true;
	}

	function changeTime() {
		expanded = true;
	}
</script>

<div class="timeslot-picker" role="group" aria-label="Available pickup time slots">
	{#if selectedSlotId && selectedSlot && !expanded}
		<!-- Collapsed: show selected time with change button -->
		<div class="selected-display">
			<div class="selected-info">
				<span class="selected-label">Pickup time</span>
				<span class="selected-value">{formatDate(selectedSlot.date)}, {formatTime(selectedSlot.time)}</span>
			</div>
			<button type="button" class="change-btn" onclick={changeTime}>
				Change
			</button>
		</div>
	{:else if sortedDates.length === 0}
		<p class="no-slots">No available time slots at this time. Please check back later.</p>
	{:else}
		<!-- Expanded: show all available times -->
		{#if selectedSlotId}
			<button type="button" class="collapse-btn" onclick={() => expanded = false}>
				Hide times
			</button>
		{/if}
		{#each sortedDates as date (date)}
			<div class="date-group">
				<h3 class="date-header">{formatDate(date)}</h3>
				<div class="slots-grid">
					{#each groupedSlots[date] as slot (slot.id)}
						<button
							type="button"
							class="slot-button"
							class:selected={selectedSlotId === slot.id}
							onclick={() => handleSelect(slot.id)}
							aria-pressed={selectedSlotId === slot.id}
							aria-label="{formatTime(slot.time)} on {formatDate(date)}"
						>
							<span class="slot-time">
								{formatTime(slot.time)}
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.timeslot-picker {
		width: 100%;
	}

	.selected-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
	}

	.selected-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.selected-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.selected-value {
		font-size: 1rem;
		font-weight: 600;
		color: #1a3f08;
	}

	.change-btn {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #1a3f08;
		background: transparent;
		border: 1.5px solid #1a3f08;
		border-radius: 0.375rem;
		cursor: pointer;
		min-height: 44px;
		transition: background-color 0.2s ease;
	}

	.change-btn:hover {
		background: rgba(26, 63, 8, 0.06);
	}

	.collapse-btn {
		display: block;
		margin-bottom: 0.75rem;
		padding: 0.375rem 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #6b7280;
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: underline;
	}

	.collapse-btn:hover {
		color: #1a3f08;
	}

	.no-slots {
		text-align: center;
		color: #555;
		font-size: 0.9375rem;
		padding: 1.5rem 1rem;
	}

	.date-group {
		margin-bottom: 1.25rem;
	}

	.date-header {
		font-size: 1rem;
		font-weight: 600;
		color: #1a3f08;
		margin: 0 0 0.5rem;
		padding-bottom: 0.375rem;
		border-bottom: 1px solid rgba(26, 63, 8, 0.25);
	}

	.slots-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.5rem;
	}

	.slot-button {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0.75rem 1rem;
		border: 2px solid rgba(26, 63, 8, 0.35);
		border-radius: 0.5rem;
		background-color: #ffffff;
		color: #030500;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
	}

	.slot-button:hover {
		border-color: #1a3f08;
		background-color: rgba(26, 63, 8, 0.06);
	}

	.slot-button:focus-visible {
		outline: 2px solid #1a3f08;
		outline-offset: 2px;
	}

	.slot-button.selected {
		border-color: #1a3f08;
		background-color: #1a3f08;
		color: #ffffff;
	}

	.slot-time {
		white-space: nowrap;
	}

	@media (min-width: 480px) {
		.slots-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.date-header {
			font-size: 1.0625rem;
		}
	}

	@media (min-width: 768px) {
		.slots-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
