// Firestore Timestamp representation (serialized from server)
export interface FirestoreTimestamp {
	_seconds: number;
	_nanoseconds: number;
}

// Menu item types
export interface DrinkItem {
	id: string;
	name: string;
	price: number;
	description: string;
	cost?: number; // cost to make (for profit tracking)
	available?: boolean; // defaults to true if not set
}

export interface AddOnItem {
	id: string;
	name: string;
	price: number;
	description?: string;
	cost?: number; // cost to make (for profit tracking)
	available?: boolean;
}

export interface DessertItem {
	id: string;
	name: string;
	price: number;
	description?: string;
	isPartySized: boolean;
	advanceNoticeDays?: number; // 7 for party-sized
	cost?: number; // cost to make (for profit tracking)
	available?: boolean;
}

// Time slot (generated client-side, not stored in Firestore)
export interface TimeSlot {
	id: string; // deterministic ID e.g. "2025-01-18_09:00"
	date: string; // ISO date string YYYY-MM-DD
	time: string; // HH:mm format (start of 15-min window)
	dayOfWeek: 'Saturday' | 'Sunday';
}

// Order
export interface Order {
	id: string;
	shortId: string; // short 6-char order ID for customer reference
	firstName: string;
	lastName: string;
	phone: string;
	items: OrderItem[];
	timeSlot: string; // time slot ID e.g. "2025-01-18_09:00"
	comments: string; // special requests / comments
	status: 'Unpaid' | 'Paid' | 'Making' | 'Made' | 'Delivered';
	totalPrice: number;
	sortOrder: number; // position within time slot for drag-and-drop ordering
	hasPartySizedDessert: boolean;
	createdAt: FirestoreTimestamp;
}

export interface OrderItem {
	menuItemId: string;
	name: string;
	quantity: number;
	price: number; // unit price
	category: 'drink' | 'addon' | 'dessert' | 'party-dessert';
}

// Order form submission payload
export interface OrderSubmission {
	firstName: string;
	lastName: string;
	phone: string;
	items: { menuItemId: string; quantity: number }[];
	timeSlot: string; // time slot ID
	comments?: string;
}

// Admin session
export interface AdminSession {
	authenticated: boolean;
	expiresAt: number;
}
