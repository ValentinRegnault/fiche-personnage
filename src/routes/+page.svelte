<script lang="ts">
	import { campaignsStore, charactersStore } from '$lib/store';
	import { Shield, Plus } from 'lucide-svelte';

	let newCampaignName = $state('');
	let newCampaignDM = $state('');

	function handleCreate(e: Event) {
		e.preventDefault();
		if (newCampaignName && newCampaignDM) {
			import('$lib/store').then(({ addCampaign }) => {
				addCampaign(newCampaignName, newCampaignDM);
				newCampaignName = '';
				newCampaignDM = '';
			});
		}
	}
</script>

<main class="mx-auto max-w-4xl p-8">
	<div class="mb-12 text-center">
		<Shield class="mb-4 inline-block h-16 w-16 text-[--color-parchment-900]" />
		<h1 class="mb-2 text-4xl font-bold">Chroniques de Donjons & Dragons</h1>
		<p class="text-[--color-parchment-800] italic">Gérez vos campagnes en temps réel</p>
	</div>

	<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
		<section>
			<h2 class="mb-4 border-b-2 border-[--color-parchment-400] pb-2 text-2xl font-bold">
				Campagnes Actuelles
			</h2>
			{#if $campaignsStore.length === 0}
				<p class="text-[--color-parchment-800] italic">
					Aucune campagne en cours. Formez un groupe d'aventuriers !
				</p>
			{:else}
				<ul class="space-y-4">
					{#each $campaignsStore as campaign (campaign.id)}
						<li>
							<a
								href="/campaign/{campaign.id}"
								class="block rounded-lg border border-[--color-parchment-400] bg-[--color-parchment-100] p-4 shadow-sm transition-colors hover:bg-[--color-parchment-300]"
							>
								<h3 class="text-xl font-bold">{campaign.name}</h3>
								<p class="text-sm text-[--color-parchment-800]">Menée par DM {campaign.dm}</p>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2 class="mb-4 border-b-2 border-[--color-parchment-400] pb-2 text-2xl font-bold">
				Fonder une Campagne
			</h2>
			<form
				onsubmit={handleCreate}
				class="space-y-4 rounded-lg border border-[--color-parchment-400] bg-[--color-parchment-100] p-6 shadow-sm"
			>
				<div>
					<label for="name" class="mb-1 block font-bold">Nom de la légende</label>
					<input
						type="text"
						id="name"
						bind:value={newCampaignName}
						class="w-full border-b border-[--color-parchment-800] bg-transparent p-2 focus:border-[--color-parchment-900] focus:outline-none"
						placeholder="Ex: La Malédiction de Strahd"
						required
					/>
				</div>
				<div>
					<label for="dm" class="mb-1 block font-bold">Maître du Donjon</label>
					<input
						type="text"
						id="dm"
						bind:value={newCampaignDM}
						class="w-full border-b border-[--color-parchment-800] bg-transparent p-2 focus:border-[--color-parchment-900] focus:outline-none"
						placeholder="Votre nom"
						required
					/>
				</div>
				<button
					type="submit"
					class="flex w-full items-center justify-center rounded bg-[--color-parchment-900] px-4 py-2 font-bold text-[--color-parchment-100] transition-colors hover:bg-[--color-parchment-800]"
				>
					<Plus class="mr-2 h-5 w-5" />
					Débuter l'aventure
				</button>
			</form>
		</section>
	</div>
</main>
