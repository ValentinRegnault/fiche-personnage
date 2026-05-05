export type Ability =
	| 'strength'
	| 'dexterity'
	| 'constitution'
	| 'intelligence'
	| 'wisdom'
	| 'charisma';
export type Skill =
	| 'acrobatics'
	| 'animalHandling'
	| 'arcana'
	| 'athletics'
	| 'deception'
	| 'history'
	| 'insight'
	| 'intimidation'
	| 'investigation'
	| 'medicine'
	| 'nature'
	| 'perception'
	| 'performance'
	| 'persuasion'
	| 'religion'
	| 'sleightOfHand'
	| 'stealth'
	| 'survival';

export interface Campaign {
	id: string;
	name: string;
	dm: string;
}

export interface CharacterItem {
	id: string;
	name: string;
	quantity: number;
	description?: string;
	isEquipped?: boolean;
	isCustom?: boolean;
	weight?: number;
	notes?: string;
	description?: string;
	isCustom?: boolean;
}

export interface CharacterSpell {
	id: string;
	name: string;
	level: number;
	isPrepared: boolean; // Pour prep ou grimmoire
}

export interface CharacterFeature {
	id: string;
	name: string;
	description: string;
	source: string; // "race", "class", "background", etc
}

export interface Character {
	id: string;
	campaignId: string;
	name: string;
	species: string;
	background: string;
	class: string;
	level: number;

	height: string;
	speed: string;
	armorClass: number;
	initiativeBonus: number;

	abilities: Record<Ability, number>;
	saveProficiencies: Partial<Record<Ability, boolean>>;

	skillProficiencies: Partial<Record<Skill, boolean>>;
	expertise: Partial<Record<Skill, boolean>>;

	toolProficiencies: string;
	weaponProficiencies: string;
	hitPoints: { current: number; max: number };
	hitDice: { total: number; used: number };
	lastLongRestAt?: number;
	arcaneRecoveryUsed?: boolean;

	items: CharacterItem[];
	spells: CharacterSpell[];
	features: CharacterFeature[];

	spellcastingAbility?: Ability;
	spellSlots: Record<number, { total: number; used: number }>;
}

export const SKILLS_CONFIG: Record<Skill, { name: string; stat: Ability }> = {
	acrobatics: { name: 'Acrobaties', stat: 'dexterity' },
	animalHandling: { name: 'Dressage', stat: 'wisdom' },
	arcana: { name: 'Arcanes', stat: 'intelligence' },
	athletics: { name: 'Athlétisme', stat: 'strength' },
	deception: { name: 'Tromperie', stat: 'charisma' },
	history: { name: 'Histoire', stat: 'intelligence' },
	insight: { name: 'Perspicacité', stat: 'wisdom' },
	intimidation: { name: 'Intimidation', stat: 'charisma' },
	investigation: { name: 'Investigation', stat: 'intelligence' },
	medicine: { name: 'Médecine', stat: 'wisdom' },
	nature: { name: 'Nature', stat: 'intelligence' },
	perception: { name: 'Perception', stat: 'wisdom' },
	performance: { name: 'Représentation', stat: 'charisma' },
	persuasion: { name: 'Persuasion', stat: 'charisma' },
	religion: { name: 'Religion', stat: 'intelligence' },
	sleightOfHand: { name: 'Escamotage', stat: 'dexterity' },
	stealth: { name: 'Discrétion', stat: 'dexterity' },
	survival: { name: 'Survie', stat: 'wisdom' }
};

export const ABILITIES: Record<Ability, string> = {
	strength: 'Force',
	dexterity: 'Dextérité',
	constitution: 'Constitution',
	intelligence: 'Intelligence',
	wisdom: 'Sagesse',
	charisma: 'Charisme'
};

export function calculateModifier(score: number): number {
	return Math.floor((score - 10) / 2);
}

export function calculateProficiencyBonus(level: number): number {
	return Math.ceil(1 + level / 4);
}
