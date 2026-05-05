import fs from 'fs/promises';
import path from 'path';

export async function load() {
	const contentPath = path.resolve('static/dnd-content.json');
	const file = await fs.readFile(contentPath, 'utf8');
	const data = JSON.parse(file);

	// Ne renvoyer que le strict nécessaire pour éviter d'exploser le payload
	const classes = data.classes.map((c: any) => ({
		id: c.id,
		name: c.name,
                spellAbility: c.spellAbility,
		classFeatures: c.classFeatures
	}));

	const species = data.species.map((s) => ({
		id: s.id,
		name: s.name,
		size: s.size,
		speed: s.speed,
		features: s.features
	}));

	const spells = data.spells.map((sp: any) => ({
		id: sp.id,
		title: sp.title,
		level: sp.level,
		school: sp.school,
		castingTime: sp.castingTime,
		range: sp.range,
		duration: sp.duration,
		description: sp.description,
		tags: sp.tags || []
	}));

	const backgrounds = data.backgrounds.map((bg: any) => ({
		id: bg.id,
		name: bg.name,
		features: bg.features
	}));

	return {
		availableClasses: classes,
		availableSpecies: species,
		availableSpells: spells,
		availableItems: data.items,
		availableBackgrounds: backgrounds
	};
}
