import type { OrderSubmission } from '$lib/types';
import { partySizedDesserts } from '$lib/data/menu';

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

/**
 * Returns the set of party-sized dessert IDs for quick lookup.
 */
function getPartySizedDessertIds(): Set<string> {
	return new Set(partySizedDesserts.map((d) => d.id));
}

/**
 * Validates a US phone number format.
 * Accepts: 5551234567, 555-123-4567, (555) 123-4567, 555.123.4567, +1 555-123-4567
 */
function isValidPhoneNumber(phone: string): boolean {
	// Strip all non-digit characters except leading +
	const digits = phone.replace(/[^\d]/g, '');
	// US numbers: 10 digits, or 11 starting with 1
	return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

/**
 * Checks whether the given time slot date is at least `days` days from `now`.
 * Both `slotDate` (YYYY-MM-DD) and `now` are compared at date-level granularity.
 */
function hasAdvanceNotice(slotDate: string, days: number, now: Date): boolean {
	const slot = new Date(slotDate + 'T00:00:00');
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const diffMs = slot.getTime() - today.getTime();
	const diffDays = diffMs / (1000 * 60 * 60 * 24);
	return diffDays >= days;
}

/**
 * Validates an order submission for required fields and business rules.
 *
 * Validates: Requirements 3.4, 3.5, 3.6, 4.1, 4.3
 *
 * @param order - The order submission payload to validate
 * @param slotDate - The ISO date string (YYYY-MM-DD) of the selected time slot (needed for advance notice check)
 * @param now - The current date (defaults to new Date(), injectable for testability)
 * @returns A ValidationResult with `valid` flag and array of error messages
 */
export function validateOrderSubmission(
	order: OrderSubmission,
	slotDate?: string,
	now: Date = new Date()
): ValidationResult {
	const errors: string[] = [];

	// Validate required fields
	if (!order.firstName || order.firstName.trim() === '') {
		errors.push('First name is required');
	}

	if (!order.lastName || order.lastName.trim() === '') {
		errors.push('Last name is required');
	}

	if (!order.phone || order.phone.trim() === '') {
		errors.push('Phone number is required');
	} else if (!isValidPhoneNumber(order.phone.trim())) {
		errors.push('Please enter a valid phone number (e.g. 555-123-4567)');
	}

	if (!order.items || order.items.length === 0) {
		errors.push('At least one item is required');
	}

	if (!order.timeSlot || order.timeSlot.trim() === '') {
		errors.push('Time slot selection is required');
	}

	// comments is optional — no validation needed

	// Validate party-sized dessert advance notice (7 days)
	if (order.items && order.items.length > 0 && slotDate) {
		const partyDessertIds = getPartySizedDessertIds();
		const hasPartyDessert = order.items.some((item) => partyDessertIds.has(item.menuItemId));

		if (hasPartyDessert && !hasAdvanceNotice(slotDate, 7, now)) {
			errors.push('Party-sized desserts require at least 7 days advance notice');
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}
