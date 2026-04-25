<script lang="ts">
	import { page } from '$app/stores';
	import { charactersStore, updateCharacterField } from '$lib/store';
	import type { Character } from '$lib/types';
	import {
		Dices,
		CheckCircle2,
		Circle,
		Backpack,
		Stars,
		Plus,
		Trash2,
		Sparkles,
		ArrowLeft,
		Edit3,
		ShieldAlert,
		FastForward,
		Wand2,
		Search,
		X,
		RotateCcw,
		Minus
	} from 'lucide-svelte';

	let { data } = $props();
	const {
		availableClasses,
		availableSpecies,
		availableSpells,
		availableItems,
		availableBackgrounds
	} = data;

	const charId = $derived($page.params.id);
	const char = $derived($charactersStore.find((c) => c.id === charId));

	function getMod(score: number) {
		return Math.floor((score - 10) / 2);
	}

	function formatMod(mod: number) {
		return mod >= 0 ? '+' + mod : '' + mod;
	}

	const proficiencyBonus = $derived(char ? Math.ceil(1 + char.level / 4) : 2);
	const passivePerception = $derived(char ? 10 + getMod(char.abilities.wisdom) : 10);

	const STATS = [
		{ key: 'strength', label: 'Force', abbr: 'FOR' },
		{ key: 'dexterity', label: 'Dextérité', abbr: 'DEX' },
		{ key: 'constitution', label: 'Constitution', abbr: 'CON' },
		{ key: 'intelligence', label: 'Intelligence', abbr: 'INT' },
		{ key: 'wisdom', label: 'Sagesse', abbr: 'SAG' },
		{ key: 'charisma', label: 'Charisme', abbr: 'CHA' }
	] as const;

	const STAT_NAME_TO_KEY: Record<string, keyof Character['abilities']> = {
		strength: 'strength',
		force: 'strength',
		dexterity: 'dexterity',
		dexterite: 'dexterity',
		constitution: 'constitution',
		intelligence: 'intelligence',
		wisdom: 'wisdom',
		sagesse: 'wisdom',
		charisma: 'charisma',
		charisme: 'charisma'
	};

	function normalizeStatKey(statName: string): keyof Character['abilities'] | null {
		const normalized = statName
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim();
		return STAT_NAME_TO_KEY[normalized] ?? null;
	}

	const LEGACY_CLASS_NAME_MAP: Record<string, string> = {
		barbarian: 'Barbare',
		bard: 'Barde',
		cleric: 'Clerc',
		druid: 'Druide',
		fighter: 'Combattant',
		monk: 'Moine',
		paladin: 'Paladin',
		ranger: 'Ranger',
		rogue: 'Voyou',
		sorcerer: 'Sorcier',
		warlock: 'Sorcier',
		wizard: 'Magicien'
	};

	function normalizeClassName(className: string) {
		if (!className) return className;
		const key = className.trim().toLowerCase();
		return LEGACY_CLASS_NAME_MAP[key] || className;
	}

	const SKILLS = [
		{ key: 'acrobatics', label: 'Acrobatie', stat: 'dexterity' },
		{ key: 'animalHandling', label: 'Dressage', stat: 'wisdom' },
		{ key: 'arcana', label: 'Arcanes', stat: 'intelligence' },
		{ key: 'athletics', label: 'Athlétisme', stat: 'strength' },
		{ key: 'deception', label: 'Tromperie', stat: 'charisma' },
		{ key: 'history', label: 'Histoire', stat: 'intelligence' },
		{ key: 'insight', label: 'Perspicacité', stat: 'wisdom' },
		{ key: 'intimidation', label: 'Intimidation', stat: 'charisma' },
		{ key: 'investigation', label: 'Investigation', stat: 'intelligence' },
		{ key: 'medicine', label: 'Médecine', stat: 'wisdom' },
		{ key: 'nature', label: 'Nature', stat: 'intelligence' },
		{ key: 'perception', label: 'Perception', stat: 'wisdom' },
		{ key: 'performance', label: 'Représentation', stat: 'charisma' },
		{ key: 'persuasion', label: 'Persuasion', stat: 'charisma' },
		{ key: 'religion', label: 'Religion', stat: 'intelligence' },
		{ key: 'sleightOfHand', label: 'Escamotage', stat: 'dexterity' },
		{ key: 'stealth', label: 'Discrétion', stat: 'dexterity' },
		{ key: 'survival', label: 'Survie', stat: 'wisdom' }
	] as const;

	const classFeatures = $derived((char?.features || []).filter((f) => f.source === 'Classe'));
	const speciesFeatures = $derived((char?.features || []).filter((f) => f.source === 'Espèce'));
	const backgroundFeatures = $derived(
		(char?.features || []).filter((f) => f.source === 'Historique')
	);
	const otherFeatures = $derived(
		(char?.features || []).filter(
			(f) => f.source !== 'Classe' && f.source !== 'Espèce' && f.source !== 'Historique'
		)
	);

	const maxHitPoints = $derived.by(() => {
		if (!char) return 0;
		return char.hitPoints?.max ?? 10;
	});

	const currentHitPoints = $derived.by(() => {
		if (!char) return 0;
		return Math.max(0, Math.min(char.hitPoints?.current ?? maxHitPoints, maxHitPoints));
	});

	const totalHitDice = $derived.by(() => {
		if (!char) return 0;
		return char.hitDice?.total ?? Math.max(1, char.level || 1);
	});

	const usedHitDice = $derived.by(() => {
		if (!char) return 0;
		return Math.max(0, Math.min(char.hitDice?.used ?? 0, totalHitDice));
	});

	const availableHitDice = $derived(Math.max(0, totalHitDice - usedHitDice));

	function updateField(field: keyof Character, value: any) {
		if (!char) return;
		updateCharacterField(charId, field, value);
		if (field === 'level') {
			const newLevel = Math.max(1, Number(value) || 1);
			const currentUsed = char.hitDice?.used ?? 0;
			updateCharacterField(charId, 'hitDice', {
				total: newLevel,
				used: Math.min(currentUsed, newLevel)
			});
		}
		if (field === 'level' && char.class) {
			changeClass(char.class, value);
		}
	}

	let isRestModalOpen = $state(false);
	type RestMode = 'short' | 'long';
	let restMode = $state<RestMode>('short');
	let shortRestDiceCount = $state(0);
	let shortRestRolls = $state<number[]>([]);

	function getClassHitDieSize(className: string) {
		const normalized = normalizeClassName(className);
		const d12 = ['Barbare'];
		const d10 = ['Combattant', 'Paladin', 'Ranger'];
		const d8 = ['Barde', 'Clerc', 'Druide', 'Moine', 'Roublard', 'Voyou', 'Sorcier', 'Occultiste'];
		if (d12.includes(normalized)) return 12;
		if (d10.includes(normalized)) return 10;
		if (d8.includes(normalized)) return 8;
		return 6;
	}

	function openRestModal(mode: RestMode) {
		restMode = mode;
		shortRestDiceCount = 0;
		shortRestRolls = [];
		isRestModalOpen = true;
	}

	function closeRestModal() {
		isRestModalOpen = false;
	}

	function setShortRestDiceCount(value: number) {
		const count = Math.max(0, Math.min(value, availableHitDice));
		shortRestDiceCount = count;
		shortRestRolls = Array.from({ length: count }, (_, idx) => shortRestRolls[idx] || 0);
	}

	function updateShortRestRoll(index: number, value: number) {
		const rolls = [...shortRestRolls];
		rolls[index] = Math.max(0, value || 0);
		shortRestRolls = rolls;
	}

	const constitutionModifier = $derived.by(() => (char ? getMod(char.abilities.constitution) : 0));

	const shortRestHealingTotal = $derived.by(() => {
		if (!char || shortRestDiceCount <= 0) return 0;
		return shortRestRolls
			.slice(0, shortRestDiceCount)
			.reduce((sum, roll) => sum + Math.max(0, (roll || 0) + constitutionModifier), 0);
	});

	function applyShortRest() {
		if (!char) return;
		if (shortRestDiceCount <= 0) return;
		const healedHp = Math.min(maxHitPoints, currentHitPoints + shortRestHealingTotal);
		const newUsedHitDice = Math.min(totalHitDice, usedHitDice + shortRestDiceCount);
		updateField('hitPoints', { current: healedHp, max: maxHitPoints });
		updateField('hitDice', { total: totalHitDice, used: newUsedHitDice });
		closeRestModal();
	}

	const longRestRecoverHitDice = $derived.by(() => Math.max(1, Math.floor(totalHitDice / 2)));

	function applyLongRest() {
		if (!char) return;
		const recovered = Math.min(usedHitDice, longRestRecoverHitDice);
		const resetSpellSlots = Object.fromEntries(
			Object.entries(char.spellSlots || {}).map(([level, slot]: [string, any]) => [
				level,
				{ ...slot, used: 0 }
			])
		);
		updateField('hitPoints', { current: maxHitPoints, max: maxHitPoints });
		updateField('hitDice', { total: totalHitDice, used: Math.max(0, usedHitDice - recovered) });
		updateField('spellSlots', resetSpellSlots);
		closeRestModal();
	}

	function changeSpecies(val: string) {
		if (!char) return;
		const spec = availableSpecies?.find((s: any) => s.name === val);
		charactersStore.update((lists) =>
			lists.map((c) => {
				if (c.id !== charId) return c;
				const newC = { ...c, species: val };
				if (spec) {
					if (spec.size) newC.height = spec.size;
					if (spec.speed) newC.speed = spec.speed;
					if (spec.features) {
						const otherFeatures = (newC.features || []).filter((f) => f.source !== 'Espèce');
						const newFeatures = spec.features.map((f: any) => ({
							id: crypto.randomUUID(),
							name: f.name,
							description: f.description,
							source: 'Espèce'
						}));
						newC.features = [...otherFeatures, ...newFeatures];
					}
				}
				return newC;
			})
		);
	}

	function changeBackground(val: string) {
		if (!char) return;
		const bg = availableBackgrounds?.find((b: any) => b.name === val);
		charactersStore.update((lists) =>
			lists.map((c) => {
				if (c.id !== charId) return c;
				const newC = { ...c, background: val };
				const preservedFeatures = (newC.features || []).filter((f) => f.source !== 'Historique');
				const newBackgroundFeatures = (bg?.features || []).map((f: any) => ({
					id: crypto.randomUUID(),
					name: f.name,
					description: f.description,
					source: 'Historique'
				}));
				newC.features = [...preservedFeatures, ...newBackgroundFeatures];
				return newC;
			})
		);
	}

	function changeClass(val: string, forcedLevel?: number) {
		if (!char) return;
		const normalizedClass = normalizeClassName(val);
		const cls = availableClasses?.find(
			(c: any) => c.name === normalizedClass || c.id === val || c.id === normalizedClass
		);
		charactersStore.update((lists) =>
			lists.map((c) => {
				if (c.id !== charId) return c;
				const newLevel = forcedLevel || c.level || 1;
				const newC = { ...c, class: normalizedClass, level: newLevel };
				if (cls) {
					if (cls.savingThrowProficiencies) {
						const baseSaves = { ...newC.saveProficiencies };
						['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(
							(k) => {
								baseSaves[k as keyof typeof baseSaves] = false;
							}
						);
						cls.savingThrowProficiencies.forEach((statName: string) => {
							const key = normalizeStatKey(statName);
							if (key) baseSaves[key] = true;
						});
						newC.saveProficiencies = baseSaves;
					}
					if (cls.classFeatures) {
						const otherFeatures = (newC.features || []).filter((f) => f.source !== 'Classe');
						const newFeatures: any[] = [];
						for (let lvl = 1; lvl <= (newC.level || 1); lvl++) {
							const levelFeatures = cls.classFeatures[lvl.toString()] || [];
							levelFeatures.forEach((f: any) => {
								newFeatures.push({
									id: crypto.randomUUID(),
									name: f.name,
									description: f.description,
									source: 'Classe'
								});
							});
						}
						newC.features = [...otherFeatures, ...newFeatures];
					}
				}
				return newC;
			})
		);
	}

	function updateAbility(statKey: keyof Character['abilities'], value: number) {
		if (!char) return;
		const newAbilities = { ...char.abilities, [statKey]: value };
		updateField('abilities', newAbilities);
	}

	function toggleSaveProficiency(statKey: keyof Character['abilities']) {
		if (!char) return;
		const profs = { ...char.saveProficiencies };
		profs[statKey] = !profs[statKey];
		updateField('saveProficiencies', profs);
	}

	function toggleSkillProficiency(skillKey: keyof Character['skillProficiencies']) {
		if (!char) return;
		const profs = { ...char.skillProficiencies };
		profs[skillKey] = !profs[skillKey];
		updateField('skillProficiencies', profs);
	}

	function getSaveTotal(statKey: keyof Character['abilities']) {
		if (!char) return 0;
		const base = getMod(char.abilities[statKey]);
		const isProf = char.saveProficiencies[statKey];
		const bonus = isProf ? proficiencyBonus : 0;
		return base + bonus;
	}

	function getSkillTotal(skill: (typeof SKILLS)[0]) {
		if (!char) return 0;
		const base = getMod(char.abilities[skill.stat as keyof Character['abilities']]);
		const isProficient =
			char.skillProficiencies[skill.key as keyof Character['skillProficiencies']];
		const bonus = isProficient ? proficiencyBonus : 0;
		return base + bonus;
	}

	function addItem() {
		if (!char) return;
		const items = [
			...char.items,
			{ id: crypto.randomUUID(), name: '', quantity: 1, isEquipped: false }
		];
		updateField('items', items);
	}

	function updateItem(
		itemId: string,
		field: 'name' | 'quantity' | 'isEquipped' | 'description',
		value: any
	) {
		if (!char) return;
		const items = char.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i));
		updateField('items', items);
	}

	function removeItem(itemId: string) {
		if (!char) return;
		const items = char.items.filter((i) => i.id !== itemId);
		updateField('items', items);
	}

	function addFeature() {
		if (!char) return;
		const features = [
			...char.features,
			{ id: crypto.randomUUID(), name: '', description: '', source: 'Origine' }
		];
		updateField('features', features);
	}

	function removeFeature(featureId: string) {
		if (!char) return;
		const features = char.features.filter((f) => f.id !== featureId);
		updateField('features', features);
	}

	type DescBlock =
		| { type: 'text'; content: string }
		| { type: 'table'; headers: string[]; rows: string[][] };

	function parseDescription(text: string): DescBlock[] {
		if (!text) return [];
		const lines = text.split('\n');
		const blocks: DescBlock[] = [];
		let currentText = '';
		let currentTable: { headers: string[]; rows: string[][] } | null = null;

		for (const line of lines) {
			if (line.includes('|')) {
				if (!currentTable) {
					if (currentText.trim()) {
						blocks.push({ type: 'text', content: currentText.trim() });
					}
					currentText = '';
					currentTable = { headers: line.split('|').map((s) => s.trim()), rows: [] };
				} else {
					// Ignore markdown separator lines like ---|---
					if (line.replace(/[\s|\\-]/g, '') === '') continue;
					currentTable.rows.push(line.split('|').map((s) => s.trim()));
				}
			} else {
				if (currentTable) {
					blocks.push({ type: 'table', ...currentTable });
					currentTable = null;
				}
				currentText += (currentText ? '\n' : '') + line;
			}
		}

		if (currentText.trim()) {
			blocks.push({ type: 'text', content: currentText.trim() });
		}
		if (currentTable) {
			blocks.push({ type: 'table', ...currentTable });
		}
		return blocks;
	}

	// SPELL MANAGMENT
	const KNOWN_CASTERS = ['Barde', 'Ranger', 'Sorcier'];
	const PREPARED_CASTERS = ['Clerc', 'Druide', 'Paladin'];
	const GRIMOIRE_CASTERS = ['Magicien'];

	const isCaster = $derived(
		char &&
			(KNOWN_CASTERS.includes(normalizeClassName(char.class)) ||
				PREPARED_CASTERS.includes(normalizeClassName(char.class)) ||
				GRIMOIRE_CASTERS.includes(normalizeClassName(char.class)))
	);

	const casterType = $derived(
		char
			? GRIMOIRE_CASTERS.includes(normalizeClassName(char.class))
				? 'grimoire'
				: PREPARED_CASTERS.includes(normalizeClassName(char.class))
					? 'prepared'
					: KNOWN_CASTERS.includes(normalizeClassName(char.class))
						? 'known'
						: 'none'
			: 'none'
	);

	const classSpellcastingInfo = $derived.by(() => {
		if (!char || !char.class || !char.level) return null;
		const normalizedClass = normalizeClassName(char.class);
		const cls = availableClasses.find(
			(c: any) => c.name === normalizedClass || c.id === char.class || c.id === normalizedClass
		);
		if (!cls || !cls.classFeatures) return null;

		const levelStr = char.level.toString();
		for (const lvl of Object.keys(cls.classFeatures)) {
			const featuresAtLvl = cls.classFeatures[lvl] || [];
			for (const feature of featuresAtLvl) {
				if (
					feature.type?.includes('Spellcasting') ||
					feature.name?.includes('Spellcasting') ||
					feature.name?.includes('Pact Magic') ||
					feature.spellSlotsPerLevel
				) {
					const slotsArr = feature.spellSlotsPerLevel?.[levelStr] || [];
					const preparedSpellsStr = feature.preparedSpells?.[levelStr];
					const cantripsStr = feature.cantrips?.[levelStr];

					return {
						spellSlots: slotsArr,
						preparedSpellsCount: preparedSpellsStr ? parseInt(preparedSpellsStr) : 0,
						cantripsCount: cantripsStr ? parseInt(cantripsStr) : 0
					};
				}
			}
		}
		return null;
	});

	let isItemModalOpen = $state(false);
	let itemSearchQuery = $state('');

	const filteredItems = $derived.by(() => {
		const q = itemSearchQuery.toLowerCase();
		return (availableItems || []).filter(
			(i: any) => i.title.toLowerCase().includes(q) || (i.type && i.type.toLowerCase().includes(q))
		);
	});

	function openItemModal() {
		itemSearchQuery = '';
		isItemModalOpen = true;
	}

	function closeItemModal() {
		isItemModalOpen = false;
	}

	function addItemFromCatalog(contentItem: any) {
		if (!char) return;
		const items = [
			...char.items,
			{
				id: crypto.randomUUID(),
				name: contentItem.title,
				description: contentItem.description,
				quantity: 1,
				isEquipped: false,
				isCustom: false
			}
		];
		updateField('items', items);
		closeItemModal();
	}

	function addCustomItem() {
		if (!char) return;
		const items = [
			...char.items,
			{
				id: crypto.randomUUID(),
				name: 'Nouvel objet',
				description: '',
				quantity: 1,
				isEquipped: false,
				isCustom: true
			}
		];
		updateField('items', items);
		closeItemModal();
	}

	let isSpellModalOpen = $state(false);
	let spellModalMode = $state<'global' | 'grimoire'>('global');
	let spellSearchQuery = $state('');

	const maxSpellLevel = $derived.by(() => {
		if (!classSpellcastingInfo?.spellSlots) return 0;
		let max = 0;
		for (let i = 0; i < classSpellcastingInfo.spellSlots.length; i++) {
			if (classSpellcastingInfo.spellSlots[i] > 0) {
				max = i + 1;
			}
		}
		return max;
	});

	const filteredSpells = $derived.by(() => {
		if (!char) return [];
		const q = spellSearchQuery.toLowerCase();
		if (spellModalMode === 'global') {
			return (availableSpells || []).filter((s: any) => {
				const matchName = s.title.toLowerCase().includes(q);
				const matchClass = s.tags && s.tags.some((t: string) => t.includes(char.class));
				const matchLevel = s.level <= maxSpellLevel;
				return matchName && matchClass && matchLevel;
			});
		} else {
			return (char.spells || []).filter(
				(s: any) => s.name.toLowerCase().includes(q) && !s.isPrepared
			);
		}
	});

	function openSpellModal(mode: 'global' | 'grimoire' = 'global') {
		spellModalMode = mode;
		spellSearchQuery = '';
		isSpellModalOpen = true;
	}

	function closeSpellModal() {
		isSpellModalOpen = false;
		spellSearchQuery = '';
	}

	function learnSpell(spell: any) {
		if (!char) return;

		if (spellModalMode === 'grimoire') {
			toggleSpellPrepared(spell.id);
			closeSpellModal();
			return;
		}

		if (char.spells?.some((s) => s.name === spell.title)) return;

		const currentSpells = char.spells || [];
		const newSpell = {
			id: crypto.randomUUID(),
			name: spell.title,
			level: spell.level,
			isPrepared: casterType === 'grimoire' ? false : true
		};
		updateField('spells', [...currentSpells, newSpell]);
		closeSpellModal();
	}

	function unlearnSpell(spellId: string) {
		if (!char) return;
		const currentSpells = char.spells || [];
		updateField(
			'spells',
			currentSpells.filter((s) => s.id !== spellId)
		);
	}

	function toggleSpellPrepared(spellId: string) {
		if (!char) return;
		const currentSpells = char.spells || [];
		const updatedSpells = currentSpells.map((s) =>
			s.id === spellId ? { ...s, isPrepared: !s.isPrepared } : s
		);
		updateField('spells', updatedSpells);
	}

	const activeSpellsFlat = $derived(
		char?.spells?.filter((s) => s.isPrepared).sort((a: any, b: any) => a.level - b.level) || []
	);

	const preparedCantripsCount = $derived(activeSpellsFlat.filter((s) => s.level === 0).length);

	const grimoireSpellsFlat = $derived(
		char?.spells?.sort((a: any, b: any) => a.level - b.level) || []
	);

	function getSpellDetails(spellName: string) {
		return availableSpells?.find(
			(s: any) =>
				s.title.toLowerCase() === spellName.toLowerCase() ||
				(s.name && s.name.toLowerCase() === spellName.toLowerCase())
		);
	}
</script>

{#if !char}
	<div class="p-8 text-center">Recherche de ce héros dans les archives...</div>
{:else}
	<div class="mx-auto max-w-6xl p-4 md:p-8">
		<a
			href="/campaign/{char.campaignId}"
			class="mb-4 inline-flex items-center text-[--color-parchment-800] hover:text-[--color-parchment-900]"
		>
			<ArrowLeft class="mr-2 h-4 w-4" /> La Taverne (Campagne)
		</a>

		<div
			class="mb-8 overflow-hidden rounded-xl border-2 border-[--color-parchment-400] bg-white shadow-lg"
		>
			<!-- Header Banner -->
			<div
				class="flex flex-col justify-between gap-4 bg-[--color-parchment-800] px-6 py-4 text-[--color-parchment-100] md:flex-row md:items-center"
			>
				<div>
					<input
						type="text"
						value={char.name}
						oninput={(e) => updateField('name', e.currentTarget.value)}
						class="mb-1 w-full bg-transparent font-serif text-3xl font-bold placeholder-[--color-parchment-400] outline-none"
						placeholder="Nom du héros"
					/>
				</div>
				<div class="flex flex-wrap items-end gap-4 text-sm font-bold">
					<div class="flex flex-col items-center">
						<span class="text-[--color-parchment-400]">NIVEAU</span>
						<input
							type="number"
							min="1"
							max="20"
							class="w-12 bg-transparent text-center text-xl outline-none"
							value={char.level}
							oninput={(e) => updateField('level', parseInt(e.currentTarget.value) || 1)}
						/>
					</div>
					<div class="flex flex-col items-center">
						<span class="text-[--color-parchment-400]">BONUS MAÎTRISE</span>
						<span class="text-xl">+{proficiencyBonus}</span>
					</div>
					<div class="flex flex-col items-center">
						<span class="text-[--color-parchment-400]">PV</span>
						<span class="text-xl">{currentHitPoints}/{maxHitPoints}</span>
					</div>
					<div class="flex flex-col items-center">
						<span class="text-[--color-parchment-400]">DÉS DE VIE</span>
						<span class="text-xl">{availableHitDice}/{totalHitDice}</span>
					</div>
					<div class="flex flex-col items-center">
						<span class="text-[--color-parchment-400]">PERCEPTION PASSIVE</span>
						<span class="text-xl">{passivePerception}</span>
					</div>
					<div class="ml-2 flex gap-2">
						<button
							onclick={() => openRestModal('short')}
							class="rounded border border-[--color-parchment-300] px-3 py-1 text-xs font-bold text-[--color-parchment-100] transition-colors hover:bg-[--color-parchment-700]"
						>
							Short Rest
						</button>
						<button
							onclick={() => openRestModal('long')}
							class="rounded bg-white px-3 py-1 text-xs font-bold text-[--color-parchment-900] transition-colors hover:bg-[--color-parchment-300]"
						>
							Long Rest
						</button>
					</div>
				</div>
			</div>

			<!-- Info Bar -->
			<div class="grid grid-cols-1 gap-px bg-[--color-parchment-400] md:grid-cols-4">
				<div class="flex flex-col bg-white p-4">
					<span class="text-xs font-bold text-[--color-parchment-800] uppercase">Espèce</span>
					<select
						class="cursor-pointer border-b border-dashed border-[--color-parchment-400] bg-transparent outline-none"
						value={char.species}
						onchange={(e) => changeSpecies(e.currentTarget.value)}
					>
						<option value="">Sélectionner...</option>
						{#each availableSpecies || [] as s}
							<option value={s.name}>{s.name}</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col bg-white p-4">
					<span class="text-xs font-bold text-[--color-parchment-800] uppercase">Classe</span>
					<select
						class="cursor-pointer border-b border-dashed border-[--color-parchment-400] bg-transparent outline-none"
						value={char.class}
						onchange={(e) => changeClass(e.currentTarget.value)}
					>
						<option value="">Sélectionner...</option>
						{#each availableClasses || [] as c}
							<option value={c.name}>{c.name}</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col bg-white p-4">
					<span class="text-xs font-bold text-[--color-parchment-800] uppercase">Historique</span>
					<select
						class="cursor-pointer border-b border-dashed border-[--color-parchment-400] bg-transparent outline-none"
						value={char.background}
						onchange={(e) => changeBackground(e.currentTarget.value)}
					>
						<option value="">Sélectionner...</option>
						{#each availableBackgrounds || [] as bg}
							<option value={bg.name}>{bg.name}</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col bg-white p-4">
					<span class="text-xs font-bold text-[--color-parchment-800] uppercase">Taille</span>
					<input
						type="text"
						class="border-b border-dashed border-[--color-parchment-400] bg-transparent outline-none"
						value={char.height}
						oninput={(e) => updateField('height', e.currentTarget.value)}
					/>
				</div>
			</div>

			<!-- Combat stats bar -->
			<div class="grid grid-cols-3 divide-x border-t border-[--color-parchment-400]">
				<div class="flex items-center justify-center gap-3 p-4">
					<ShieldAlert class="h-8 w-8 text-[--color-parchment-800]" />
					<div class="text-center">
						<span class="block text-xs font-bold text-[--color-parchment-800]">ARMURE (CA)</span>
						<input
							type="number"
							class="w-16 bg-transparent text-center text-2xl font-bold outline-none"
							value={char.armorClass}
							oninput={(e) => updateField('armorClass', parseInt(e.currentTarget.value) || 0)}
						/>
					</div>
				</div>
				<div class="flex items-center justify-center gap-3 p-4">
					<Edit3 class="h-8 w-8 text-[--color-parchment-800]" />
					<div class="text-center">
						<span class="block text-xs font-bold text-[--color-parchment-800]">INITIATIVE</span>
						<div class="flex items-center justify-center">
							<span class="text-2xl font-bold">{char.initiativeBonus >= 0 ? '+' : ''}</span>
							<input
								type="number"
								class="w-12 bg-transparent text-center text-2xl font-bold outline-none"
								value={char.initiativeBonus}
								oninput={(e) =>
									updateField('initiativeBonus', parseInt(e.currentTarget.value) || 0)}
							/>
						</div>
					</div>
				</div>
				<div class="flex items-center justify-center gap-3 p-4">
					<FastForward class="h-8 w-8 text-[--color-parchment-800]" />
					<div class="text-center">
						<span class="block text-xs font-bold text-[--color-parchment-800]">VITESSE</span>
						<input
							type="text"
							class="w-20 bg-transparent text-center text-xl font-bold outline-none"
							value={char.speed}
							oninput={(e) => updateField('speed', e.currentTarget.value)}
						/>
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-8 text-[--color-parchment-900] lg:grid-cols-3">
			<!-- Colonne de gauche: Caractéristiques et Sauvegardes -->
			<div class="flex flex-col gap-6">
				<div class="rounded-xl border border-[--color-parchment-400] bg-white p-6 shadow-sm">
					<h2
						class="mb-6 flex items-center gap-2 border-b-2 border-[--color-parchment-400] pb-2 font-serif text-2xl font-bold"
					>
						<Dices class="h-6 w-6" /> Caractéristiques
					</h2>
					<div class="flex flex-col gap-4">
						{#each STATS as stat}
							{@const score = char.abilities[stat.key]}
							{@const mod = getMod(score)}
							<div
								class="flex items-center justify-between rounded border border-[--color-parchment-400] bg-white/50 p-3"
							>
								<div class="flex flex-col">
									<span
										class="text-sm font-bold tracking-wider text-[--color-parchment-800] uppercase"
										>{stat.label}</span
									>
									<span class="text-[0.65rem] font-bold text-[--color-parchment-800]"
										>{stat.abbr}</span
									>
								</div>
								<div class="flex items-center gap-4">
									<input
										type="number"
										min="1"
										max="30"
										class="w-14 border-b-2 border-[--color-parchment-400] bg-transparent text-center text-xl font-bold focus:border-[--color-parchment-900] focus:outline-none"
										value={score}
										oninput={(e) => updateAbility(stat.key, parseInt(e.currentTarget.value) || 10)}
									/>
									<div
										class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[--color-parchment-800] bg-[--color-parchment-900] text-xl font-bold text-[--color-parchment-100]"
									>
										{formatMod(mod)}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="rounded-xl border border-[--color-parchment-400] bg-white p-6 shadow-sm">
					<h2
						class="mb-4 flex items-center gap-2 border-b-2 border-[--color-parchment-400] pb-2 font-serif text-xl font-bold"
					>
						Jets de Sauvegarde
					</h2>
					<div class="flex flex-col gap-2">
						{#each STATS as stat}
							<button
								class="group flex cursor-pointer items-center justify-between rounded p-2 transition-colors hover:bg-[--color-parchment-300]"
								onclick={() => toggleSaveProficiency(stat.key)}
							>
								<div class="flex items-center gap-3">
									{#if char.saveProficiencies[stat.key]}
										<CheckCircle2 class="h-5 w-5 text-[--color-parchment-900]" />
									{:else}
										<Circle
											class="h-5 w-5 text-[--color-parchment-400] group-hover:text-[--color-parchment-800]"
										/>
									{/if}
									<span class="font-bold">{stat.label}</span>
								</div>
								<span class="w-10 text-right text-xl font-bold"
									>{formatMod(getSaveTotal(stat.key))}</span
								>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Colonne du milieu/droite: Compétences -->
			<div class="flex flex-col gap-6 lg:col-span-2">
				<div class="rounded-xl border border-[--color-parchment-400] bg-white p-6 shadow-sm">
					<h2
						class="mb-6 flex items-center gap-2 border-b-2 border-[--color-parchment-400] pb-2 font-serif text-2xl font-bold"
					>
						Compétences
					</h2>
					<div class="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
						{#each SKILLS as skill}
							<button
								class="group flex cursor-pointer items-center justify-between rounded border-b border-[--color-parchment-300]/50 p-2 transition-colors hover:bg-[--color-parchment-300]"
								onclick={() => toggleSkillProficiency(skill.key)}
							>
								<div class="flex items-center gap-3">
									{#if char.skillProficiencies[skill.key]}
										<CheckCircle2 class="h-5 w-5 text-[--color-parchment-900]" />
									{:else}
										<Circle
											class="h-5 w-5 text-[--color-parchment-400] group-hover:text-[--color-parchment-800]"
										/>
									{/if}
									<div class="flex flex-col items-start text-left">
										<span class="font-bold">{skill.label}</span>
										<span
											class="text-[0.65rem] tracking-wider text-[--color-parchment-800] uppercase"
											>({STATS.find((s) => s.key === skill.stat)?.abbr})</span
										>
									</div>
								</div>
								<span
									class="w-10 border-l border-[--color-parchment-400] pl-2 text-right text-xl font-bold"
									>{formatMod(getSkillTotal(skill))}</span
								>
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<div class="mt-8 grid grid-cols-1 gap-8 text-[--color-parchment-900] lg:grid-cols-2">
			<!-- Traits & Facultés -->
			<div class="col-span-1 flex flex-col gap-6 md:col-span-2">
				<div class="rounded-xl border border-[--color-parchment-400] bg-white/50 p-6 shadow-sm">
					<div
						class="mb-4 flex items-center justify-between border-b-2 border-[--color-parchment-400] pb-2"
					>
						<h2 class="flex items-center font-serif text-xl font-bold text-[--color-parchment-800]">
							<Sparkles class="mr-2 h-6 w-6" /> Traits & Facultés
						</h2>
						<button
							onclick={addFeature}
							class="rounded-full bg-[--color-parchment-300] p-1 text-[--color-parchment-800] transition-colors hover:bg-[--color-parchment-400]"
						>
							<Plus class="h-5 w-5" />
						</button>
					</div>

					<div class="grid gap-3">
						{#if speciesFeatures.length > 0}
							<h3
								class="mt-2 border-b border-[--color-parchment-300] text-sm font-bold text-[--color-parchment-600] uppercase"
							>
								Traits d'Espèce
							</h3>
							{#each char.features || [] as feature, index}
								{#if feature.source === 'Espèce'}
									<details
										class="group rounded border border-[--color-parchment-300] bg-[--color-parchment-200]/50 p-3"
									>
										<summary class="cursor-pointer font-bold text-[--color-parchment-900]">
											{feature.name}
											<span class="ml-2 text-xs font-normal text-[--color-parchment-500] italic"
												>Source: Espèce</span
											>
										</summary>
										<div class="mt-2 border-t border-[--color-parchment-300] pt-2">
											{#each parseDescription(feature.description) as block}
												{#if block.type === 'text'}
													<p class="mt-1 text-sm whitespace-pre-wrap text-[--color-parchment-900]">
														{block.content}
													</p>
												{:else if block.type === 'table'}
													<div
														class="my-3 overflow-x-auto rounded border border-[--color-parchment-300]"
													>
														<table class="w-full text-left text-sm text-[--color-parchment-900]">
															<thead class="bg-[--color-parchment-300]/50 font-bold">
																<tr>
																	{#each block.headers as header}
																		<th class="px-3 py-2">{header}</th>
																	{/each}
																</tr>
															</thead>
															<tbody class="divide-y divide-[--color-parchment-300]/50">
																{#each block.rows as row}
																	<tr>
																		{#each row as cell}
																			<td class="px-3 py-2">{cell}</td>
																		{/each}
																	</tr>
																{/each}
															</tbody>
														</table>
													</div>
												{/if}
											{/each}
										</div>
									</details>
								{/if}
							{/each}
						{/if}

						{#if classFeatures.length > 0}
							<h3
								class="mt-2 border-b border-[--color-parchment-300] text-sm font-bold text-[--color-parchment-600] uppercase"
							>
								Facultés de Classe
							</h3>
							{#each char.features || [] as feature, index}
								{#if feature.source === 'Classe'}
									<details
										class="group rounded border border-[--color-parchment-300] bg-[--color-parchment-200]/50 p-3"
									>
										<summary class="cursor-pointer font-bold text-[--color-parchment-900]">
											{feature.name}
											<span class="ml-2 text-xs font-normal text-[--color-parchment-500] italic"
												>Source: Classe</span
											>
										</summary>
										<div class="mt-2 border-t border-[--color-parchment-300] pt-2">
											{#each parseDescription(feature.description) as block}
												{#if block.type === 'text'}
													<p class="mt-1 text-sm whitespace-pre-wrap text-[--color-parchment-900]">
														{block.content}
													</p>
												{:else if block.type === 'table'}
													<div
														class="my-3 overflow-x-auto rounded border border-[--color-parchment-300]"
													>
														<table class="w-full text-left text-sm text-[--color-parchment-900]">
															<thead class="bg-[--color-parchment-300]/50 font-bold">
																<tr>
																	{#each block.headers as header}
																		<th class="px-3 py-2">{header}</th>
																	{/each}
																</tr>
															</thead>
															<tbody class="divide-y divide-[--color-parchment-300]/50">
																{#each block.rows as row}
																	<tr>
																		{#each row as cell}
																			<td class="px-3 py-2">{cell}</td>
																		{/each}
																	</tr>
																{/each}
															</tbody>
														</table>
													</div>
												{/if}
											{/each}
										</div>
									</details>
								{/if}
							{/each}
						{/if}

						{#if backgroundFeatures.length > 0}
							<h3
								class="mt-2 border-b border-[--color-parchment-300] text-sm font-bold text-[--color-parchment-600] uppercase"
							>
								Faculté d'historique
							</h3>
							{#each char.features || [] as feature}
								{#if feature.source === 'Historique'}
									<details
										class="group rounded border border-[--color-parchment-300] bg-[--color-parchment-200]/50 p-3"
									>
										<summary class="cursor-pointer font-bold text-[--color-parchment-900]">
											{feature.name}
											<span class="ml-2 text-xs font-normal text-[--color-parchment-500] italic"
												>Source: Historique</span
											>
										</summary>
										<div class="mt-2 border-t border-[--color-parchment-300] pt-2">
											{#each parseDescription(feature.description) as block}
												{#if block.type === 'text'}
													<p class="mt-1 text-sm whitespace-pre-wrap text-[--color-parchment-900]">
														{block.content}
													</p>
												{:else if block.type === 'table'}
													<div
														class="my-3 overflow-x-auto rounded border border-[--color-parchment-300]"
													>
														<table class="w-full text-left text-sm text-[--color-parchment-900]">
															<thead class="bg-[--color-parchment-300]/50 font-bold">
																<tr>
																	{#each block.headers as header}
																		<th class="px-3 py-2">{header}</th>
																	{/each}
																</tr>
															</thead>
															<tbody class="divide-y divide-[--color-parchment-300]/50">
																{#each block.rows as row}
																	<tr>
																		{#each row as cell}
																			<td class="px-3 py-2">{cell}</td>
																		{/each}
																	</tr>
																{/each}
															</tbody>
														</table>
													</div>
												{/if}
											{/each}
										</div>
									</details>
								{/if}
							{/each}
						{/if}

						<h3
							class="mt-2 border-b border-[--color-parchment-300] text-sm font-bold text-[--color-parchment-600] uppercase"
						>
							Traits Supplémentaires
						</h3>
						{#each char.features || [] as feature, index}
							{#if feature.source !== 'Classe' && feature.source !== 'Espèce' && feature.source !== 'Historique'}
								<div class="rounded border border-[--color-parchment-300] bg-white p-3">
									<div class="mb-2 flex items-start justify-between gap-2">
										<input
											type="text"
											bind:value={feature.name}
											oninput={() => updateField('features', char.features)}
											class="w-full bg-transparent font-bold outline-none placeholder:text-[--color-parchment-400]"
											placeholder="Nom de la faculté"
										/>
										<button
											onclick={() => removeFeature(feature.id)}
											class="text-red-500/50 transition-colors hover:text-red-500"
											><Trash2 class="h-4 w-4" /></button
										>
									</div>
									<span class="mb-1 text-xs font-bold text-[--color-parchment-400] italic">
										Source: <input
											type="text"
											bind:value={feature.source}
											oninput={() => updateField('features', char.features)}
											class="w-32 border-b border-dashed border-[--color-parchment-300] bg-transparent outline-none placeholder:text-[--color-parchment-300]"
											placeholder="ex: Origine..."
										/>
									</span>
									<textarea
										bind:value={feature.description}
										oninput={() => updateField('features', char.features)}
										class="w-full resize-y bg-transparent text-sm outline-none placeholder:text-[--color-parchment-400]"
										placeholder="Description de la faculté..."
										rows="3"
									></textarea>
								</div>
							{/if}
						{/each}
						{#if otherFeatures.length === 0}
							<div class="p-8 text-center text-sm text-[--color-parchment-400] italic">
								Aucun trait libre ou Origine.
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Équipement -->
			<div class="col-span-1 md:col-span-2">
				<div class="rounded-xl border border-[--color-parchment-400] bg-white/50 p-6 shadow-sm">
					<div
						class="mb-6 flex items-center justify-between border-b-2 border-[--color-parchment-400] pb-2"
					>
						<h2 class="flex items-center gap-2 font-serif text-2xl font-bold">
							<Backpack class="h-6 w-6" />
							Équipement
						</h2>
						<button
							onclick={openItemModal}
							class="flex h-8 w-8 items-center justify-center rounded-full bg-[--color-parchment-300] text-[--color-parchment-900] transition-colors hover:bg-[--color-parchment-400]"
						>
							<Plus class="h-5 w-5" />
						</button>
					</div>

					<div class="flex flex-col gap-2">
						{#if char.items.length === 0}
							<p class="p-4 text-center text-sm text-[--color-parchment-800] italic">
								Votre sac d'aventurier est bien vide...
							</p>
						{/if}
						{#each char.items as item (item.id)}
							<details
								class="overflow-hidden rounded border border-[--color-parchment-400] bg-white"
							>
								<summary class="cursor-pointer p-3 font-bold text-[--color-parchment-900]">
									{item.name || 'Objet sans nom'}
								</summary>
								<div class="border-t border-[--color-parchment-300] bg-white/50 p-3">
									<div
										class="mb-3 flex items-center justify-between gap-3 text-xs text-[--color-parchment-700]"
									>
										<div class="flex items-center gap-2">
											<label class="flex items-center gap-2">
												<input
													type="checkbox"
													checked={item.isEquipped}
													onchange={(e) =>
														updateItem(item.id, 'isEquipped', e.currentTarget.checked)}
												/>
												Équipé
											</label>
											<span>Quantité: {item.quantity}</span>
										</div>
										<button
											onclick={() => removeItem(item.id)}
											class="inline-flex items-center gap-1 text-red-600 transition-colors hover:text-red-700"
											title="Supprimer"
										>
											<Trash2 class="h-4 w-4" /> Supprimer
										</button>
									</div>
									{#if item.isCustom !== false}
										<textarea
											class="w-full resize-y bg-transparent text-sm whitespace-pre-line text-[--color-parchment-800] placeholder-[--color-parchment-400] outline-none"
											placeholder="Description de l'objet..."
											rows="3"
											value={item.description || ''}
											oninput={(e) => updateItem(item.id, 'description', e.currentTarget.value)}
										></textarea>
									{:else}
										<p class="text-sm whitespace-pre-line text-[--color-parchment-900]">
											{item.description || ''}
										</p>
									{/if}
								</div>
							</details>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Grimoire & Sorts -->
		{#if casterType !== 'none'}
			<div class="mt-8 space-y-8">
				<!-- Section Sorts Actifs (Tous les spellcasters) -->
				<div class="rounded-xl border border-[--color-parchment-400] bg-white/50 p-6 shadow-sm">
					<div
						class="mb-6 flex items-center justify-between border-b-2 border-[--color-parchment-400] pb-2"
					>
						<h2
							class="flex items-center gap-2 font-serif text-2xl font-bold text-[--color-parchment-800]"
						>
							<Wand2 class="h-6 w-6" /> Sorts {casterType === 'prepared'
								? 'Préparés'
								: casterType === 'known'
									? 'Connus'
									: 'Préparés'}
						</h2>
						<button
							onclick={() => openSpellModal(casterType === 'grimoire' ? 'grimoire' : 'global')}
							class="flex items-center gap-2 rounded-full bg-[--color-parchment-800] px-4 py-2 text-sm font-bold text-[--color-parchment-100] transition-colors hover:bg-[--color-parchment-900]"
						>
							<Plus class="h-4 w-4" />
							{casterType === 'known' ? 'Apprendre un sort' : 'Préparer un sort'}
						</button>
					</div>

					<div class="flex flex-col gap-6">
						<!-- Section Emplacements de Sorts globale -->
						{#if casterType !== 'none'}
							<div
								class="flex flex-wrap gap-4 rounded-lg border border-[--color-parchment-300] bg-[--color-parchment-200]/50 p-4"
							>
								<div
									class="flex w-full items-end justify-between border-b border-[--color-parchment-300] pb-2"
								>
									<h3 class="font-serif text-lg font-bold text-[--color-parchment-900]">
										Emplacements de Sorts
									</h3>
									{#if classSpellcastingInfo}
										<div class="flex gap-4 text-xs text-[--color-parchment-600]">
											{#if classSpellcastingInfo.cantripsCount}
												<span
													>Tours de Magie max : <strong
														>{classSpellcastingInfo.cantripsCount}</strong
													></span
												>
											{/if}
											{#if classSpellcastingInfo.preparedSpellsCount && casterType === 'prepared'}
												<span
													>Sorts préparés max : <strong
														>{classSpellcastingInfo.preparedSpellsCount}</strong
													></span
												>
											{/if}
										</div>
									{/if}
								</div>

								<div class="flex flex-wrap gap-3">
									{#if (classSpellcastingInfo?.cantripsCount || 0) > 0}
										{@const cantripMax = classSpellcastingInfo?.cantripsCount || 0}
										{@const cantripUsed = char?.spellSlots?.[0]?.used || 0}
										{@const cantripAvailable = Math.max(0, cantripMax - cantripUsed)}
										<div
											class="flex flex-col items-center gap-2 rounded border border-[--color-parchment-200] bg-white p-2 px-3 shadow-sm"
										>
											<span class="text-xs font-bold text-[--color-parchment-600]">Cantrips</span>
											<div class="flex items-center gap-3">
												<button
													onclick={(e) => {
														e.preventDefault();
														if (!char || cantripAvailable <= 0) return;
														const newUsed = Math.min(cantripMax, cantripUsed + 1);
														updateField('spellSlots', {
															...char.spellSlots,
															0: {
																...char.spellSlots?.[0],
																total: cantripMax,
																used: newUsed
															}
														});
													}}
													disabled={cantripAvailable <= 0}
													class="flex h-5 w-5 items-center justify-center rounded border border-[--color-parchment-300] bg-white text-[--color-parchment-900] transition-colors hover:bg-[--color-parchment-200] disabled:cursor-not-allowed disabled:opacity-50"
													title="Utiliser un cantrip"
												>
													<Minus class="h-3 w-3" />
												</button>
												<span
													class="min-w-[1.5rem] text-center text-sm font-bold text-[--color-parchment-900]"
												>
													{cantripAvailable}<span
														class="mx-1 text-xs font-normal text-[--color-parchment-500]">/</span
													>{cantripMax}
												</span>
												<button
													onclick={(e) => {
														e.preventDefault();
														if (!char || cantripUsed <= 0) return;
														updateField('spellSlots', {
															...char.spellSlots,
															0: {
																...char.spellSlots?.[0],
																total: cantripMax,
																used: 0
															}
														});
													}}
													disabled={cantripUsed <= 0}
													class="flex h-5 w-5 items-center justify-center rounded border border-[--color-parchment-300] bg-white text-[--color-parchment-600] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
													title="Restaurer tous les cantrips"
												>
													<RotateCcw class="h-3 w-3" />
												</button>
											</div>
										</div>
									{/if}

									{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as level}
										{@const maxTotal = classSpellcastingInfo?.spellSlots?.[level - 1] || 0}
										{#if maxTotal > 0 || char?.spells?.some((s) => s.level === level)}
											<div
												class="flex flex-col items-center gap-2 rounded border border-[--color-parchment-200] bg-white p-2 px-3 shadow-sm"
											>
												<span class="text-xs font-bold text-[--color-parchment-600]"
													>Niv {level}</span
												>

												{#if maxTotal > 0}
													{@const used = char?.spellSlots?.[level]?.used || 0}
													{@const available = Math.max(0, maxTotal - used)}
													<div class="flex items-center gap-3">
														<button
															onclick={(e) => {
																e.preventDefault();
																if (!char || available <= 0) return;
																const newUsed = Math.min(maxTotal, used + 1);
																updateField('spellSlots', {
																	...char.spellSlots,
																	[level]: {
																		...char.spellSlots?.[level],
																		total: maxTotal,
																		used: newUsed
																	}
																});
															}}
															disabled={available <= 0}
															class="flex h-5 w-5 items-center justify-center rounded border border-[--color-parchment-300] bg-white text-[--color-parchment-900] transition-colors hover:bg-[--color-parchment-200] disabled:cursor-not-allowed disabled:opacity-50"
															title="Utiliser un emplacement"
														>
															<Minus class="h-3 w-3" />
														</button>
														<span
															class="min-w-[1.5rem] text-center text-sm font-bold text-[--color-parchment-900]"
														>
															{available}<span
																class="mx-1 text-xs font-normal text-[--color-parchment-500]"
																>/</span
															>{maxTotal}
														</span>

														<button
															onclick={(e) => {
																e.preventDefault();
																if (!char || used <= 0) return;
																updateField('spellSlots', {
																	...char.spellSlots,
																	[level]: { ...char.spellSlots?.[level], total: maxTotal, used: 0 }
																});
															}}
															disabled={used <= 0}
															class="flex h-5 w-5 items-center justify-center rounded border border-[--color-parchment-300] bg-white text-[--color-parchment-600] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
															title="Restaurer tous les emplacements"
														>
															<RotateCcw class="h-3 w-3" />
														</button>
													</div>
												{:else}
													<div
														class="flex h-[24px] items-center text-xs text-[--color-parchment-400] italic"
													>
														Aucun sort
													</div>
												{/if}
											</div>
										{/if}
									{/each}
								</div>
								<span class="w-full text-xs text-[--color-parchment-500] italic"
									>Vos emplacements de sorts sont calculés automatiquement en fonction de votre
									niveau.</span
								>
							</div>
						{/if}

						<div class="flex flex-col gap-2">
							{#if activeSpellsFlat.length === 0}
								<span class="p-4 text-center text-sm text-[--color-parchment-400] italic"
									>Vous ne connaissez aucun sort ou n'en avez préparé aucun...</span
								>
							{/if}
							{#each activeSpellsFlat as spell (spell.id)}
								{@const details = getSpellDetails(spell.name)}
								<details
									class="group rounded border border-[--color-parchment-300] bg-white transition-colors hover:border-[--color-parchment-400]"
								>
									<summary
										class="flex cursor-pointer list-none items-center justify-between p-3 outline-none hover:bg-[--color-parchment-200]/50 [&::-webkit-details-marker]:hidden"
									>
										<div class="flex flex-col">
											<span class="font-bold text-[--color-parchment-900]">{spell.name}</span>
											<span class="text-xs font-bold text-[--color-parchment-500] uppercase">
												{spell.level === 0 ? 'Tour de magie' : `Niveau ${spell.level}`}
											</span>
										</div>
										<div class="flex items-center gap-4">
											<div class="flex items-center gap-2">
												{#if spell.level > 0 && casterType !== 'known'}
													<button
														onclick={(e) => {
															e.preventDefault();
															toggleSpellPrepared(spell.id);
														}}
														class="flex items-center gap-1 rounded border border-[--color-parchment-300] bg-[--color-parchment-200] px-2 py-1 text-xs font-bold text-[--color-parchment-800] transition-colors hover:bg-[--color-parchment-300]"
														title="Ne plus préparer"
													>
														Retirer
													</button>
												{/if}
												<button
													onclick={(e) => {
														e.preventDefault();
														unlearnSpell(spell.id);
													}}
													class="text-[--color-parchment-400] transition-colors hover:text-red-500"
													title={casterType === 'known'
														? 'Oublier définitivement'
														: 'Retirer de la liste'}
												>
													<Trash2 class="h-4 w-4" />
												</button>
											</div>
											<span
												class="text-[--color-parchment-400] transition-transform group-open:rotate-180"
												>▼</span
											>
										</div>
									</summary>

									{#if details}
										<div
											class="border-t border-[--color-parchment-300] bg-white/50 p-4 text-sm whitespace-pre-line text-[--color-parchment-800]"
										>
											<div
												class="mb-3 grid grid-cols-2 gap-2 border-b border-[--color-parchment-200] pb-3 text-xs opacity-80"
											>
												{#if details.castingTime}<div>
														<span class="font-bold">Temps d'incantation :</span>
														{details.castingTime}
													</div>{/if}
												{#if details.range}<div>
														<span class="font-bold">Portée :</span>
														{details.range}
													</div>{/if}
												{#if details.duration}<div>
														<span class="font-bold">Durée :</span>
														{details.duration}
													</div>{/if}
												{#if details.school}<div>
														<span class="font-bold">École :</span>
														{details.school}
													</div>{/if}
											</div>
											{#if details.description}
												<p class="leading-relaxed">{details.description}</p>
											{/if}
										</div>
									{/if}
								</details>
							{/each}
						</div>
					</div>
				</div>

				<!-- Section Grimoire (Wizard uniquement) -->
				{#if casterType === 'grimoire'}
					<div class="rounded-xl border border-[--color-parchment-400] bg-white/50 p-6 shadow-sm">
						<div
							class="mb-6 flex items-center justify-between border-b-2 border-[--color-parchment-400] pb-2"
						>
							<h2
								class="flex items-center gap-2 font-serif text-2xl font-bold text-[--color-parchment-800]"
							>
								<Wand2 class="h-6 w-6" /> Grimoire
							</h2>
							<button
								onclick={() => openSpellModal('global')}
								class="flex items-center gap-2 rounded-full bg-[--color-parchment-800] px-4 py-2 text-sm font-bold text-[--color-parchment-100] transition-colors hover:bg-[--color-parchment-900]"
							>
								<Plus class="h-4 w-4" /> Ajouter au grimoire
							</button>
						</div>

						<div class="flex flex-col gap-2">
							{#if grimoireSpellsFlat.filter((s) => !s.isPrepared).length === 0}
								<span class="p-4 text-center text-sm text-[--color-parchment-400] italic"
									>Aucun sort supplémentaire dans le grimoire...</span
								>
							{/if}
							{#each grimoireSpellsFlat.filter((s) => !s.isPrepared) as spell (spell.id)}
								{@const details = getSpellDetails(spell.name)}
								<details
									class="group rounded border border-[--color-parchment-300] bg-white transition-colors hover:border-[--color-parchment-400]"
								>
									<summary
										class="flex cursor-pointer list-none items-center justify-between p-3 outline-none hover:bg-[--color-parchment-200]/50 [&::-webkit-details-marker]:hidden"
									>
										<div class="flex flex-col">
											<span class="font-bold text-[--color-parchment-900]">{spell.name}</span>
											<span class="text-xs font-bold text-[--color-parchment-500] uppercase">
												{spell.level === 0 ? 'Tour de magie' : `Niveau ${spell.level}`}
											</span>
										</div>
										<div class="flex items-center gap-4">
											<div class="flex items-center gap-2">
												{#if spell.level > 0}
													<button
														onclick={(e) => {
															e.preventDefault();
															toggleSpellPrepared(spell.id);
														}}
														class="flex items-center gap-1 rounded bg-[--color-parchment-800] px-2 py-1 text-xs font-bold text-[--color-parchment-100] transition-colors hover:bg-[--color-parchment-900]"
														title="Préparer ce sort"
													>
														Préparer
													</button>
												{/if}
												<button
													onclick={(e) => {
														e.preventDefault();
														unlearnSpell(spell.id);
													}}
													class="text-[--color-parchment-400] transition-colors hover:text-red-500"
													title="Retirer du grimoire"
												>
													<Trash2 class="h-4 w-4" />
												</button>
											</div>
											<span
												class="text-[--color-parchment-400] transition-transform group-open:rotate-180"
												>▼</span
											>
										</div>
									</summary>

									{#if details}
										<div
											class="border-t border-[--color-parchment-300] bg-white/50 p-4 text-sm whitespace-pre-line text-[--color-parchment-800]"
										>
											<div
												class="mb-3 grid grid-cols-2 gap-2 border-b border-[--color-parchment-200] pb-3 text-xs opacity-80"
											>
												{#if details.castingTime}<div>
														<span class="font-bold">Temps d'incantation :</span>
														{details.castingTime}
													</div>{/if}
												{#if details.range}<div>
														<span class="font-bold">Portée :</span>
														{details.range}
													</div>{/if}
												{#if details.duration}<div>
														<span class="font-bold">Durée :</span>
														{details.duration}
													</div>{/if}
												{#if details.school}<div>
														<span class="font-bold">École :</span>
														{details.school}
													</div>{/if}
											</div>
											{#if details.description}
												<p class="leading-relaxed">{details.description}</p>
											{/if}
										</div>
									{/if}
								</details>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if isRestModalOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onclick={closeRestModal}
		>
			<div
				class="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl border-2 border-[--color-parchment-400] bg-white shadow-2xl"
				onclick={(e) => e.stopPropagation()}
			>
				<div
					class="flex items-center justify-between border-b border-[--color-parchment-300] bg-[--color-parchment-200] p-4 text-[--color-parchment-900]"
				>
					<h2 class="font-serif text-xl font-bold">
						{restMode === 'short' ? 'Short Rest' : 'Long Rest'}
					</h2>
					<button
						onclick={closeRestModal}
						class="rounded-full p-1 hover:bg-[--color-parchment-300]"
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<div class="flex flex-col gap-4 p-4 text-[--color-parchment-900]">
					<div class="grid grid-cols-2 gap-3 text-sm">
						<div class="rounded border border-[--color-parchment-300] bg-white p-3">
							<span class="block text-xs text-[--color-parchment-600]">Points de vie</span>
							<strong>{currentHitPoints}/{maxHitPoints}</strong>
						</div>
						<div class="rounded border border-[--color-parchment-300] bg-white p-3">
							<span class="block text-xs text-[--color-parchment-600]">Dés de vie</span>
							<strong>{availableHitDice}/{totalHitDice}</strong>
							<span class="ml-2 text-xs text-[--color-parchment-600]"
								>(d{getClassHitDieSize(char.class || '')})</span
							>
							<div class="mt-1 text-xs text-[--color-parchment-600]">
								Dépensés: {usedHitDice}
							</div>
						</div>
					</div>

					{#if restMode === 'short'}
						<p class="text-sm text-[--color-parchment-700]">
							Choisis combien de dés de vie tu dépenses, puis saisis les résultats de tes jets
							réels. Chaque dé soigne: jet + mod. CON ({constitutionModifier >= 0
								? `+${constitutionModifier}`
								: constitutionModifier}).
						</p>

						<label class="text-sm font-bold">
							Nombre de dés utilisés
							<input
								type="number"
								min="0"
								max={availableHitDice}
								value={shortRestDiceCount}
								oninput={(e) => setShortRestDiceCount(parseInt(e.currentTarget.value) || 0)}
								class="mt-1 w-full rounded border border-[--color-parchment-300] bg-white p-2"
							/>
						</label>

						{#if shortRestDiceCount > 0}
							<div class="grid grid-cols-2 gap-2 md:grid-cols-3">
								{#each Array.from({ length: shortRestDiceCount }) as _, idx}
									<label class="text-xs font-bold">
										Dé #{idx + 1}
										<input
											type="number"
											min="0"
											value={shortRestRolls[idx] || 0}
											oninput={(e) =>
												updateShortRestRoll(idx, parseInt(e.currentTarget.value) || 0)}
											class="mt-1 w-full rounded border border-[--color-parchment-300] bg-white p-2"
										/>
									</label>
								{/each}
							</div>
							<div class="rounded border border-[--color-parchment-300] bg-white p-3 text-sm">
								Soin total estimé: <strong>{shortRestHealingTotal}</strong> PV
							</div>
						{/if}

						<div class="flex justify-end gap-2">
							<button
								onclick={closeRestModal}
								class="rounded border border-[--color-parchment-300] bg-white px-3 py-2 text-sm font-bold"
							>
								Annuler
							</button>
							<button
								onclick={applyShortRest}
								disabled={shortRestDiceCount <= 0}
								class="rounded bg-[--color-parchment-800] px-3 py-2 text-sm font-bold text-[--color-parchment-100] disabled:cursor-not-allowed disabled:opacity-50"
							>
								Valider le short rest
							</button>
						</div>
					{:else}
						<p class="text-sm text-[--color-parchment-700]">
							Long Rest: récupère tous les PV et récupère des dés de vie dépensés égal à la moitié
							du total (minimum 1).
						</p>
						<div class="rounded border border-[--color-parchment-300] bg-white p-3 text-sm">
							<div>Dés récupérés au long rest: <strong>{longRestRecoverHitDice}</strong></div>
							<div>Dés actuellement dépensés: <strong>{usedHitDice}</strong></div>
						</div>
						<div class="flex justify-end gap-2">
							<button
								onclick={closeRestModal}
								class="rounded border border-[--color-parchment-300] bg-white px-3 py-2 text-sm font-bold"
							>
								Annuler
							</button>
							<button
								onclick={applyLongRest}
								class="rounded bg-[--color-parchment-800] px-3 py-2 text-sm font-bold text-[--color-parchment-100] disabled:cursor-not-allowed disabled:opacity-50"
							>
								Valider le long rest
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Spell Learning Modal -->
	{#if isSpellModalOpen}
		<!-- bg layer -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onclick={closeSpellModal}
		>
			<!-- Modal Content -->
			<div
				class="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border-2 border-[--color-parchment-400] bg-white shadow-2xl"
				onclick={(e) => e.stopPropagation()}
			>
				<!-- header -->
				<div
					class="flex items-center justify-between border-b border-[--color-parchment-300] bg-[--color-parchment-200] p-4 text-[--color-parchment-900]"
				>
					<h2 class="flex items-center gap-2 font-serif text-xl font-bold">
						<Sparkles class="h-5 w-5" />
						{spellModalMode === 'grimoire' ? 'Grimoire Personnel' : 'Bibliothèque Magique'}
					</h2>
					<button
						onclick={closeSpellModal}
						class="rounded-full p-1 hover:bg-[--color-parchment-300]"
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<!-- Search input -->
				<div class="border-b border-[--color-parchment-300] bg-white p-4">
					<div class="relative">
						<Search
							class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[--color-parchment-400]"
						/>
						<input
							type="text"
							bind:value={spellSearchQuery}
							placeholder="Rechercher un sort par son nom..."
							class="w-full rounded-md border border-[--color-parchment-400] bg-white py-2 pr-4 pl-10 font-bold text-[--color-parchment-900] placeholder-[--color-parchment-400] focus:border-[--color-parchment-800] focus:outline-none"
						/>
					</div>
				</div>

				<!-- Spell List -->
				<div class="flex-1 overflow-y-auto bg-white p-4">
					<div class="flex flex-col gap-2">
						{#if filteredSpells.length === 0}
							<div class="p-8 text-center text-[--color-parchment-500] italic">
								Aucun sortilège ne correspond à cette recherche.
							</div>
						{/if}
						{#each filteredSpells as sp}
							{@const spellTitle = sp.title || sp.name}
							<div
								class="flex flex-col rounded border border-[--color-parchment-300] bg-white shadow-sm transition-shadow hover:shadow-md"
							>
								<div
									class="flex items-center justify-between border-b border-[--color-parchment-200] p-3"
								>
									<div>
										<h4 class="font-bold text-[--color-parchment-900]">{spellTitle}</h4>
										<span class="text-xs font-bold text-[--color-parchment-500] uppercase">
											{sp.level === 0 ? 'Tour de magie' : `Niveau ${sp.level}`} • {sp.school ||
												'Magie'}
										</span>
									</div>
									<button
										onclick={() => learnSpell(sp)}
										disabled={spellModalMode === 'global'
											? char.spells?.some((s) => s.name === spellTitle)
											: false}
										class="flex items-center gap-1 rounded bg-[--color-parchment-800] px-3 py-1 text-sm font-bold text-[--color-parchment-100] transition-colors hover:bg-[--color-parchment-900] disabled:cursor-not-allowed disabled:opacity-50"
									>
										{spellModalMode === 'global'
											? char.spells?.some((s) => s.name === spellTitle)
												? 'Déjà appris'
												: 'Apprendre'
											: 'Préparer'}
									</button>
								</div>

								<!-- Spell Details collapse -->
								<details class="group px-3 py-2 text-sm text-[--color-parchment-800]">
									<summary
										class="cursor-pointer font-bold text-[--color-parchment-600] italic outline-none"
									>
										Lire les incantations...
									</summary>
									<div
										class="mt-2 mb-2 grid grid-cols-2 gap-2 border-t border-[--color-parchment-200] pt-2 text-xs"
									>
										<div>
											<span class="font-bold">Temps d'incantation :</span>
											{sp.castingTime || '-'}
										</div>
										<div><span class="font-bold">Portée :</span> {sp.range || '-'}</div>
										<div>
											<span class="font-bold">Composantes :</span>
											{sp.components?.join(', ') || '-'}
										</div>
										<div><span class="font-bold">Durée :</span> {sp.duration || '-'}</div>
									</div>
									<p class="whitespace-pre-wrap">{sp.description}</p>
								</details>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}

{#if isItemModalOpen}
	<!-- bg layer -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		onclick={closeItemModal}
	>
		<!-- Modal Content -->
		<div
			class="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border-2 border-[--color-parchment-400] bg-white shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- header -->
			<div
				class="flex items-center justify-between border-b border-[--color-parchment-300] bg-[--color-parchment-200] p-4 text-[--color-parchment-900]"
			>
				<h2 class="flex items-center gap-2 font-serif text-xl font-bold">
					<Backpack class="h-5 w-5" />
					Catalogue d'Équipements
				</h2>
				<button onclick={closeItemModal} class="rounded-full p-1 hover:bg-[--color-parchment-300]">
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Search input -->
			<div
				class="border-b border-[--color-parchment-300] bg-white p-4 text-[--color-parchment-900]"
			>
				<div class="relative mb-2">
					<Search
						class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[--color-parchment-400]"
					/>
					<input
						type="text"
						bind:value={itemSearchQuery}
						placeholder="Rechercher un objet par son nom..."
						class="w-full rounded-md border border-[--color-parchment-400] bg-white py-2 pr-4 pl-10 font-bold text-[--color-parchment-900] placeholder-[--color-parchment-400] focus:border-[--color-parchment-800] focus:outline-none"
					/>
				</div>
				<button
					onclick={addCustomItem}
					class="w-full rounded bg-[--color-parchment-800] py-2 font-bold text-white transition-colors hover:bg-[--color-parchment-900]"
				>
					+ Ajouter un objet personnalisé
				</button>
			</div>

			<!-- Results list -->
			<div class="flex-1 overflow-y-auto bg-white p-4 text-[--color-parchment-900]">
				{#if filteredItems.length === 0}
					<p class="text-center text-[--color-parchment-500] italic">Aucun objet trouvé.</p>
				{:else}
					<div class="grid gap-2">
						{#each filteredItems as item}
							<button
								class="flex w-full items-center justify-between rounded border border-[--color-parchment-300] bg-white p-3 text-left transition-colors hover:bg-[--color-parchment-200]"
								onclick={() => addItemFromCatalog(item)}
							>
								<div>
									<div class="font-bold text-[--color-parchment-900]">
										{item.title}
									</div>
									<div class="text-xs text-[--color-parchment-500]">
										{item.type || 'Objet'}
									</div>
								</div>
								<Plus class="h-4 w-4 text-[--color-parchment-500]" />
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
