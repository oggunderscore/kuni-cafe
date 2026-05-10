import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAvailabilityMap } from '$lib/server/availability';

/**
 * GET: Returns the availability map for all menu items (public endpoint).
 * Items not in the map are available by default.
 * Returns: { availability: Record<string, boolean> }
 */
export const GET: RequestHandler = async () => {
	try {
		const availability = await getAvailabilityMap();
		return json({ availability });
	} catch (error) {
		console.error('Error fetching availability:', error);
		// Return empty map on error (treat all as available)
		return json({ availability: {} });
	}
};
