import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	SESSION_COOKIE_NAME,
	invalidateSession
} from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionValue = cookies.get(SESSION_COOKIE_NAME);

	if (sessionValue) {
		invalidateSession(sessionValue);
	}

	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

	return json({ success: true });
};
