import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/auth';
import { getAvailabilityMap, setItemAvailability } from '$lib/server/availability';
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
 * GET: Returns all menu items with their current availability status.
 */
export const GET: RequestHandler = async ({ request }) => {
	if (!isAuthenticated(request)) {
		return json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
	}

	try {
		const availabilityMap = await getAvailabilityMap();

		const allItems = [
			...drinks.map((d) => ({ ...d, category: 'drink' as const, available: availabilityMap[d.id] !== false })),
			...addOns.map((a) => ({ ...a, category: 'addon' as const, available: availabilityMap[a.id] !== false })),
			...desserts.map((d) => ({ ...d, category: 'dessert' as const, available: availabilityMap[d.id] !== false })),
			...partySizedDesserts.map((d) => ({ ...d, category: 'party-dessert' as const, available: availabilityMap[d.id] !== false }))
		];

		return json({ items: allItems });
	} catch (error) {
		console.error('Error fetching menu:', error);
		return json({ error: 'internal_error', message: 'Failed to fetch menu' }, { status: 500 });
	}
};

/**
 * PUT: Toggle availability for a menu item.
 * Body: { itemId: string, available: boolean }
 */
export const PUT: RequestHandler = async ({ request }) => {
	if (!isAuthenticated(request)) {
		return json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
	}

	try {
		const { itemId, available } = await request.json();

		if (!itemId || typeof available !== 'boolean') {
			return json(
				{ error: 'validation_error', message: 'itemId and available (boolean) are required' },
				{ status: 400 }
			);
		}

		await setItemAvailability(itemId, available);
		return json({ success: true });
	} catch (error) {
		console.error('Error updating availability:', error);
		return json({ error: 'internal_error', message: 'Failed to update availability' }, { status: 500 });
	}
};
