import type { DrinkItem, AddOnItem, DessertItem } from '$lib/types';

export const drinks: DrinkItem[] = [
	{
		id: 'matcha-latte',
		name: 'Matcha Latte',
		price: 8.5,
		description: '5g Matcha + Agave'
	},
	{
		id: 'double-matcha',
		name: 'Double Matcha',
		price: 9.75,
		description: '7g Matcha + Matcha Cream Top'
	},
	{
		id: 'coconut-cloud-matcha',
		name: 'Coconut Cloud Matcha',
		price: 8.75,
		description: 'Coconut water + Matcha Cream Top'
	},
	{
		id: 'mango-coconut-matcha',
		name: 'Mango Coconut Matcha',
		price: 9.75,
		description: 'Matcha + Mango Puree + Coconut + Vanilla'
	},
	{
		id: 'banana-pudding-matcha',
		name: 'Banana Pudding Matcha',
		price: 9.75,
		description: 'Matcha + Banana Pudding'
	},
	{
		id: 'ube-banana-pudding-matcha',
		name: 'Ube Banana Pudding Matcha',
		price: 9.75,
		description: 'Matcha + Ube Banana Pudding'
	},
	{
		id: 'cookie-butter-matcha',
		name: 'Cookie Butter Matcha',
		price: 10.0,
		description: 'Matcha + Cookie Butter Banana Pudding'
	}
];

export const addOns: AddOnItem[] = [
	{
		id: 'cream-top',
		name: 'Cream Top',
		price: 1.0,
		description: 'Vanilla or Kinako'
	},
	{
		id: 'oat-milk',
		name: 'Oat Milk',
		price: 0.75,
		description: 'Substitute or extra'
	},
	{
		id: 'vanilla-syrup',
		name: 'Vanilla Syrup',
		price: 0.5,
		description: 'Extra sweetness'
	},
	{
		id: 'extra-banana-pudding',
		name: 'Extra Banana Pudding',
		price: 2.0,
		description: 'Additional banana pudding layer'
	}
];

export const desserts: DessertItem[] = [
	{
		id: 'matcha-tiramisu-brownie',
		name: 'Matcha Tiramisu Brownie',
		price: 8.5,
		description: 'Rich brownie with matcha tiramisu layers',
		isPartySized: false
	},
	{
		id: 'banana-pudding-cup',
		name: 'Banana Pudding Cup',
		price: 8.5,
		description: 'Creamy banana pudding in a single-serve cup',
		isPartySized: false
	},
	{
		id: 'ube-banana-pudding-cup',
		name: 'Ube Banana Pudding Cup',
		price: 8.5,
		description: 'Ube-infused banana pudding in a single-serve cup',
		isPartySized: false
	}
];

export const partySizedDesserts: DessertItem[] = [
	{
		id: '6x6-matcha-tiramisu-brownie',
		name: '6x6 Matcha Tiramisu Brownie',
		price: 40.0,
		description: 'Party-sized brownie tray, serves 6-8',
		isPartySized: true,
		advanceNoticeDays: 7
	},
	{
		id: '9x9-matcha-tiramisu-brownie',
		name: '9x9 Matcha Tiramisu Brownie',
		price: 85.0,
		description: 'Large party tray, serves 12-16',
		isPartySized: true,
		advanceNoticeDays: 7
	},
	{
		id: 'banana-pudding-half-pan',
		name: 'Banana Pudding Half Pan',
		price: 50.0,
		description: 'Half pan of banana pudding, serves 8-10',
		isPartySized: true,
		advanceNoticeDays: 7
	},
	{
		id: 'ube-banana-pudding-half-pan',
		name: 'Ube Banana Pudding Half Pan',
		price: 50.0,
		description: 'Half pan of ube banana pudding, serves 8-10',
		isPartySized: true,
		advanceNoticeDays: 7
	},
	{
		id: 'cookie-butter-pudding-half-pan',
		name: 'Cookie Butter Pudding Half Pan',
		price: 60.0,
		description: 'Half pan of cookie butter pudding, serves 8-10',
		isPartySized: true,
		advanceNoticeDays: 7
	}
];
