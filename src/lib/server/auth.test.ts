import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the env vars before importing the module
vi.mock('$env/static/private', () => ({
	ADMIN_USERNAME: 'testadmin',
	ADMIN_PASSWORD: 'testpassword123'
}));

import {
	validateCredentials,
	createSessionCookie,
	validateSession,
	invalidateSession,
	SESSION_COOKIE_NAME
} from './auth';

describe('auth module', () => {
	describe('SESSION_COOKIE_NAME', () => {
		it('should be defined as a string constant', () => {
			expect(SESSION_COOKIE_NAME).toBe('kuni_admin_session');
		});
	});

	describe('validateCredentials', () => {
		it('should return true for valid credentials', () => {
			expect(validateCredentials('testadmin', 'testpassword123')).toBe(true);
		});

		it('should return false for invalid username', () => {
			expect(validateCredentials('wronguser', 'testpassword123')).toBe(false);
		});

		it('should return false for invalid password', () => {
			expect(validateCredentials('testadmin', 'wrongpassword')).toBe(false);
		});

		it('should return false for both invalid', () => {
			expect(validateCredentials('wrong', 'wrong')).toBe(false);
		});

		it('should return false for empty username', () => {
			expect(validateCredentials('', 'testpassword123')).toBe(false);
		});

		it('should return false for empty password', () => {
			expect(validateCredentials('testadmin', '')).toBe(false);
		});

		it('should return false for empty both', () => {
			expect(validateCredentials('', '')).toBe(false);
		});
	});

	describe('createSessionCookie', () => {
		it('should return a non-empty string', () => {
			const cookie = createSessionCookie();
			expect(cookie).toBeTruthy();
			expect(typeof cookie).toBe('string');
		});

		it('should return a token with signature format (token.signature)', () => {
			const cookie = createSessionCookie();
			const parts = cookie.split('.');
			expect(parts.length).toBe(2);
			expect(parts[0].length).toBeGreaterThan(0);
			expect(parts[1].length).toBeGreaterThan(0);
		});

		it('should create unique sessions each time', () => {
			const cookie1 = createSessionCookie();
			const cookie2 = createSessionCookie();
			expect(cookie1).not.toBe(cookie2);
		});
	});

	describe('validateSession', () => {
		it('should return true for a valid session', () => {
			const cookie = createSessionCookie();
			expect(validateSession(cookie)).toBe(true);
		});

		it('should return false for an unknown session', () => {
			expect(validateSession('unknown-token.unknown-sig')).toBe(false);
		});

		it('should return false for empty string', () => {
			expect(validateSession('')).toBe(false);
		});

		it('should return false for expired session', () => {
			const cookie = createSessionCookie();
			// Fast-forward time past session duration
			vi.useFakeTimers();
			vi.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours
			expect(validateSession(cookie)).toBe(false);
			vi.useRealTimers();
		});
	});

	describe('invalidateSession', () => {
		it('should invalidate an existing session', () => {
			const cookie = createSessionCookie();
			expect(validateSession(cookie)).toBe(true);
			invalidateSession(cookie);
			expect(validateSession(cookie)).toBe(false);
		});

		it('should not throw for non-existent session', () => {
			expect(() => invalidateSession('nonexistent')).not.toThrow();
		});
	});
});
