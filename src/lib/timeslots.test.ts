import { describe, it, expect } from 'vitest';
import { generateTimeSlots, filterSlotsForPartyDessert } from './timeslots';
import type { TimeSlot } from './types';

function makeSlot(overrides: Partial<TimeSlot> = {}): TimeSlot {
	return {
		id: '2024-07-06_10:00',
		date: '2024-07-06',
		time: '10:00',
		dayOfWeek: 'Saturday',
		...overrides
	};
}

describe('generateTimeSlots', () => {
	it('generates slots only on Saturdays and Sundays', () => {
		const fromDate = new Date('2024-07-01T00:00:00'); // Monday
		const slots = generateTimeSlots(fromDate, 1);
		expect(slots.length).toBeGreaterThan(0);
		const days = slots.map((s) => s.dayOfWeek);
		expect(days.every((d) => d === 'Saturday' || d === 'Sunday')).toBe(true);
	});

	it('generates 24 slots per day at 15-minute intervals from 09:00 to 14:45', () => {
		const fromDate = new Date('2024-07-01T00:00:00'); // Monday
		const slots = generateTimeSlots(fromDate, 1);
		const validTimes: string[] = [];
		for (let h = 9; h <= 14; h++) {
			for (let m = 0; m <= 45; m += 15) {
				validTimes.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
			}
		}
		// All slot times must be valid 15-min intervals
		expect(slots.every((s) => validTimes.includes(s.time))).toBe(true);
		// Each full weekend day should have 24 slots (6 hours * 4 slots/hour)
		const slotsByDate = new Map<string, TimeSlot[]>();
		for (const slot of slots) {
			const existing = slotsByDate.get(slot.date) || [];
			existing.push(slot);
			slotsByDate.set(slot.date, existing);
		}
		// At least one full day should have 24 slots
		const fullDayCounts = [...slotsByDate.values()].map((s) => s.length);
		expect(fullDayCounts.some((count) => count === 24)).toBe(true);
	});

	it('generates deterministic IDs in YYYY-MM-DD_HH:mm format', () => {
		const fromDate = new Date('2024-07-01T00:00:00');
		const slots = generateTimeSlots(fromDate, 1);
		expect(slots.every((s) => s.id === `${s.date}_${s.time}`)).toBe(true);
		// Verify ID format with regex
		const idPattern = /^\d{4}-\d{2}-\d{2}_\d{2}:\d{2}$/;
		expect(slots.every((s) => idPattern.test(s.id))).toBe(true);
	});

	it('includes dayOfWeek field matching the actual day', () => {
		const fromDate = new Date('2024-07-01T00:00:00');
		const slots = generateTimeSlots(fromDate, 1);
		for (const slot of slots) {
			const date = new Date(slot.date + 'T12:00:00');
			const day = date.getDay();
			if (slot.dayOfWeek === 'Saturday') {
				expect(day).toBe(6);
			} else {
				expect(day).toBe(0);
			}
		}
	});

	it('only includes future slots relative to fromDate', () => {
		// Use a Saturday mid-morning as fromDate so some slots on that day are excluded
		const fromDate = new Date('2024-07-06T11:00:00'); // Saturday at 11:00
		const slots = generateTimeSlots(fromDate, 1);

		// All slots should be strictly after fromDate
		for (const slot of slots) {
			const slotDateTime = new Date(`${slot.date}T${slot.time}:00`);
			expect(slotDateTime.getTime()).toBeGreaterThan(fromDate.getTime());
		}

		// Specifically, slots at 09:00, 09:15, ..., 11:00 on 2024-07-06 should be excluded
		const sameDaySlots = slots.filter((s) => s.date === '2024-07-06');
		const sameDayTimes = sameDaySlots.map((s) => s.time);
		expect(sameDayTimes).not.toContain('09:00');
		expect(sameDayTimes).not.toContain('10:00');
		expect(sameDayTimes).not.toContain('11:00');
		// 11:15 should be included (it's after 11:00)
		expect(sameDayTimes).toContain('11:15');
	});

	it('with weekCount=1 only covers 1 week of dates', () => {
		const fromDate = new Date('2024-07-01T00:00:00'); // Monday
		const slots = generateTimeSlots(fromDate, 1);

		// All slot dates should be within 7 days of fromDate
		const endDate = new Date('2024-07-08T00:00:00'); // 7 days later
		for (const slot of slots) {
			const slotDate = new Date(slot.date + 'T00:00:00');
			expect(slotDate.getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
			expect(slotDate.getTime()).toBeLessThan(endDate.getTime());
		}

		// Should only contain dates from the first week (Sat Jul 6, Sun Jul 7)
		const uniqueDates = [...new Set(slots.map((s) => s.date))];
		expect(uniqueDates).toContain('2024-07-06');
		expect(uniqueDates).toContain('2024-07-07');
		expect(uniqueDates).not.toContain('2024-07-13');
	});

	it('returns empty array when weekCount is 0', () => {
		const fromDate = new Date('2024-07-01T00:00:00');
		const slots = generateTimeSlots(fromDate, 0);
		expect(slots).toEqual([]);
	});
});

describe('filterSlotsForPartyDessert', () => {
	const now = new Date('2024-06-01T12:00:00');

	it('returns only slots 7+ days ahead', () => {
		const slots: TimeSlot[] = [
			makeSlot({ id: '2024-06-05_10:00', date: '2024-06-05' }), // 4 days - excluded
			makeSlot({ id: '2024-06-08_10:00', date: '2024-06-08' }), // 7 days - included
			makeSlot({ id: '2024-06-10_10:00', date: '2024-06-10' }) // 9 days - included
		];
		const result = filterSlotsForPartyDessert(slots, now);
		expect(result).toHaveLength(2);
		expect(result.map((s) => s.id)).toEqual(['2024-06-08_10:00', '2024-06-10_10:00']);
	});

	it('returns empty array when no slots are 7+ days ahead', () => {
		const slots: TimeSlot[] = [
			makeSlot({ id: '2024-06-01_10:00', date: '2024-06-01' }), // same day
			makeSlot({ id: '2024-06-07_10:00', date: '2024-06-07' }) // 6 days
		];
		const result = filterSlotsForPartyDessert(slots, now);
		expect(result).toHaveLength(0);
	});

	it('includes slots exactly 7 days ahead', () => {
		const slots: TimeSlot[] = [makeSlot({ id: '2024-06-08_10:00', date: '2024-06-08' })];
		const result = filterSlotsForPartyDessert(slots, now);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('2024-06-08_10:00');
	});

	it('returns empty array for empty input', () => {
		expect(filterSlotsForPartyDessert([], now)).toEqual([]);
	});

	it('defaults to current date when now is not provided', () => {
		// Create a slot far in the future to ensure it passes regardless of when test runs
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 30);
		const dateStr = futureDate.toISOString().split('T')[0];

		const slots: TimeSlot[] = [makeSlot({ id: `${dateStr}_10:00`, date: dateStr })];
		const result = filterSlotsForPartyDessert(slots);
		expect(result).toHaveLength(1);
	});
});
