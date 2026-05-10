import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSiteSettings } from '$lib/server/announcements';

/**
 * GET: Returns public site settings (announcement + blocked dates).
 */
export const GET: RequestHandler = async () => {
	try {
		const settings = await getSiteSettings();
		return json(settings);
	} catch {
		return json({ announcement: '', blockedDates: [] });
	}
};
