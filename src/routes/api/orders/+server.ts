import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { validateOrderSubmission } from '$lib/validation';
import { drinks, addOns, desserts, partySizedDesserts } from '$lib/data/menu';
import { getAvailabilityMap } from '$lib/server/availability';
import { FieldValue } from 'firebase-admin/firestore';
import type { OrderSubmission, OrderItem } from '$lib/types';

// Build a lookup map of all menu items by ID for O(1) access
const menuItemMap = new Map<string, { name: string; price: number; category: OrderItem['category'] }>();

for (const item of drinks) {
	menuItemMap.set(item.id, { name: item.name, price: item.price, category: 'drink' });
}
for (const item of addOns) {
	menuItemMap.set(item.id, { name: item.name, price: item.price, category: 'addon' });
}
for (const item of desserts) {
	menuItemMap.set(item.id, { name: item.name, price: item.price, category: 'dessert' });
}
for (const item of partySizedDesserts) {
	menuItemMap.set(item.id, { name: item.name, price: item.price, category: 'party-dessert' });
}

// Set of party-sized dessert IDs for quick lookup
const partySizedDessertIds = new Set(partySizedDesserts.map((d) => d.id));

/**
 * Generate a sequential 4-digit order number using a Firestore counter.
 * Format: 0001, 0002, ..., 9999, then wraps to 0001.
 */
async function getNextOrderNumber(): Promise<string> {
	const counterRef = adminDb.doc('config/order-counter');

	const result = await adminDb.runTransaction(async (transaction) => {
		const counterDoc = await transaction.get(counterRef);
		let current = 0;
		if (counterDoc.exists) {
			current = counterDoc.data()?.count ?? 0;
		}
		const next = current >= 9999 ? 1 : current + 1;
		transaction.set(counterRef, { count: next });
		return next;
	});

	return String(result).padStart(4, '0');
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as OrderSubmission;

		// Extract slot date from the timeSlot ID (format: YYYY-MM-DD_HH:mm)
		const slotDate = body.timeSlot ? body.timeSlot.split('_')[0] : undefined;

		// Validate the order submission
		const validation = validateOrderSubmission(body, slotDate);
		if (!validation.valid) {
			return json({ error: 'validation_error', errors: validation.errors }, { status: 400 });
		}

		// Check item availability
		const availabilityMap = await getAvailabilityMap();
		const unavailableItems: string[] = [];

		for (const item of body.items) {
			if (availabilityMap[item.menuItemId] === false) {
				const menuItem = menuItemMap.get(item.menuItemId);
				unavailableItems.push(menuItem?.name ?? item.menuItemId);
			}
		}

		if (unavailableItems.length > 0) {
			return json(
				{
					error: 'validation_error',
					errors: unavailableItems.map((name) => `"${name}" is currently unavailable`)
				},
				{ status: 400 }
			);
		}

		// Calculate total price, build enriched order items, and check for party-sized desserts
		let totalPrice = 0;
		const orderItems: OrderItem[] = [];
		let hasPartySizedDessert = false;

		for (const item of body.items) {
			const menuItem = menuItemMap.get(item.menuItemId);
			if (!menuItem) {
				return json(
					{
						error: 'validation_error',
						errors: [`Invalid menu item: ${item.menuItemId}`]
					},
					{ status: 400 }
				);
			}

			const itemTotal = menuItem.price * item.quantity;
			totalPrice += itemTotal;

			if (partySizedDessertIds.has(item.menuItemId)) {
				hasPartySizedDessert = true;
			}

			orderItems.push({
				menuItemId: item.menuItemId,
				name: menuItem.name,
				quantity: item.quantity,
				price: menuItem.price,
				category: menuItem.category
			});
		}

		// Determine sortOrder by counting existing orders in the same time slot
		const existingOrdersSnapshot = await adminDb
			.collection('orders')
			.where('timeSlot', '==', body.timeSlot)
			.get();
		const sortOrder = existingOrdersSnapshot.size;

		// Generate sequential order number
		const shortId = await getNextOrderNumber();

		// Write order to Firestore
		const orderRef = adminDb.collection('orders').doc();
		await orderRef.set({
			shortId,
			firstName: body.firstName.trim(),
			lastName: body.lastName.trim(),
			phone: body.phone.trim(),
			items: orderItems,
			timeSlot: body.timeSlot,
			comments: body.comments?.trim() || '',
			status: 'Unpaid',
			totalPrice,
			sortOrder,
			hasPartySizedDessert,
			createdAt: FieldValue.serverTimestamp()
		});

		return json({ success: true, orderId: orderRef.id, shortId }, { status: 201 });
	} catch (error: unknown) {
		console.error('Order submission error:', error);
		const message =
			error instanceof Error && error.message.includes('Firebase')
				? 'The ordering system is not yet configured. Please contact the cafe owner.'
				: 'An unexpected error occurred while processing your order';
		return json(
			{
				error: 'internal_error',
				message
			},
			{ status: 500 }
		);
	}
};
