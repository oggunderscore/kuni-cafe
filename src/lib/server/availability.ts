import { adminDb } from '$lib/server/firebase';

const AVAILABILITY_DOC = 'config/menu-availability';

/**
 * Get the availability map from Firestore.
 * Returns a map of itemId -> boolean (true = available).
 * Items not in the map are considered available by default.
 * Returns empty map if Firebase is not configured.
 */
export async function getAvailabilityMap(): Promise<Record<string, boolean>> {
	try {
		const doc = await adminDb.doc(AVAILABILITY_DOC).get();
		if (!doc.exists) return {};
		return (doc.data()?.items as Record<string, boolean>) ?? {};
	} catch {
		// Firebase not configured or network error — treat all items as available
		return {};
	}
}

/**
 * Check if a specific item is available.
 */
export async function isItemAvailable(itemId: string): Promise<boolean> {
	const map = await getAvailabilityMap();
	// If not in the map, default to available
	return map[itemId] !== false;
}

/**
 * Set availability for a specific item.
 */
export async function setItemAvailability(itemId: string, available: boolean): Promise<void> {
	await adminDb.doc(AVAILABILITY_DOC).set(
		{ items: { [itemId]: available } },
		{ merge: true }
	);
}

/**
 * Set availability for multiple items at once.
 */
export async function setMultipleAvailability(updates: Record<string, boolean>): Promise<void> {
	await adminDb.doc(AVAILABILITY_DOC).set(
		{ items: updates },
		{ merge: true }
	);
}
