import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/auth';
import {
	getAvailabilityMap,
	setItemAvailability,
	getMenuOverrides,
	setMenuOverride,
	getCustomItems,
	addCustomItem,
	removeCustomItem
} from '$lib/server/availability';
import { drinks, addOns, desserts, partySizedDesserts } from '$lib/data/menu';

function getSessionCookie(request: Request): string {
	const cookieHeader = request.headers.get('cookie') || '';
	const cookies = cookieHeader.split(';').map((c) => c.trim());
	for (const cookie of cookies) {
		const [name, ...rest] = cookie.split('=');
		if (name === SESSION_COOKIE_NAME) {
			return rest.join('=');
		}
	}
	return '';
}

function isAuthenticated(request: Request): boolean {
	const sessionCookie = getSessionCookie(request);
	return validateSession(sessionCookie);
}

/**
 * GET: Returns all menu items with availability, overrides applied, and custom items.
 */
export const GET: RequestHandler = async ({ request }) => {
	if (!isAuthenticated(request)) {
		return json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
	}

	try {
		const [availabilityMap, overrides, customItems] = await Promise.all([
			getAvailabilityMap(),
			getMenuOverrides(),
			getCustomItems()
		]);

		// Also fetch stored order
		const { getMenuOrder } = await import('$lib/server/availability');
		const categories = ['drink', 'addon', 'dessert', 'party-dessert'];
		const orderMap: Record<string, string[]> = {};
		for (const cat of categories) {
			orderMap[cat] = await getMenuOrder(cat);
		}

		const baseItems = [
			...drinks.map((d) => ({ id: d.id, name: d.name, price: d.price, cost: d.cost ?? 0, description: d.description ?? '', category: 'drink' as const, isCustom: false })),
			...addOns.map((a) => ({ id: a.id, name: a.name, price: a.price, cost: a.cost ?? 0, description: a.description ?? '', category: 'addon' as const, isCustom: false })),
			...desserts.map((d) => ({ id: d.id, name: d.name, price: d.price, cost: d.cost ?? 0, description: d.description ?? '', category: 'dessert' as const, isCustom: false })),
			...partySizedDesserts.map((d) => ({ id: d.id, name: d.name, price: d.price, cost: d.cost ?? 0, description: d.description ?? '', category: 'party-dessert' as const, isCustom: false }))
		];

		// Apply overrides and filter removed items
		const items = baseItems
			.filter((item) => !overrides[item.id]?.removed)
			.map((item) => {
				const override = overrides[item.id];
				return {
					...item,
					name: override?.name ?? item.name,
					price: override?.price ?? item.price,
					cost: (override as any)?.cost ?? item.cost,
					description: override?.description ?? item.description,
					available: availabilityMap[item.id] !== false
				};
			});

		// Add custom items
		for (const custom of customItems) {
			items.push({
				...custom,
				cost: (custom as any).cost ?? 0,
				description: custom.description ?? '',
				isCustom: true,
				available: availabilityMap[custom.id] !== false
			});
		}

		// Sort items by stored order within each category
		items.sort((a, b) => {
			if (a.category !== b.category) return 0;
			const order = orderMap[a.category] ?? [];
			const aIdx = order.indexOf(a.id);
			const bIdx = order.indexOf(b.id);
			if (aIdx === -1 && bIdx === -1) return 0;
			if (aIdx === -1) return 1;
			if (bIdx === -1) return -1;
			return aIdx - bIdx;
		});

		return json({ items });
	} catch (error) {
		console.error('Error fetching menu:', error);
		return json({ error: 'internal_error', message: 'Failed to fetch menu' }, { status: 500 });
	}
};

/**
 * PUT: Update a menu item (availability, edit fields, or remove).
 */
export const PUT: RequestHandler = async ({ request }) => {
	if (!isAuthenticated(request)) {
		return json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { action } = body;

		if (action === 'setAvailability') {
			const { itemId, available } = body;
			if (!itemId || typeof available !== 'boolean') {
				return json({ error: 'validation_error', message: 'itemId and available required' }, { status: 400 });
			}
			await setItemAvailability(itemId, available);
			return json({ success: true });
		}

		if (action === 'editItem') {
			const { itemId, name, price, cost, description } = body;
			if (!itemId) {
				return json({ error: 'validation_error', message: 'itemId required' }, { status: 400 });
			}
			const override: Record<string, unknown> = {};
			if (name !== undefined) override.name = name;
			if (price !== undefined) override.price = Number(price);
			if (cost !== undefined) override.cost = Number(cost);
			if (description !== undefined) override.description = description;
			await setMenuOverride(itemId, override);
			return json({ success: true });
		}

		if (action === 'removeItem') {
			const { itemId, isCustom } = body;
			if (!itemId) {
				return json({ error: 'validation_error', message: 'itemId required' }, { status: 400 });
			}
			if (isCustom) {
				await removeCustomItem(itemId);
			} else {
				await setMenuOverride(itemId, { removed: true });
			}
			return json({ success: true });
		}

		if (action === 'addItem') {
			const { name, price, description, category } = body;
			if (!name || !price || !category) {
				return json({ error: 'validation_error', message: 'name, price, and category required' }, { status: 400 });
			}
			const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
			await addCustomItem({ id, name, price: Number(price), description: description ?? '', category });
			return json({ success: true, id });
		}

		if (action === 'reorderItems') {
			const { category, orderedIds } = body;
			if (!category || !Array.isArray(orderedIds)) {
				return json({ error: 'validation_error', message: 'category and orderedIds required' }, { status: 400 });
			}
			// Store the order in Firestore
			const { setMenuOrder } = await import('$lib/server/availability');
			await setMenuOrder(category, orderedIds);
			return json({ success: true });
		}

		return json({ error: 'validation_error', message: 'Invalid action' }, { status: 400 });
	} catch (error) {
		console.error('Error updating menu:', error);
		return json({ error: 'internal_error', message: 'Failed to update menu' }, { status: 500 });
	}
};
