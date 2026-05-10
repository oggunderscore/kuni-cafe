import { adminDb } from '$lib/server/firebase';

const CONFIG_DOC = 'config/site-settings';

export interface SiteSettings {
	announcement: string; // PSA text shown at top of order page
	blockedDates: string[]; // array of YYYY-MM-DD dates where no orders are accepted
}

/**
 * Get site settings (announcement + blocked dates).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
	try {
		const doc = await adminDb.doc(CONFIG_DOC).get();
		if (!doc.exists) return { announcement: '', blockedDates: [] };
		const data = doc.data()!;
		return {
			announcement: data.announcement ?? '',
			blockedDates: data.blockedDates ?? []
		};
	} catch {
		return { announcement: '', blockedDates: [] };
	}
}

/**
 * Update the announcement text.
 */
export async function setAnnouncement(text: string): Promise<void> {
	await adminDb.doc(CONFIG_DOC).set({ announcement: text }, { merge: true });
}

/**
 * Update blocked dates (replaces the entire list).
 */
export async function setBlockedDates(dates: string[]): Promise<void> {
	await adminDb.doc(CONFIG_DOC).set({ blockedDates: dates }, { merge: true });
}
