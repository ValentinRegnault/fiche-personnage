import { writable, get } from 'svelte/store';
import type { Campaign, Character } from './types';
import { browser } from '$app/environment';

// Store declaration
export const campaignsStore = writable<Campaign[]>([]);
export const charactersStore = writable<Character[]>([]);

let initialized = false;

// Initialize with data from server
export async function initStore() {
	if (!browser || initialized) return;

	try {
		const res = await fetch('/api/save');
		if (res.ok) {
			const data = await res.json();
			if (data.campaigns) campaignsStore.set(data.campaigns);
			if (data.characters) charactersStore.set(data.characters);
			initialized = true;
		}
	} catch (e) {
		console.error('Failed to initialize local data', e);
	}
}

// Persist to server on every change
// We use a small debounce to not hit the server too intensely on fast edits
if (browser) {
	let timeout: NodeJS.Timeout;
	function saveToServer() {
		if (!initialized) return;
		clearTimeout(timeout);
		timeout = setTimeout(async () => {
			try {
				await fetch('/api/save', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						campaigns: get(campaignsStore),
						characters: get(charactersStore)
					})
				});
			} catch (e) {
				console.error('Failed to save to server', e);
			}
		}, 500);
	}

	campaignsStore.subscribe(() => saveToServer());
	charactersStore.subscribe(() => saveToServer());
}

export function generateId(): string {
	return typeof crypto !== 'undefined' && crypto.randomUUID
		? crypto.randomUUID()
		: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function addCampaign(name: string, dm: string) {
	const id = generateId();
	campaignsStore.update((lists) => [...lists, { id, name, dm }]);
}

export function addCharacter(campaignId: string, name: string) {
	const id = generateId();
	const char: Character = {
		id,
		campaignId,
		name,
		species: '',
		background: '',
		class: '',
		level: 1,
		height: 'Medium',
		speed: '30 ft.',
		armorClass: 10,
		initiativeBonus: 0,
		abilities: {
			strength: 10,
			dexterity: 10,
			constitution: 10,
			intelligence: 10,
			wisdom: 10,
			charisma: 10
		},
		saveProficiencies: {},
		skillProficiencies: {},
		expertise: {},
		toolProficiencies: '',
		weaponProficiencies: '',
		arcaneRecoveryUsed: false,
		items: [],
		spells: [],
		features: [],
		spellSlots: {
			1: { total: 0, used: 0 },
			2: { total: 0, used: 0 },
			3: { total: 0, used: 0 },
			4: { total: 0, used: 0 },
			5: { total: 0, used: 0 },
			6: { total: 0, used: 0 },
			7: { total: 0, used: 0 },
			8: { total: 0, used: 0 },
			9: { total: 0, used: 0 }
		}
	};
	charactersStore.update((lists) => [...lists, char]);
	return id;
}

export function updateCharacterField<K extends keyof Character>(
	charId: string,
	field: K,
	value: any
) {
	charactersStore.update((lists) => {
		return lists.map((c) => {
			if (c.id === charId) {
				return { ...c, [field]: value };
			}
			return c;
		});
	});
}
