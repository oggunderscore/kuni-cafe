import type { TimeSlot } from '$lib/types';

/**
 * Generates time slots every 15 minutes from 09:00 to 14:45
 * on upcoming Saturdays and Sundays starting from `fromDate`.
 *
 * Validates: Requirements 2.1, 2.4
 */
export function generateTimeSlots(fromDate: Date, weekCount: number = 2): TimeSlot[] {
	const slots: TimeSlot[] = [];

	// Find the next Saturday from fromDate (or today if it's already Saturday/Sunday)
	const start = new Date(fromDate);
	start.setHours(0, 0, 0, 0);

	// Collect all Saturdays and Sundays within the given week count
	const endDate = new Date(start);
	endDate.setDate(endDate.getDate() + weekCount * 7);

	const current = new Date(start);

	while (current < endDate) {
		const dayOfWeekNum = current.getDay();

		// 0 = Sunday, 6 = Saturday
		if (dayOfWeekNum === 0 || dayOfWeekNum === 6) {
			const dayOfWeek: 'Saturday' | 'Sunday' = dayOfWeekNum === 6 ? 'Saturday' : 'Sunday';
			const dateStr = formatDate(current);

			// Generate slots from 09:00 to 14:45 every 15 minutes
			for (let hour = 9; hour <= 14; hour++) {
				for (let minute = 0; minute <= 45; minute += 15) {
					const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

					// Only include slots that are in the future relative to fromDate
					const slotDateTime = new Date(current);
					slotDateTime.setHours(hour, minute, 0, 0);

					if (slotDateTime > fromDate) {
						slots.push({
							id: `${dateStr}_${time}`,
							date: dateStr,
							time,
							dayOfWeek
						});
					}
				}
			}
		}

		current.setDate(current.getDate() + 1);
	}

	return slots;
}

/**
 * Returns only slots whose date is at least 7 days from `now`.
 * Used when the order contains a party-sized dessert.
 *
 * Validates: Requirements 4.1
 */
export function filterSlotsForPartyDessert(slots: TimeSlot[], now: Date = new Date()): TimeSlot[] {
	const minDate = new Date(now);
	minDate.setDate(minDate.getDate() + 7);
	// Zero out time so we compare dates only
	minDate.setHours(0, 0, 0, 0);

	return slots.filter((slot) => {
		const slotDate = new Date(slot.date + 'T00:00:00');
		return slotDate >= minDate;
	});
}

/**
 * Formats a Date object as YYYY-MM-DD string.
 */
function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
