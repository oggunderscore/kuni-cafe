import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { validateSession, SESSION_COOKIE_NAME } from '$lib/server/auth';

// Valid sequential status transitions
const VALID_TRANSITIONS: Record<string, string> = {
	Unpaid: 'Paid',
	Paid: 'Making',
	Making: 'Made',
	Made: 'Delivered'
};

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

export const GET: RequestHandler = async ({ request }) => {
	if (!isAuthenticated(request)) {
		return json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
	}

	try {
		const ordersSnapshot = await adminDb
			.collection('orders')
			.orderBy('timeSlot', 'asc')
			.orderBy('sortOrder', 'asc')
			.get();

		const orders = ordersSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));

		return json({ orders });
	} catch (error) {
		console.error('Error fetching orders:', error);
		return json({ error: 'internal_error', message: 'Failed to fetch orders' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	if (!isAuthenticated(request)) {
		return json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { orderId, action } = body;

		if (!orderId || !action) {
			return json(
				{ error: 'validation_error', message: 'orderId and action are required' },
				{ status: 400 }
			);
		}

		if (action === 'updateStatus') {
			return await handleStatusUpdate(orderId);
		} else if (action === 'setStatus') {
			const { status } = body;
			return await handleSetStatus(orderId, status);
		} else if (action === 'reorder') {
			const { sortOrder, timeSlot } = body;
			return await handleReorder(orderId, sortOrder, timeSlot);
		} else {
			return json(
				{ error: 'validation_error', message: 'action must be "updateStatus" or "reorder"' },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error('Error updating order:', error);
		return json({ error: 'internal_error', message: 'Failed to update order' }, { status: 500 });
	}
};

async function handleStatusUpdate(orderId: string): Promise<Response> {
	const orderRef = adminDb.collection('orders').doc(orderId);
	const orderSnap = await orderRef.get();

	if (!orderSnap.exists) {
		return json({ error: 'not_found', message: 'Order not found' }, { status: 404 });
	}

	const orderData = orderSnap.data()!;
	const currentStatus = orderData.status as string;
	const nextStatus = VALID_TRANSITIONS[currentStatus];

	if (!nextStatus) {
		return json(
			{
				error: 'invalid_transition',
				message: `Cannot transition from "${currentStatus}" — order is already in its final state`
			},
			{ status: 400 }
		);
	}

	await orderRef.update({ status: nextStatus });

	return json({ success: true });
}

async function handleReorder(
	orderId: string,
	sortOrder: number,
	timeSlot?: string
): Promise<Response> {
	if (sortOrder === undefined || sortOrder === null) {
		return json(
			{ error: 'validation_error', message: 'sortOrder is required for reorder action' },
			{ status: 400 }
		);
	}

	const orderRef = adminDb.collection('orders').doc(orderId);
	const orderSnap = await orderRef.get();

	if (!orderSnap.exists) {
		return json({ error: 'not_found', message: 'Order not found' }, { status: 404 });
	}

	const updateData: Record<string, unknown> = { sortOrder };
	if (timeSlot !== undefined) {
		updateData.timeSlot = timeSlot;
	}

	await orderRef.update(updateData);

	return json({ success: true });
}

const VALID_STATUSES = ['Unpaid', 'Paid', 'Making', 'Made', 'Delivered'];

async function handleSetStatus(orderId: string, status: string): Promise<Response> {
	if (!status || !VALID_STATUSES.includes(status)) {
		return json(
			{ error: 'validation_error', message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
			{ status: 400 }
		);
	}

	const orderRef = adminDb.collection('orders').doc(orderId);
	const orderSnap = await orderRef.get();

	if (!orderSnap.exists) {
		return json({ error: 'not_found', message: 'Order not found' }, { status: 404 });
	}

	await orderRef.update({ status });

	return json({ success: true });
}
