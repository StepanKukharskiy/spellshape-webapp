<script lang="ts">
	/* ------------ imports ------------ */
	import { onMount } from 'svelte';
	import { schema, generatedPrompt } from '$lib/store';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import logoSrc from '$lib/images/spellshape_logo.svg';
	import logoText from '$lib/images/spellshape_text_logo.svg';

	/* ------------ local state ------------ */
	let canvas: HTMLCanvasElement;

	let jsonText = $state('');
	let chatPrompt = $state('');
	let promptText = $state('');
	let originalPromptText = $state(); // Store the original for comparison
	let promptModified = $state(false); // Track if prompt was changed
	let originalJsonText = $state('');
let jsonModified = $state(false);
	let busyChatting = $state(false);  // For Ask AI button  
let busyApplying = $state(false);  // For Apply Changes button
	let jsonError = $state('');
	let activeTab = $state('prompt');

	/* file-name shown in the header */
	let spellName = $state('untitled.spell');

	/* ---- sidebar width & drag ---- */
	let sidebarWidth = $state(35); // %
	let isResizing = false;

	/* ---- 3-D runtime handle ---- */
	let viewer: any; // whatever `$lib/modules/framework.js` returns

	/* ------------ helpers ------------ */
	function extractSpellName(obj: any): string {
		if (obj?.children && Array.isArray(obj.children)) {
			const tpl = obj.children.find((c: any) => c.type === 'parametric_template' && c.id);
			if (tpl?.id) return `${tpl.id}.spell`;
		}
		return 'untitled.spell';
	}

	async function startViewer(data: unknown) {
		if (viewer?.dispose) viewer.dispose?.();
		const { start } = await import('$lib/modules/framework.js');
		viewer = await start(canvas, data);
	}

	// Export function
    function exportScene(filename = '') {
        if (viewer?.exportOBJ) {
            viewer.exportOBJ(filename);
        } else {
            console.warn('Export functionality not available');
        }
    }

	function validateJSON() {
		try {
			const parsed = JSON.parse(jsonText);
			jsonError = '';
			spellName = extractSpellName(parsed); // ▲ update name
			return true;
		} catch (err) {
			jsonError = (err as Error).message;
			return false;
		}
	}

	function applyManual() {
		if (!validateJSON()) return;
		schema.set(JSON.parse(jsonText)); // viewer restarts via store sub
	}

	// Function to apply prompt changes
async function applyPromptChanges() {
    try {
        const response = await fetch('/api/generateJson', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                prompt: promptText.trim(),
                regenerateFromPrompt: true
            })
        });
        
        if (!response.ok) throw new Error(await response.text());
        
        const newSchema = await response.json();
        jsonText = JSON.stringify(newSchema, null, 2);
        originalJsonText = jsonText;
        spellName = extractSpellName(newSchema);
        jsonError = '';
        
        // Update stores and reset modification flags
        schema.set(newSchema);
        generatedPrompt.set(promptText);
        originalPromptText = promptText;
        promptModified = false;
        jsonModified = false;
        
    } catch (err) {
        jsonError = 'Prompt regeneration failed: ' + (err as Error).message;
    }
}

async function applyJsonChanges() {
    if (!validateJSON()) return;
    
    try {
        const parsed = JSON.parse(jsonText);
        schema.set(parsed);
        originalJsonText = jsonText;
        jsonModified = false;
        spellName = extractSpellName(parsed);
    } catch (err) {
        jsonError = (err as Error).message;
    }
}

/* Check if there are any pending changes */
function hasChanges() {
    return (activeTab === 'prompt' && promptModified) || 
           (activeTab === 'json' && (jsonModified || !jsonError));
}

/* Get appropriate button text */
function getApplyButtonText() {
    if (activeTab === 'prompt' && promptModified) return '🔄 Apply Prompt Changes';
    if (activeTab === 'json' && jsonModified) return '⚙️ Apply JSON Changes';
    return '✨ Apply Changes';
}



// Track prompt changes
function onPromptChange() {
    promptModified = promptText !== originalPromptText;
}

function onJsonChange() {
    validateJSON();
    jsonModified = jsonText !== originalJsonText;
}


/* Unified apply function that handles both cases */
async function applyChanges() {
    if (busyChatting || busyApplying) return;
    busyApplying = true;
    
    try {
        if (activeTab === 'prompt' && promptModified) {
            await applyPromptChanges();
        } else if (activeTab === 'json' && jsonModified) {
            await applyJsonChanges();
        } else if (activeTab === 'json' && !jsonError) {
            await applyJsonChanges();
        }
    } finally {
        busyApplying = false;
    }
}


	async function askAI() {
    if (!chatPrompt.trim() || busyChatting || busyApplying) return;
    busyChatting = true;

    try {
        const r = await fetch('/api/generateJson', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                prompt: chatPrompt,
                schema: JSON.parse(jsonText)
            })
        });
        if (!r.ok) throw new Error(await r.text());

        const newSchema = await r.json();
        jsonText = JSON.stringify(newSchema, null, 2);
        spellName = extractSpellName(newSchema);
        jsonError = '';
        chatPrompt = '';
        schema.set(newSchema);
    } catch (err) {
        jsonError = 'AI request failed: ' + (err as Error).message;
    } finally {
        busyChatting = false;
    }
}


	/* ---- resize handlers ---- */
	function startResize(e: MouseEvent) {
		isResizing = true;
		e.preventDefault();
	}
	function handleResize(e: MouseEvent) {
		if (!isResizing) return;
		sidebarWidth = Math.max(20, Math.min(70, (e.clientX / (window.innerWidth || 1)) * 100));
	}
	function stopResize() {
		isResizing = false;
	}

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
		const currentPrompt = get(generatedPrompt);
		jsonText = current ? JSON.stringify(current, null, 2) : '{\n  \n}';
		spellName = extractSpellName(current);
		promptText = currentPrompt || 'No prompt available';
		validateJSON();

		startViewer(current); // boot once
		const unsubSchema = schema.subscribe(startViewer);
        const unsubPrompt = generatedPrompt.subscribe((prompt) => {
            promptText = prompt || 'No prompt available';
        });

        return () => {
            viewer?.dispose?.();
            unsubSchema();
            unsubPrompt();
        };
	});
</script>

<svelte:window on:mousemove={handleResize} on:mouseup={stopResize} />

<div class="wrapper">
	<!-- ───── Sidebar ───── -->
	<div class="sidebar" style="width:{sidebarWidth}%;">
		<a class="brand-bar" href="/" onclick={() => goto('/')}>
			<img src={logoSrc} alt="Spellshape" />
			<img
				src={logoText}
				alt="Spellshape Text Logo"
				style="width: fit-content; border-radius: 0;"
			/>
		</a>

		<div class="file-header">{spellName}</div>

		<div class="tab-nav">
        <button 
        class="tab-btn {activeTab === 'prompt' ? 'active' : ''} {promptModified ? 'modified' : ''}"
        onclick={() => activeTab = 'prompt'}
    >
        📝 Prompt
    </button>
    <button 
        class="tab-btn {activeTab === 'json' ? 'active' : ''} {jsonModified ? 'modified' : ''}"
        onclick={() => activeTab = 'json'}
    >
        ⚙️ JSON
    </button>
    </div>

		<div class="tab-content">
        {#if activeTab === 'prompt'}
        <textarea
            class="editor prompt-editor"
            bind:value={promptText}
            spellcheck="false"
            oninput={onPromptChange}
            placeholder="Edit the prompt to regenerate your 3D model..."
        ></textarea>
    {:else}
        <textarea
            class="editor"
            bind:value={jsonText}
            spellcheck="false"
            oninput={onJsonChange}
            onkeydown={onJsonKey}
        ></textarea>
    {/if}
    </div>

    {#if jsonError && activeTab === 'json'}<div class="error-bar">{jsonError}</div>{/if}

		<div class="control-card">
			<textarea
				class="chat-box"
				rows="2"
				placeholder="Describe a change…"
				bind:value={chatPrompt}
				onkeydown={(e) => e.key === 'Enter' && !e.shiftKey && askAI()}
			></textarea>

			<div class="footer-row">
				<div class="hint"><kbd>Shift</kbd>+<kbd>Enter</kbd> new line • <kbd>Enter</kbd> send</div>
				<div style="display: flex; width: 100%; justify-content: start; gap: 10px;">
					<!-- Ask AI Button -->
    <button 
        class="generate-btn" 
        onclick={askAI} 
        disabled={!chatPrompt.trim() || busyChatting || busyApplying}
    >
        {#if busyChatting}
            <div class="spinner mini"></div>
            Thinking…
        {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Ask&nbsp;AI
        {/if}
    </button>

    <!-- Apply Changes Button -->
    <button
        class="apply-btn {hasChanges() ? 'has-changes' : ''}"
        onclick={applyChanges}
        disabled={busyChatting || busyApplying || (activeTab === 'json' && !!jsonError)}
        title={activeTab === 'prompt' ? 'Regenerate from edited prompt' : 'Apply JSON changes and refresh 3D scene'}
    >
        {#if busyApplying}
            <div class="spinner mini"></div>
            Working…
        {:else}
            {getApplyButtonText()}
        {/if}
    </button>

				</div>
			</div>
		</div>

		<div class="handle" onmousedown={startResize}></div>
	</div>

	<!-- ───── 3-D viewer ───── -->
	<canvas bind:this={canvas}></canvas>

	<button class="export-fab" onclick={()=>{exportScene(spellName)}} title="Export 3-D scene">
  <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg> OBJ
</button>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	}

	.wrapper {
		display: flex;
		height: 100vh;
	}

	/* ---------- sidebar & editor ---------- */
	.sidebar {
		display: flex;
		flex-direction: column;
		min-width: 400px;
		background: #fafbfc;
		border: 1px solid #e1e4e8;
		border-radius: 16px;
		box-shadow:
			0 1px 2px rgba(27, 31, 35, 0.05),
			0 1px 3px rgba(27, 31, 35, 0.1);
		transition:
			box-shadow 0.2s ease,
			transform 0.1s ease;
		position: relative;
		margin: 10px;
		box-sizing: border-box;
	}
	.brand-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 10px 20px;
		background: #fff;
		border-bottom: 1px solid #e1e4e8;
		border-radius: 16px 16px 0 0;
		text-decoration: none;
		user-select: none;
	}
	.brand-bar img {
		width: 20px;
		height: 20px;
	}
	.brand-bar span {
		font-size: 0.95rem;
		font-weight: 600;
		color: #0000eb; /* matches landing page primary colour */
		letter-spacing: 0.1px;
	}
	.brand-bar:hover {
		background: #f3f4f6;
	}

	.file-header {
		padding: 10px 20px;
		background: #fff;
		font-size: 0.9rem;
		font-family: SFMono-Regular, Consolas, monospace;
		font-weight: 600;
		color: #444;
		border-bottom: 1px solid #e1e4e8;
	}

	.tab-nav {
    display: flex;
    background: #f6f8fa;
    border-bottom: 1px solid #e1e4e8;
}

.tab-btn {
    flex: 1;
    padding: 10px 16px;
    background: transparent;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    color: #656d76;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent;
}

.tab-btn:hover {
    background: rgba(0, 0, 235, 0.04);
    color: #0000eb;
}

.tab-btn.active {
    color: #0000eb;
    background: #fff;
    border-bottom-color: #0000eb;
    font-weight: 600;
}

.tab-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.prompt-editor {
    background: #f8f9fa !important;
    color: #24292f;
    font-style: italic;
}

.prompt-editor::placeholder {
    color: #656d76;
    font-style: italic;
}

.prompt-editor {
    background: #fff !important;
    color: #24292f;
    border: 1px solid #e1e4e8;
}

.prompt-actions {
    padding: 12px 20px;
    background: #f6f8fa;
    border-top: 1px solid #e1e4e8;
    display: flex;
    gap: 10px;
    align-items: center;
}
.apply-btn.has-changes {
    background: #0000eb;
    color: white;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.tab-btn {
    position: relative;
}

/* Add small indicator for modified tabs */
.tab-btn.modified::after {
    content: '●';
    position: absolute;
    top: 5px;
    right: 8px;
    color: #0000eb;
    font-size: 8px;
}



	.editor {
		flex: 1;
		padding: 16px 20px;
		border: none;
		resize: none;
		outline: none;
		font-family: SFMono-Regular, Consolas, monospace;
		font-size: 13px;
		line-height: 1.5;
		background: #fff;
	}

	.error-bar {
		padding: 8px 20px;
		background: #fff5f5;
		border-top: 1px solid #fed7d7;
		font-size: 12px;
		color: #c53030;
	}

	/* ---------- control card (same as before) ---------- */
	.control-card {
		margin: 0px;
		padding: 10px;
		background-color: #fff;
		border-top: 1px solid #e1e4e8;
		border-radius: 0 0 20px 20px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.chat-box {
		width: 100%;
		min-height: 45px;
		resize: none;
		background: transparent;
		border: none;
		outline: none;
		font-size: 1rem;
		line-height: 1.4;
		font-family: inherit;
	}
	.footer-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.hint {
		font-size: 0.8rem;
		color: #555;
	}
	kbd {
		background: rgba(0, 0, 0, 0.08);
		border-radius: 4px;
		padding: 0 0.3rem;
		font-size: 0.7rem;
		font-family: monospace;
	}

	.generate-btn,
	.apply-btn, 
	.export-fab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: none;
		border-radius: 8px;
		padding: 0.7rem 1.5rem;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.generate-btn {
		background: #0000eb;
		color: #fff;
		border: 2px solid #0000eb;
	}
	.generate-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.9);
		transform: translateY(-1px);
	}
	.generate-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.apply-btn, .export-fab {
		justify-content: center;
		background: transparent;
		color: #0000eb;
		border: 2px solid #0000eb;
	}
	.apply-btn:hover:not(:disabled), .export-fab:hover:not(:disabled) {
		background: rgba(0, 0, 235, 0.6);
		transform: translateY(-1px);
	}
	.apply-btn:disabled, .export-fab:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.spinner.mini {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(0, 0, 235, 0.3);
		border-top: 2px solid #ffffff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.handle {
		position: absolute;
		top: 0;
		right: -4px;
		width: 8px;
		height: 100%;
		cursor: col-resize;
		background: transparent;
	}
	.handle:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	/* viewer */
	canvas {
		flex: 1;
		width: 100%;
		height: 100%;
		display: block;
		background: #24292f;
	}

	.export-fab {
  position: fixed;           /* stays put during scrolling */
  right: 24px;               /* bottom-right corner */
  bottom: 24px;
  padding: 0.7rem 1.2rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  justify-content: center;
		background: transparent;
		color: #0000eb;
		border: 2px solid #0000eb;
  transition: transform 0.15s ease;
}
.export-fab:hover   { transform: translateY(-2px); }
.export-fab:active  { transform: translateY( 0 ); }

	@media (max-width: 640px) {
		.sidebar {
			min-width: 260px;
		}
		.control-card {
			margin: 12px;
		}
		.footer-row {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>
