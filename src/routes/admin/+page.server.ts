import type { PageServerLoad } from './$types';
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/auth';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionCookie = cookies.get(SESSION_COOKIE_NAME) || '';
	const authenticated = validateSession(sessionCookie);

	return {
		authenticated
	};
};
