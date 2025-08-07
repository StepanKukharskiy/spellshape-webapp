<!-- Viewer.svelte -->
<script lang="ts">
	/* ------------ imports ------------ */
	import { onMount } from 'svelte';
	import { schema, generatedPrompt } from '$lib/store';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import logoSrc from '$lib/images/spellshape_logo.svg';
	import logoText from '$lib/images/spellshape_text_logo.svg';
	import { exportSpellToGrasshopper } from '$lib/modules/ghxExporter';

	let canvas: HTMLCanvasElement;

	let jsonText = $state('');
	let chatPrompt = $state('');
	let promptText = $state('');
	let originalPromptText = $state();
	let promptModified = $state(false);
	let originalJsonText = $state('');
	let jsonModified = $state(false);
	let busyChatting = $state(false);
	let busyApplying = $state(false);
	let busyExporting = $state(false);
	let jsonError = $state('');
	let activeTab = $state('prompt');
	let spellName = $state('untitled.spell');
	let sidebarWidth = $state(35);
	let isResizing = false;
	let viewer: any;

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
		if (viewer?.fitToScene) viewer.fitToScene();
	}

	function fitToView() {
		if (viewer?.fitToScene) viewer.fitToScene();
	}

	function exportScene(filename = '') {
		if (viewer?.exportOBJ) viewer.exportOBJ(filename);
		else console.warn('Export functionality not available');
	}

	async function exportGrasshopper() {
		if (busyExporting || !jsonText.trim()) return;
		busyExporting = true;
		try {
			const spellData = JSON.parse(jsonText);
			const filename = spellName.replace('.spell', '.ghx');
			await exportSpellToGrasshopper(spellData, filename);
		} catch (err) {
			console.error('Failed to export Grasshopper file:', err);
			jsonError = 'GHX export failed: ' + (err as Error).message;
		} finally {
			busyExporting = false;
		}
	}

	function validateJSON() {
		try {
			const parsed = JSON.parse(jsonText);
			jsonError = '';
			spellName = extractSpellName(parsed);
			return true;
		} catch (err) {
			jsonError = (err as Error).message;
			return false;
		}
	}

	function applyManual() {
		if (!validateJSON()) return;
		schema.set(JSON.parse(jsonText));
	}

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

	function hasChanges() {
		return (
			(activeTab === 'prompt' && promptModified) ||
			(activeTab === 'json' && (jsonModified || !jsonError))
		);
	}

	function getApplyButtonText() {
		if (activeTab === 'prompt' && promptModified) return '🔄 Apply Prompt Changes';
		if (activeTab === 'json' && jsonModified) return '⚙️ Apply JSON Changes';
		return '✨ Apply Changes';
	}

	function onPromptChange() {
		promptModified = promptText !== originalPromptText;
	}

	function onJsonChange() {
		validateJSON();
		jsonModified = jsonText !== originalJsonText;
	}

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

	function handleKeyboardShortcuts(e: KeyboardEvent) {
		if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
		switch (e.key.toLowerCase()) {
			case 'f': e.preventDefault(); fitToView(); break;
			case '1': e.preventDefault(); setView('front'); break;
			case '2': e.preventDefault(); setView('back'); break;
			case '3': e.preventDefault(); setView('left'); break;
			case '4': e.preventDefault(); setView('right'); break;
			case '5': e.preventDefault(); setView('top'); break;
			case '6': e.preventDefault(); setView('bottom'); break;
			case 'e':
				if (e.metaKey || e.ctrlKey) {
					e.preventDefault();
					exportScene(spellName);
				}
				break;
		}
	}

	function onJsonKey(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			applyManual();
			e.preventDefault();
		}
	}

	function setView(viewName = '') {
		if (viewer?.setView) viewer.setView(viewName);
	}

	onMount(() => {
		const current = get(schema);
		const currentPrompt = get(generatedPrompt);
		jsonText = current ? JSON.stringify(current, null, 2) : '{\n  \n}';
		spellName = extractSpellName(current);
		promptText = currentPrompt || 'No prompt available';
		validateJSON();
		startViewer(current);
		const unsubSchema = schema.subscribe(startViewer);
		const unsubPrompt = generatedPrompt.subscribe((prompt) => {
			promptText = prompt || 'No prompt available';
		});
		return () => {
			viewer?.destroy?.();
			unsubSchema();
			unsubPrompt();
		};
	});
</script>

<svelte:window
	on:mousemove={handleResize}
	on:mouseup={stopResize}
	on:keydown={handleKeyboardShortcuts}
/>

<div class="wrapper">
	<!-- Sidebar -->
	<div class="sidebar" style="width:{sidebarWidth}%;">
		<a class="brand-bar" href="/" onclick={() => goto('/')}>
			<img src={logoSrc} alt="Spellshape" />
			<img src={logoText} alt="Spellshape Text Logo" style="width: fit-content; border-radius: 0;" />
		</a>
		<div class="file-header">{spellName}</div>
		<div class="tab-nav">
			<button
				class="tab-btn {activeTab === 'prompt' ? 'active' : ''} {promptModified ? 'modified' : ''}"
				onclick={() => (activeTab = 'prompt')}
			>
				📝 Prompt
			</button>
			<button
				class="tab-btn {activeTab === 'json' ? 'active' : ''} {jsonModified ? 'modified' : ''}"
				onclick={() => (activeTab = 'json')}
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
					<button
						class="btn btn-primary"
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
					<button
						class="btn btn-toolbar"
						onclick={applyChanges}
						disabled={busyChatting || busyApplying || (activeTab === 'json' && !!jsonError)}
						title={activeTab === 'prompt'
							? 'Regenerate from edited prompt'
							: 'Apply JSON changes and refresh 3D scene'}
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

	<!-- 3D viewer area -->
	<div class="viewer-container">
		<canvas bind:this={canvas}></canvas>
		<!-- Horizontal Toolbar (below canvas) -->
		<div class="toolbar">
			<!-- View Controls Group -->
			<div class="toolbar-group">
				<div class="group-label">Views</div>
				<div class="view-controls">
					<button class="btn btn-toolbar" onclick={fitToView} title="Fit camera to show all objects">
						<svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
							<circle cx="9" cy="9" r="2" />
							<path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
						</svg>
						Fit
					</button>
					<div class="view-divider"></div>
					<button class="btn btn-toolbar" onclick={() => setView('top')} title="Top View">
						<span>
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
								<rect x="3" y="3" width="14" height="14" stroke="black" stroke-width="2" fill="white"/>
								<rect x="6" y="6" width="8" height="3" fill="black"/>
							</svg>
						</span>
						Top
					</button>
					<button class="btn btn-toolbar" onclick={() => setView('bottom')} title="Bottom View">
						<span>
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
								<rect x="3" y="3" width="14" height="14" stroke="black" stroke-width="2" fill="white"/>
								<rect x="6" y="11" width="8" height="3" fill="black"/>
							</svg>
						</span>
						Bottom
					</button>
					<button class="btn btn-toolbar" onclick={() => setView('front')} title="Front View">
						<span>
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
								<rect x="3" y="3" width="14" height="14" stroke="black" stroke-width="2" fill="white"/>
								<rect x="6" y="13" width="8" height="3" fill="black"/>
								<rect x="6" y="6" width="8" height="5" fill="black" fill-opacity="0.2"/>
							</svg>
						</span>
						Front
					</button>
					<button class="btn btn-toolbar" onclick={() => setView('back')} title="Back View">
						<span>
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
								<rect x="3" y="3" width="14" height="14" stroke="black" stroke-width="2" fill="white"/>
								<rect x="6" y="4" width="8" height="3" fill="black"/>
								<rect x="6" y="9" width="8" height="5" fill="black" fill-opacity="0.2"/>
							</svg>
						</span>
						Back
					</button>
					<button class="btn btn-toolbar" onclick={() => setView('left')} title="Left View">
						<span>
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
								<rect x="3" y="3" width="14" height="14" stroke="black" stroke-width="2" fill="white"/>
								<rect x="4" y="6" width="3" height="8" fill="black"/>
							</svg>
						</span>
						Left
					</button>
					<button class="btn btn-toolbar" onclick={() => setView('right')} title="Right View">
						<span>
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
								<rect x="3" y="3" width="14" height="14" stroke="black" stroke-width="2" fill="white"/>
								<rect x="13" y="6" width="3" height="8" fill="black"/>
							</svg>
						</span>
						Right
					</button>
				</div>
				<div class="group-hints">
					<div class="hint">
						<kbd>F</kbd> fit • <kbd>1-6</kbd> toggle views
					</div>
				</div>
			</div>
			<!-- Export Controls Group -->
			<div class="toolbar-group">
				<div class="group-label">Export</div>
				<div class="export-controls">
					<button
						class="btn btn-toolbar"
						onclick={() => exportScene(spellName)}
						title="Export 3D scene as OBJ"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7,10 12,15 17,10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						OBJ
					</button>
					<button
						class="btn btn-toolbar"
						onclick={exportGrasshopper}
						disabled={busyExporting || !jsonText.trim() || !!jsonError}
						title="Export as Grasshopper definition"
					>
						{#if busyExporting}
							<div class="spinner mini"></div>
							Exporting…
						{:else}
							<svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
								<polyline points="7,10 12,15 17,10" />
								<line x1="12" y1="15" x2="12" y2="3" />
							</svg>
							GHX
						{/if}
					</button>
				</div>
				<div class="group-hints">
					<div class="hint">
						<kbd>Ctrl/Cmd</kbd>+<kbd>E</kbd> export OBJ
					</div>
				</div>
			</div>
		</div>
	</div>
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
	/* --- Unified Button Styles --- */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-width: 40px;
		min-height: 40px;
		padding: 0 16px;
		font-size: 1rem;
		font-weight: 500;
		border: 1.5px solid #e1e4e8;
		border-radius: 8px;
		background: #fff;
		color: #24292f;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
		box-sizing: border-box;
		user-select: none;
	}
	.btn:hover:not(:disabled),
	.btn:focus-visible {
		background: #f6f8fa;
		border-color: #0000eb;
		color: #0000eb;
		outline: none;
	}
	.btn:active:not(:disabled) {
		background: #e1e4e8;
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn-primary {
		background: #0000eb;
		color: #fff;
		border-color: #0000eb;
	}
	.btn-primary:hover:not(:disabled),
	.btn-primary:focus-visible {
		background: #2222ff;
		border-color: #0000eb;
		color: #fff;
	}
	.btn-toolbar {
		padding: 0 12px;
		font-size: 0.95rem;
		min-width: 40px;
		min-height: 40px;
	}
	.btn-icon {
		padding: 0;
		width: 40px;
		min-width: 40px;
		min-height: 40px;
		justify-content: center;
	}
	@media (max-width: 640px) {
		.btn, .btn-toolbar, .btn-icon {
			min-width: 36px;
			min-height: 36px;
			font-size: 0.95rem;
			padding: 0 10px;
		}
	}
	/* --- Sidebar, Editor, etc. (unchanged from your code) --- */
	.sidebar {
		display: flex;
		flex-direction: column;
		min-width: 400px;
		background: #fafbfc;
		border: 1px solid #e1e4e8;
		border-radius: 16px;
		box-shadow: 0 0 2px rgba(27, 31, 35, 0.05), 0 0 3px rgba(27, 31, 35, 0.1);
		transition: box-shadow 0.2s ease, transform 0.1s ease;
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
	.brand-bar img { width: 20px; height: 20px; }
	.brand-bar span {
		font-size: 0.95rem;
		font-weight: 600;
		color: #0000eb;
		letter-spacing: 0.1px;
	}
	.brand-bar:hover { background: #f3f4f6; }
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
		position: relative;
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
	.tab-btn.modified::after {
		content: '●';
		position: absolute;
		top: 5px;
		right: 8px;
		color: #0000eb;
		font-size: 8px;
	}
	.tab-content {
		flex: 1;
		display: flex;
		flex-direction: column;
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
	.prompt-editor {
		background: #f8f9fa !important;
		color: #24292f;
		font-style: italic;
	}
	.prompt-editor::placeholder {
		color: #656d76;
		font-style: italic;
	}
	.error-bar {
		padding: 8px 20px;
		background: #fff5f5;
		border-top: 1px solid #fed7d7;
		font-size: 12px;
		color: #c53030;
	}
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
		font-size: 0.75rem;
		color: #656d76;
	}
	kbd {
		background: rgba(0, 0, 0, 0.08);
		border-radius: 4px;
		padding: 0 0.3rem;
		font-size: 0.7rem;
		font-family: monospace;
	}
	.spinner.mini {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(0, 0, 235, 0.3);
		border-top: 2px solid #ffffff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
	.handle {
		position: absolute;
		top: 0;
		right: -4px;
		width: 8px;
		height: 100%;
		cursor: col-resize;
		background: transparent;
	}
	.handle:hover { background: rgba(0, 0, 0, 0.05); }
	.viewer-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: #24292f;
		margin: 10px 10px 10px 5px;
		border-radius: 12px;
		overflow: hidden;
		min-height: 0;
		box-shadow: 0 0 2px rgba(27, 31, 35, 0.05), 0 0 3px rgba(27, 31, 35, 0.1);
		transition: box-shadow 0.2s ease, transform 0.1s ease;
	}
	canvas {
		flex: 1;
		width: 100%;
		min-height: 0;
		display: block;
		background: #24292f;
	}
	.toolbar {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		background: rgba(255, 255, 255, 0.98);
		border-top: 1px solid #e1e4e8;
		padding: 12px 20px;
		backdrop-filter: blur(8px);
		min-height: 60px;
	}
	.toolbar-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-items: flex-start;
	}
	.group-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: #656d76;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 2px;
	}
	.view-controls {
		display: flex;
		gap: 6px;
		align-items: center;
		flex-wrap: wrap;
	}
	.export-controls {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.view-divider {
		width: 1px;
		height: 24px;
		background: #e1e4e8;
		margin: 0 4px;
	}
	.toolbar-hints {
		margin-left: auto;
		display: flex;
		align-items: center;
	}
	.group-hints {
		margin-top: 2px;
	}
	@media (max-width: 768px) {
		.toolbar {
			flex-direction: column;
			gap: 16px;
			padding: 16px;
			align-items: stretch;
		}
		.toolbar-group { align-items: center; }
		.toolbar-hints { margin-left: 0; justify-content: center; }
		.view-controls { justify-content: center; }
		.export-controls { justify-content: center; }
		.viewer-container { margin: 10px; }
	}
	@media (max-width: 640px) {
		.sidebar { min-width: 260px; }
		.control-card { margin: 12px; }
		.footer-row { flex-direction: column; align-items: stretch; }
		.view-btn, .toolbar-btn, .btn, .btn-toolbar, .btn-icon {
			padding: 6px 8px;
			font-size: 0.7rem;
			min-width: 36px;
			min-height: 36px;
		}
		.toolbar-hints .hint { font-size: 0.7rem; }
	}
</style>
