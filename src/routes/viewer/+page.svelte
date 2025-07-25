<script lang="ts">
/* ------------ imports ------------ */
import { onMount } from 'svelte';
import { schema }  from '$lib/store';
import { get }     from 'svelte/store';
import { goto }    from '$app/navigation';       
	import logoSrc     from '$lib/images/spellshape_logo.svg'; 
	import logoText from '$lib/images/spellshape_text_logo.svg'

/* ------------ local state ------------ */
let canvas: HTMLCanvasElement;

let jsonText   = '';
let chatPrompt = '';
let busyMsg    = '';
let jsonError  = '';

/* file-name shown in the header */
let spellName  = 'untitled.spell';

/* ---- sidebar width & drag ---- */
let sidebarWidth = 35;   // %
let isResizing   = false;

/* ---- 3-D runtime handle ---- */
let viewer: any;         // whatever `$lib/modules/framework.js` returns

/* ------------ helpers ------------ */
function extractSpellName(obj: any): string {
	if (obj?.children && Array.isArray(obj.children)) {
		const tpl = obj.children.find(
			(c: any) => c.type === 'parametric_template' && c.id
		);
		if (tpl?.id) return `${tpl.id}.spell`;
	}
	return 'untitled.spell';
}

async function startViewer(data: unknown) {
	if (viewer?.dispose) viewer.dispose?.();
	const { start } = await import('$lib/modules/framework.js');
	viewer = await start(canvas, data);
}

function validateJSON() {
	try {
		const parsed = JSON.parse(jsonText);
		jsonError  = '';
		spellName  = extractSpellName(parsed);   // ▲ update name
		return true;
	} catch (err) {
		jsonError = (err as Error).message;
		return false;
	}
}

function applyManual() {
	if (!validateJSON()) return;
	schema.set(JSON.parse(jsonText));          // viewer restarts via store sub
}

async function askAI() {
	if (!chatPrompt.trim()) return;
	busyMsg = 'Thinking…';

	try {
		const r = await fetch('/api/spell', {
			method  : 'POST',
			headers : { 'content-type':'application/json' },
			body    : JSON.stringify({
				prompt : chatPrompt,
				schema : JSON.parse(jsonText)      // send current schema as context
			})
		});
		if (!r.ok) throw new Error(await r.text());

		const newSchema = await r.json();
		jsonText  = JSON.stringify(newSchema, null, 2);
		spellName = extractSpellName(newSchema); // ▲ update name
		jsonError = '';
		chatPrompt = '';
		schema.set(newSchema);                   // triggers viewer restart
	} catch (err) {
		jsonError = 'AI request failed: ' + (err as Error).message;
	} finally {
		busyMsg = '';
	}
}

/* ---- resize handlers ---- */
function startResize(e: MouseEvent) { isResizing = true; e.preventDefault(); }
function handleResize(e: MouseEvent) {
	if (!isResizing) return;
	sidebarWidth = Math.max(20, Math.min(70,
		(e.clientX / (window.innerWidth || 1)) * 100));
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
	const current = get(schema);
	jsonText  = current ? JSON.stringify(current, null, 2) : '{\n  \n}';
	spellName = extractSpellName(current);
	validateJSON();

	startViewer(current);                 // boot once
	const unsub = schema.subscribe(startViewer); // hot-reload on change

	return () => { viewer?.dispose?.(); unsub(); };
});
</script>

<svelte:window on:mousemove={handleResize} on:mouseup={stopResize} />

<div class="wrapper">
	<!-- ───── Sidebar ───── -->
	<div class="sidebar" style="width:{sidebarWidth}%;">
		<a class="brand-bar" href="/" on:click|preventDefault={() => goto('/')}>
			<img src={logoSrc} alt="Spellshape" />
			<img src={logoText} alt="Spellshape Text Logo" style="width: fit-content; border-radius: 0;"/>
		</a>

		<div class="file-header">{spellName}</div>       

		<textarea
			class="editor"
			bind:value={jsonText}
			spellcheck="false"
			on:input={validateJSON}
			on:keydown={onJsonKey}
		></textarea>

		{#if jsonError}<div class="error-bar">{jsonError}</div>{/if}

		<!-- glass-style control card (unchanged) -->
		<div class="control-card">
			<textarea class="chat-box"
			          rows="2"
			          placeholder="Describe a change…"
			          bind:value={chatPrompt}
			          on:keydown={(e)=>e.key==='Enter'&&!e.shiftKey&&askAI()}></textarea>

			<div class="footer-row">
				<div class="hint"><kbd>Shift</kbd>+<kbd>Enter</kbd> new line • <kbd>Enter</kbd> send</div>
				<div style='display: flex; width: 100%; justify-content: space-between;'>
				<button class="generate-btn"
				        on:click={askAI}
				        disabled={!chatPrompt.trim() || busyMsg}>
					{#if busyMsg}<div class="spinner mini"></div> Working…{:else}
						<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
						Ask&nbsp;AI
					{/if}
				</button>

				<button class="apply-btn"
			        on:click={applyManual}
			        disabled={!!jsonError}
					title="Parse the text above and refresh the 3-D scene">
				Apply&nbsp;Manual&nbsp;Fix
			</button>
			</div>
			</div>

			
		</div>

		<div class="handle" on:mousedown={startResize}></div>
	</div>

	<!-- ───── 3-D viewer ───── -->
	<canvas bind:this={canvas}></canvas>
</div>

<style>
:global(body){margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;}

.wrapper{display:flex;height:100vh;}

/* ---------- sidebar & editor ---------- */
.sidebar{display:flex;flex-direction:column;min-width:400px;background:#fafbfc;border-right:1px solid #e1e4e8;position:relative;}
.brand-bar{
	display:flex;align-items:center;gap:.5rem;
	padding:10px 20px;
	background:#fff;
	border-bottom:1px solid #e1e4e8;
	text-decoration:none;
	user-select:none;
}
.brand-bar img{width:20px;height:20px;}
.brand-bar span{
	font-size:.95rem;
	font-weight:600;
	color:#0000eb;          /* matches landing page primary colour */
	letter-spacing:.1px;
}
.brand-bar:hover{background:#f3f4f6;}

.file-header{
	padding:10px 20px;
	background:#fff;
	font-size:.9rem;
	font-family:SFMono-Regular,Consolas,monospace;
	font-weight:600;
	color:#444;
	border-bottom:1px solid #e1e4e8;
}

.editor{
	flex:1;padding:16px 20px;border:none;resize:none;outline:none;
	font-family:SFMono-Regular,Consolas,monospace;font-size:13px;line-height:1.5;background:#fff;
}

.error-bar{padding:8px 20px;background:#fff5f5;border-top:1px solid #fed7d7;font-size:12px;color:#c53030;}

/* ---------- control card (same as before) ---------- */
.control-card{
	margin:16px 20px 20px;
	padding:10px;
	border-radius:20px;
	/* border:2px solid rgba(0,0,0,0.07);
	background:linear-gradient(45deg,rgba(255,255,255,.35),rgba(255,255,255,.15));
	backdrop-filter:blur(10px); */
	background-color: #fff;
  border: 1px solid #e1e4e8;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(27,31,35,0.05), 0 1px 3px rgba(27,31,35,0.1);
  transition: box-shadow 0.2s ease, transform 0.1s ease;
	display:flex;flex-direction:column;gap:1rem;
}
.chat-box{width:100%;min-height:45px;resize:none;background:transparent;border:none;outline:none;font-size:1rem;line-height:1.4;font-family:inherit;}
.footer-row{display:flex;justify-content:space-between;align-items:center;gap:.75rem;flex-wrap:wrap;}
.hint{font-size:.8rem;color:#555;}
kbd{background:rgba(0,0,0,.08);border-radius:4px;padding:0 .3rem;font-size:.7rem;font-family:monospace;}

.generate-btn,.apply-btn{display:flex;align-items:center;gap:.5rem;border:none;border-radius:8px;padding:.7rem 1.5rem;font-size:.95rem;font-weight:600;cursor:pointer;transition:all .2s ease;}
.generate-btn{background:#0000eb;color:#fff;border:2px solid #0000eb;}
.generate-btn:hover:not(:disabled){background:rgba(255,255,255,.9);transform:translateY(-1px);}
.generate-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;}

.apply-btn{justify-content:center;background:transparent;color:#0000eb;border:2px solid #0000eb;}
.apply-btn:hover:not(:disabled){background:rgba(0,0,235,.06);transform:translateY(-1px);}
.apply-btn:disabled{opacity:.4;cursor:not-allowed;}

.spinner.mini{width:14px;height:14px;border:2px solid rgba(0,0,235,.3);border-top:2px solid #0000eb;border-radius:50%;animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

.handle{position:absolute;top:0;right:-4px;width:8px;height:100%;cursor:col-resize;background:transparent;}
.handle:hover{background:rgba(0,0,0,.05);}

/* viewer */
canvas{flex:1;width:100%;height:100%;display:block;background:#24292f;}

@media(max-width:640px){
	.sidebar{min-width:260px;}
	.control-card{margin:12px;}
	.footer-row{flex-direction:column;align-items:stretch;}
}
</style>
