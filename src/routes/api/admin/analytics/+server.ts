import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/auth';

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

export const GET: RequestHandler = async ({ request, url }) => {
	if (!isAuthenticated(request)) {
		return json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
	}

	try {
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');

		let query = adminDb.collection('orders').orderBy('createdAt', 'asc');

		// Fetch all orders and filter by date client-side (Firestore timestamp comparison)
		const snapshot = await query.get();

		let orders = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));

		// Filter by date range if provided
		if (startDate || endDate) {
			orders = orders.filter((order: any) => {
				const slotDate = order.timeSlot?.split('_')[0];
				if (!slotDate) return false;
				if (startDate && slotDate < startDate) return false;
				if (endDate && slotDate > endDate) return false;
				return true;
			});
		}

		// Calculate analytics
		const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
		let totalRevenue = 0;

		for (const order of orders) {
			const orderData = order as any;
			totalRevenue += orderData.totalPrice || 0;

			if (orderData.items) {
				for (const item of orderData.items) {
					if (!itemCounts[item.menuItemId]) {
						itemCounts[item.menuItemId] = { name: item.name, count: 0, revenue: 0 };
					}
					itemCounts[item.menuItemId].count += item.quantity;
					itemCounts[item.menuItemId].revenue += item.price * item.quantity;
				}
			}
		}

		return json({
			totalOrders: orders.length,
			totalRevenue,
			itemCounts,
			dateRange: { startDate, endDate }
		});
	} catch (error) {
		console.error('Analytics error:', error);
		return json({ error: 'internal_error', message: 'Failed to fetch analytics' }, { status: 500 });
	}
};
