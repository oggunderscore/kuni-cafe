import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/auth';
import { getSiteSettings, setAnnouncement, setBlockedDates } from '$lib/server/announcements';

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
 * GET: Returns current site settings.
 */
export const GET: RequestHandler = async ({ request }) => {
	if (!isAuthenticated(request)) {
		return json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
	}

	try {
		const settings = await getSiteSettings();
		return json(settings);
	} catch (error) {
		console.error('Error fetching settings:', error);
		return json({ error: 'internal_error', message: 'Failed to fetch settings' }, { status: 500 });
	}
};

/**
 * PUT: Update site settings.
 * Body: { action: 'updateAnnouncement', text: string }
 *    or { action: 'updateBlockedDates', dates: string[] }
 */
export const PUT: RequestHandler = async ({ request }) => {
	if (!isAuthenticated(request)) {
		return json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { action } = body;

		if (action === 'updateAnnouncement') {
			const { text } = body;
			if (typeof text !== 'string') {
				return json({ error: 'validation_error', message: 'text must be a string' }, { status: 400 });
			}
			await setAnnouncement(text);
			return json({ success: true });
		} else if (action === 'updateBlockedDates') {
			const { dates } = body;
			if (!Array.isArray(dates)) {
				return json({ error: 'validation_error', message: 'dates must be an array' }, { status: 400 });
			}
			await setBlockedDates(dates);
			return json({ success: true });
		} else {
			return json({ error: 'validation_error', message: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		console.error('Error updating settings:', error);
		return json({ error: 'internal_error', message: 'Failed to update settings' }, { status: 500 });
	}
};
