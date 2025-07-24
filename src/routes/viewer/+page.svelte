<script lang="ts">
/* ------------ imports ------------ */
import { onMount }    from 'svelte';
import { schema }     from '$lib/store';
import { get }        from 'svelte/store';

/* ------------ local state ------------ */
let canvas: HTMLCanvasElement;

let jsonText   = '';
let chatPrompt = '';
let busyMsg    = '';
let jsonError  = '';

/* ---- sidebar width & drag ---- */
let sidebarWidth = 35;     // %
let isResizing   = false;

/* ---- 3-D runtime handle ---- */
let viewer: any;           // whatever `$lib/modules/framework.js` returns

/* ------------ helpers ------------ */
async function startViewer(data: unknown) {
	// dispose previous instance if the runtime provides it
	if (viewer?.dispose) { try { viewer.dispose(); } catch (_) {} }

	const { start } = await import('$lib/modules/framework.js');
	viewer = await start(canvas, data);
}

function validateJSON() {
	try {
		JSON.parse(jsonText);
		jsonError = '';
		return true;
	} catch (err) {
		jsonError = (err as Error).message;
		return false;
	}
}

function applyManual() {
	if (!validateJSON()) return;
	schema.set(JSON.parse(jsonText));		// triggers viewer restart
}

async function askAI() {
	if (!chatPrompt.trim()) return;
	busyMsg = 'Thinking…';
	try {
		const r = await fetch('/api/spell', {
			method  : 'POST',
			headers : { 'content-type':'application/json' },
			body    : JSON.stringify({ prompt: chatPrompt, schema : JSON.parse(jsonText) })
		});
		if (!r.ok) throw new Error(await r.text());

		const newSchema = await r.json();
		jsonText   = JSON.stringify(newSchema, null, 2);
		jsonError  = '';
		chatPrompt = '';
		schema.set(newSchema);				// triggers viewer restart
	} catch (err) {
		jsonError = 'AI request failed: ' + (err as Error).message;
	} finally {
		busyMsg = '';
	}
}

/* ---- resize handlers ---- */
function startResize(e: MouseEvent) {
	isResizing = true;
	e.preventDefault();           // avoid text selection
}
function handleResize(e: MouseEvent) {
	if (!isResizing) return;
	const pct = (e.clientX / (window.innerWidth || 1)) * 100;
	sidebarWidth = Math.max(20, Math.min(70, pct));   // clamp 20-70 %
}
function stopResize() { isResizing = false; }

/* ---- keyboard shortcut ---- */
function onJsonKey(e: KeyboardEvent) {
	if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
		applyManual();
		e.preventDefault();
	}
}

/* ------------ initial boot ------------ */
onMount(() => {
	const current = get(schema);        // may be {}
	jsonText = current
		? JSON.stringify(current, null, 2)
		: '{\n  \n}';
	validateJSON();

	// 1️⃣ start once
	startViewer(current);

	// 2️⃣ hot-reload on every store change
	const unsub = schema.subscribe(startViewer);

	return () => {
		if (viewer?.dispose) viewer.dispose();
		unsub();
	};
});
</script>

<!-- global listeners so dragging works anywhere -->
<svelte:window on:mousemove={handleResize} on:mouseup={stopResize} />

<div class="wrapper">
	<!-- ───── Sidebar ───── -->
	<div class="sidebar" style="width:{sidebarWidth}%;">
		<textarea
			class="editor"
			bind:value={jsonText}
			spellcheck="false"
			on:input={validateJSON}
			on:keydown={onJsonKey}
		></textarea>

		{#if jsonError}
			<div class="error-bar">{jsonError}</div>
		{/if}

		<div class="panel">
			<div class="row">
				<input
					class="chat-input"
					placeholder="Describe a change…"
					bind:value={chatPrompt}
					on:keydown={(e) => e.key === 'Enter' && askAI()}
				/>
				<button
					class="btn primary"
					on:click={askAI}
					disabled={!chatPrompt.trim() || busyMsg}
				>
					Ask AI
				</button>
			</div>

			<div class="row">
				<button
					class="btn"
					style="flex:1"
					on:click={applyManual}
					disabled={!!jsonError}
				>
					Apply JSON
				</button>
				{#if busyMsg}<span class="status">{busyMsg}</span>{/if}
			</div>

			<div class="hint">⌘ / Ctrl + Enter to apply</div>
		</div>

		<!-- drag handle -->
		<div class="handle" on:mousedown={startResize}></div>
	</div>

	<!-- ───── 3-D viewer ───── -->
	<canvas bind:this={canvas}></canvas>
</div>

<style>
:global(body){
	margin:0;
	font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
	background:#fff;
	color:#1a1a1a;
}

/* layout */
.wrapper{display:flex;height:100vh;}

/* sidebar */
.sidebar{
	display:flex;flex-direction:column;
	min-width:400px;
	background:#fafbfc;
	border-right:1px solid #e1e4e8;
	position:relative;            /* for handle */
}
.editor{
	flex:1;
	padding:16px 20px;
	border:none;resize:none;outline:none;
	font-family:SFMono-Regular,Consolas,monospace;
	font-size:13px;line-height:1.5;
	background:#fff;
}
.error-bar{
	padding:8px 20px;
	background:#fff5f5;
	border-top:1px solid #fed7d7;
	font-size:12px;
	color:#c53030;
	word-break:break-all;
}

.panel{
	padding:16px 20px;
	border-top:1px solid #e1e4e8;
	background:#fff;
}
.row{display:flex;gap:8px;margin-bottom:12px;}
.chat-input{
	flex:1;padding:8px 12px;font-size:13px;
	border:1px solid #d0d7de;border-radius:6px;
}
.chat-input:focus{
	border-color:#0969da;
	box-shadow:0 0 0 3px rgba(9,105,218,.1);
	outline:none;
}
.btn{
	padding:8px 16px;font-size:13px;
	border:1px solid #d0d7de;border-radius:6px;
	background:#f6f8fa;
	cursor:pointer;
}
.btn:hover{background:#f3f4f6;border-color:#c5c9cf;}
.btn:disabled{opacity:.6;cursor:not-allowed;}
.primary{background:#0969da;border-color:#0969da;color:#fff;}
.primary:hover{background:#085ec0;border-color:#085ec0;}

.status{font-size:12px;color:#656d76;align-self:center;}
.hint{font-size:11px;color:#656d76;}

/* drag handle */
.handle{
	position:absolute;top:0;right:-4px;
	width:8px;height:100%;
	cursor:col-resize;background:transparent;
}
.handle:hover{background:rgba(9,105,218,.15);}

/* viewer canvas */
canvas{
	flex:1;width:100%;height:100%;
	display:block;background:#24292f;
}
</style>
