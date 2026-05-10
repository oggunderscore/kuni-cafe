import { adminDb } from '$lib/server/firebase';

const AVAILABILITY_DOC = 'config/menu-availability';
const OVERRIDES_DOC = 'config/menu-overrides';

export interface MenuOverride {
	name?: string;
	price?: number;
	description?: string;
	removed?: boolean;
}

export interface CustomItem {
	id: string;
	name: string;
	price: number;
	description?: string;
	category: 'drink' | 'addon' | 'dessert' | 'party-dessert';
}

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
		return {};
	}
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
 * Get menu overrides (edits to existing items).
 */
export async function getMenuOverrides(): Promise<Record<string, MenuOverride>> {
	try {
		const doc = await adminDb.doc(OVERRIDES_DOC).get();
		if (!doc.exists) return {};
		return (doc.data()?.overrides as Record<string, MenuOverride>) ?? {};
	} catch {
		return {};
	}
}

/**
 * Set override for a specific item (edit name/price/description or mark as removed).
 */
export async function setMenuOverride(itemId: string, override: MenuOverride): Promise<void> {
	await adminDb.doc(OVERRIDES_DOC).set(
		{ overrides: { [itemId]: override } },
		{ merge: true }
	);
}

/**
 * Get custom items added by admin.
 */
export async function getCustomItems(): Promise<CustomItem[]> {
	try {
		const doc = await adminDb.doc(OVERRIDES_DOC).get();
		if (!doc.exists) return [];
		return (doc.data()?.customItems as CustomItem[]) ?? [];
	} catch {
		return [];
	}
}

/**
 * Add a custom item.
 */
export async function addCustomItem(item: CustomItem): Promise<void> {
	const existing = await getCustomItems();
	existing.push(item);
	await adminDb.doc(OVERRIDES_DOC).set({ customItems: existing }, { merge: true });
}

/**
 * Remove a custom item by ID.
 */
export async function removeCustomItem(itemId: string): Promise<void> {
	const existing = await getCustomItems();
	const filtered = existing.filter((i) => i.id !== itemId);
	await adminDb.doc(OVERRIDES_DOC).set({ customItems: filtered }, { merge: true });
}

const ORDER_DOC = 'config/menu-order';

/**
 * Get the stored item order for a category.
 * Returns an array of item IDs in display order.
 */
export async function getMenuOrder(category: string): Promise<string[]> {
	try {
		const doc = await adminDb.doc(ORDER_DOC).get();
		if (!doc.exists) return [];
		return (doc.data()?.[category] as string[]) ?? [];
	} catch {
		return [];
	}
}

/**
 * Set the item order for a category.
 */
export async function setMenuOrder(category: string, orderedIds: string[]): Promise<void> {
	await adminDb.doc(ORDER_DOC).set({ [category]: orderedIds }, { merge: true });
}
