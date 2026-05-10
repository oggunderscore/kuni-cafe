import { ADMIN_USERNAME, ADMIN_PASSWORD } from '$env/static/private';
import { createHmac, randomBytes } from 'crypto';

export const SESSION_COOKIE_NAME = 'kuni_admin_session';

// In-memory session store (simple approach for serverless - sessions reset on cold start)
const activeSessions = new Map<string, { expiresAt: number }>();

// Session duration: 24 hours
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Validates admin credentials against environment variables.
 */
export function validateCredentials(username: string, password: string): boolean {
	if (!username || !password) {
		return false;
	}
	return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * Creates a new session token and stores it in the active sessions map.
 * Returns the session cookie value.
 */
export function createSessionCookie(): string {
	const token = randomBytes(32).toString('hex');
	const hmac = createHmac('sha256', ADMIN_PASSWORD);
	hmac.update(token);
	const signature = hmac.digest('hex');

	const cookieValue = `${token}.${signature}`;

	activeSessions.set(cookieValue, {
		expiresAt: Date.now() + SESSION_DURATION_MS
	});

	return cookieValue;
}

/**
 * Validates a session cookie value.
 * Checks that the session exists and has not expired.
 */
export function validateSession(cookieValue: string): boolean {
	if (!cookieValue) {
		return false;
	}

	const session = activeSessions.get(cookieValue);
	if (!session) {
		return false;
	}

	if (Date.now() > session.expiresAt) {
		// Clean up expired session
		activeSessions.delete(cookieValue);
		return false;
	}

	return true;
}

/**
 * Removes a session from the active sessions store.
 */
export function invalidateSession(cookieValue: string): void {
	activeSessions.delete(cookieValue);
}
