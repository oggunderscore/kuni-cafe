import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } from '$env/static/private';

let _adminDb: ReturnType<typeof getFirestore> | undefined;

function initDb() {
	if (_adminDb) return _adminDb;

	if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
		throw new Error(
			'Firebase Admin credentials not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.'
		);
	}

	const app = getApps().length
		? getApp()
		: initializeApp({
				credential: cert({
					projectId: FIREBASE_PROJECT_ID,
					clientEmail: FIREBASE_CLIENT_EMAIL,
					privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
				})
			});

	_adminDb = getFirestore(app);
	return _adminDb;
}

// Lazy proxy that defers initialization until first access at runtime.
export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
	get(_target, prop) {
		const db = initDb();
		const value = Reflect.get(db, prop, db);
		if (typeof value === 'function') {
			return value.bind(db);
		}
		return value;
	}
});
