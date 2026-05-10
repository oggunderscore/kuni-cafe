import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	validateCredentials,
	createSessionCookie,
	SESSION_COOKIE_NAME
} from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const { username, password } = body;

	if (!validateCredentials(username, password)) {
		return json(
			{ error: 'unauthorized', message: 'Invalid credentials' },
			{ status: 401 }
		);
	}

	const sessionValue = createSessionCookie();

	cookies.set(SESSION_COOKIE_NAME, sessionValue, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 // 24 hours
	});

	return json({ success: true });
};
