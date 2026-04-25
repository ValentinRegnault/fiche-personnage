<script lang="ts">
	import { page } from '$app/stores';
	import { campaignsStore, charactersStore } from '$lib/store';
	import { ArrowLeft, UserPlus } from 'lucide-svelte';

	const campaignId = $derived($page.params.id);
	const campaign = $derived($campaignsStore.find((c) => c.id === campaignId));
	const characters = $derived($charactersStore.filter((c) => c.campaignId === campaignId));

	let newCharName = $state('');

	function handleCreate(e: Event) {
		e.preventDefault();
		if (newCharName && campaignId) {
			import('$lib/store').then(({ addCharacter }) => {
				addCharacter(campaignId, newCharName);
				newCharName = '';
			});
		}
	}
</script>

{#if !campaign}
	<div class="mx-auto flex max-w-4xl flex-col items-center p-8 text-center">
		<div class="mb-4 h-8 w-64 animate-pulse rounded bg-[--color-parchment-400]"></div>
		<p>Recherche des chroniques...</p>
	</div>
{:else}
	<main class="mx-auto max-w-4xl p-8">
		<a
			href="/"
			class="mb-6 inline-flex items-center text-[--color-parchment-800] hover:text-[--color-parchment-900]"
		>
			<ArrowLeft class="mr-2 h-4 w-4" /> Retour au menu principal
		</a>

		<header class="mb-10 border-b-4 border-[--color-parchment-400] pb-6">
			<h1 class="mb-2 font-serif text-4xl font-bold">{campaign.name}</h1>
			<p class="text-xl text-[--color-parchment-800] italic">Maîtrisé par {campaign.dm}</p>
		</header>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			<div class="md:col-span-2">
				<h2 class="mb-4 text-2xl font-bold">Membres du Groupe</h2>

				{#if characters.length === 0}
					<div
						class="rounded border border-dashed border-[--color-parchment-800] bg-[--color-parchment-100] p-8 text-center"
					>
						<p class="text-[--color-parchment-800] italic">
							La taverne est vide. Il est temps de recruter des héros !
						</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{#each characters as char}
							<a
								href="/character/{char.id}"
								class="group relative block overflow-hidden rounded-lg border border-[--color-parchment-400] bg-[--color-parchment-100] p-5 shadow-sm transition-colors hover:bg-[--color-parchment-300]"
							>
								<div
									class="absolute top-0 right-0 h-full w-2 bg-[--color-ink-red] opacity-0 transition-opacity group-hover:opacity-100"
								></div>
								<h3 class="text-xl font-bold">{char.name}</h3>
								<p class="text-sm text-[--color-parchment-800] italic">
									{char.species || 'Inconnu'}
									{char.class || 'Aventurier'} - Niveau {char.level}
								</p>
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<div>
				<h2 class="mb-4 text-2xl font-bold">Nouveau Compagnon</h2>
				<form
					onsubmit={handleCreate}
					class="flex flex-col gap-3 rounded-lg border border-[--color-parchment-400] bg-[--color-parchment-100] p-5 shadow-sm"
				>
					<label for="charName" class="block font-bold">Nom du Personnage</label>
					<input
						type="text"
						id="charName"
						bind:value={newCharName}
						class="w-full border-b border-[--color-parchment-800] bg-transparent p-2 focus:border-[--color-parchment-900] focus:outline-none"
						placeholder="Ex: Drizzt, Ogg..."
						required
					/>
					<button
						type="submit"
						class="mt-2 flex w-full items-center justify-center rounded bg-[--color-parchment-900] px-4 py-2 font-bold text-[--color-parchment-100] transition-colors hover:bg-[--color-parchment-800]"
					>
						<UserPlus class="mr-2 h-4 w-4" />
						Rejoindre
					</button>
				</form>
			</div>
		</div>
	</main>
{/if}
