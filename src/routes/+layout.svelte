<script>
	import { width, height, bgColor, textColor } from '$lib/store';
	import '../style.css';
	import { navigating } from '$app/stores';

	let innerWidth = $state();
	let innerHeight = $state();
	$effect(() => {
		$width = innerWidth;
		$height = innerHeight;
	});
</script>

<svelte:window bind:innerWidth bind:innerHeight />

{#if $navigating}
	<div class="loaderContainer">
		<div style="display: flex; align-items: center;">
			<!-- <p class="loaderText" style="margin-right: 10px;">Loading...</p> -->
			<div class="loader"></div>
		</div>
	</div>
{:else}
	<slot></slot>
{/if}

<style>
	.loaderContainer {
		width: 100%;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		background-color: hsl(0, 0%, 98%);
	}
</style>
