import { describe, it, expect } from 'vitest';
import { validateOrderSubmission } from './validation';
import type { OrderSubmission } from './types';

function validOrder(): OrderSubmission {
	return {
		firstName: 'Jane',
		lastName: 'Doe',
		phone: '555-123-4567',
		items: [{ menuItemId: 'matcha-latte', quantity: 2 }],
		timeSlot: '2025-01-18_09:00'
	};
}

describe('validateOrderSubmission', () => {
	it('returns valid for a complete order without party desserts', () => {
		const result = validateOrderSubmission(validOrder());
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('returns error when firstName is missing', () => {
		const order = { ...validOrder(), firstName: '' };
		const result = validateOrderSubmission(order);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('First name is required');
	});

	it('returns error when lastName is missing', () => {
		const order = { ...validOrder(), lastName: '   ' };
		const result = validateOrderSubmission(order);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Last name is required');
	});

	it('returns error when phone is missing', () => {
		const order = { ...validOrder(), phone: '' };
		const result = validateOrderSubmission(order);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Phone number is required');
	});

	it('returns error when items array is empty', () => {
		const order = { ...validOrder(), items: [] };
		const result = validateOrderSubmission(order);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('At least one item is required');
	});

	it('returns error when timeSlot is missing', () => {
		const order = { ...validOrder(), timeSlot: '' };
		const result = validateOrderSubmission(order);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Time slot selection is required');
	});

	it('returns multiple errors when multiple fields are missing', () => {
		const order: OrderSubmission = {
			firstName: '',
			lastName: '',
			phone: '',
			items: [],
			timeSlot: ''
		};
		const result = validateOrderSubmission(order);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(5);
		expect(result.errors).toContain('First name is required');
		expect(result.errors).toContain('Last name is required');
		expect(result.errors).toContain('Phone number is required');
		expect(result.errors).toContain('At least one item is required');
		expect(result.errors).toContain('Time slot selection is required');
	});

	it('does not require comments field', () => {
		const order = validOrder();
		// comments is not set (undefined)
		const result = validateOrderSubmission(order);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('returns error for party-sized dessert without 7 days advance notice', () => {
		const order: OrderSubmission = {
			firstName: 'John',
			lastName: 'Smith',
			phone: '555-000-1111',
			items: [{ menuItemId: '6x6-matcha-tiramisu-brownie', quantity: 1 }],
			timeSlot: '2024-06-04_09:00'
		};
		// Slot date is 3 days from now
		const now = new Date('2024-06-01');
		const slotDate = '2024-06-04';
		const result = validateOrderSubmission(order, slotDate, now);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Party-sized desserts require at least 7 days advance notice');
	});

	it('allows party-sized dessert with exactly 7 days advance notice', () => {
		const order: OrderSubmission = {
			firstName: 'John',
			lastName: 'Smith',
			phone: '555-000-1111',
			items: [{ menuItemId: '6x6-matcha-tiramisu-brownie', quantity: 1 }],
			timeSlot: '2024-06-08_09:00'
		};
		const now = new Date('2024-06-01');
		const slotDate = '2024-06-08'; // exactly 7 days
		const result = validateOrderSubmission(order, slotDate, now);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('allows party-sized dessert with more than 7 days advance notice', () => {
		const order: OrderSubmission = {
			firstName: 'John',
			lastName: 'Smith',
			phone: '555-000-1111',
			items: [{ menuItemId: 'banana-pudding-half-pan', quantity: 1 }],
			timeSlot: '2024-06-15_09:00'
		};
		const now = new Date('2024-06-01');
		const slotDate = '2024-06-15'; // 14 days
		const result = validateOrderSubmission(order, slotDate, now);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('does not check advance notice for non-party desserts', () => {
		const order: OrderSubmission = {
			firstName: 'John',
			lastName: 'Smith',
			phone: '555-000-1111',
			items: [{ menuItemId: 'matcha-tiramisu-brownie', quantity: 1 }],
			timeSlot: '2024-06-02_09:00'
		};
		const now = new Date('2024-06-01');
		const slotDate = '2024-06-02'; // only 1 day ahead
		const result = validateOrderSubmission(order, slotDate, now);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('does not check advance notice when slotDate is not provided', () => {
		const order: OrderSubmission = {
			firstName: 'John',
			lastName: 'Smith',
			phone: '555-000-1111',
			items: [{ menuItemId: '6x6-matcha-tiramisu-brownie', quantity: 1 }],
			timeSlot: '2024-06-08_09:00'
		};
		const result = validateOrderSubmission(order);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});
});
