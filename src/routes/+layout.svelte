<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { initStore } from '$lib/store';

	let { children } = $props();

	// Wait for data load before rendering
	let ready = $state(false);

	onMount(async () => {
		await initStore();
		ready = true;
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="min-h-screen">
	{#if ready}
		{@render children()}
	{:else}
		<div class="flex h-screen items-center justify-center bg-[--color-parchment-100]">
			<p class="font-serif text-2xl font-bold text-[--color-parchment-900]">
				Chargement de la partie...
			</p>
		</div>
	{/if}
</div>
