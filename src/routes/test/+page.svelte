<script lang="ts">
	import { onMount } from 'svelte';
	let canvas: HTMLCanvasElement;

	onMount(async () => {
		// load the viewer only after the component is mounted in the browser
		const { start } = await import('$lib/modules/framework.js');
		start(canvas);
	});
</script>

<canvas bind:this={canvas}></canvas>
