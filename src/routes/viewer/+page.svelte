<script lang="ts">
	import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { schema } from '$lib/store';
    import { get } from 'svelte/store';
	let canvas: HTMLCanvasElement;

	onMount(async () => {
        const generatedSchema = get(schema)
        console.log(generatedSchema)
        if (!generatedSchema) {
			goto('/');          // user refreshed; no schema in memory
			return;
		}

		// load the viewer only after the component is mounted in the browser
		const { start } = await import('$lib/modules/framework.js');
		start(canvas, generatedSchema);
	});
</script>

<canvas bind:this={canvas}></canvas>
