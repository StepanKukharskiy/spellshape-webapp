<script lang="ts">
	import { goto } from '$app/navigation';
    import { invalidateAll } from '$app/navigation';
	import logoText from '$lib/images/spellshape_text_logo.svg';
    import logo from '$lib/images/spellshape_logo.svg';

	let email = '';
	let password = '';
	let loading = false;
	let errorMsg = '';

	async function handleLogin() {
		if (!email.trim() || !password.trim()) {
			errorMsg = 'Please fill in both fields.';
			return;
		}
		loading = true;
		errorMsg = '';

        const formData = new FormData();
		formData.append('email', email);
		formData.append('password', password);

		try {
			/* ⇣ replace with real endpoint / Supabase / Auth.js etc. */
			const r = await fetch('/api/user/signin', {
				method: 'POST',
				body:formData
			});
			if (!r.ok) throw new Error(await r.text());
            await invalidateAll();
			/* on success -> go to main page */
			goto('/');
		} catch (err) {
			errorMsg = (err as Error).message || 'Login failed.';
		} finally {
			loading = false;
		}
	}

	function keydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleLogin();
	}
</script>

<div class="page">
	<form class="login-card card" on:submit|preventDefault={handleLogin}>
		<img class="logo" src={logo} alt="Spellshape" />

		<img class="logo-text" src={logoText} alt="Spellshape" />

		<label>
			<span>Email</span>
			<input
				type="email"
				bind:value={email}
				autocomplete="email"
				on:keydown={keydown}
                placeholder="ada@lovelace.com"
				required
			/>
		</label>

		<label>
			<span>Password</span>
			<input
				type="password"
				bind:value={password}
				autocomplete="current-password"
				on:keydown={keydown}
                placeholder="Fortuna Major"
				required
			/>
		</label>

		{#if errorMsg}
			<p class="error">{errorMsg}</p>
		{/if}

		<button class="primary-btn" type="submit" disabled={loading}>
			{#if loading}
				<div class="spinner mini"></div> Signing&nbsp;in…
			{:else}
				Sign&nbsp;in
			{/if}
		</button>
	</form>
</div>

<style>
/* ---------- page frame ---------- */
.page{
	min-height:100vh;
	display:flex;
	justify-content:center;
	align-items:center;
	background:#f6f8fa;
	padding:1rem;
	box-sizing:border-box;
}

/* ---------- base card (same recipe you used) ---------- */
.card{
	background:#fff;
	border:1px solid #e1e4e8;
	border-radius:16px;
	box-shadow:0 1px 2px rgba(27,31,35,.05), 0 1px 3px rgba(27,31,35,.1);
	transition:box-shadow .2s ease,transform .1s ease;
}
.card:hover{ box-shadow:0 4px 6px rgba(27,31,35,.1), 0 2px 4px rgba(27,31,35,.08); }

/* ---------- login-specific ---------- */
.login-card{
	width:100%;
	max-width:420px;
	padding:32px 36px;
	display:flex;
	flex-direction:column;
	gap:1.25rem;
}

.logo{ width:30px; align-self:center; }
.logo-text{ width:200px; align-self:center; border-radius: 0;}

h2{ margin:0 0 .25rem; font-size:1.35rem; text-align:center; color:#000; }

label{
	display:flex;
	flex-direction:column;
	gap:.35rem;
	font-size:.9rem;
	color:#444;
}

input{
	padding:.65rem .75rem;
	border:1px solid #e1e4e8;
	border-radius:6px;
	font-size:1rem;
	font-family:inherit;
}
input:focus{
	outline:none;
	box-shadow:0 0 0 3px rgba(0,0,235,.25);
}

.error{
	color:#c53030;
	font-size:.85rem;
	margin:-.25rem 0 .25rem;
}

/* primary button (mirror generate-btn) */
.primary-btn{
	display:flex;
	justify-content:center;
	align-items:center;
	gap:.5rem;
	padding:.75rem 1.5rem;
	border:none;
	border-radius:8px;
	font-weight:600;
	font-size:1rem;
	background:#0000eb;
	color:#fff;
	cursor:pointer;
	transition:all .2s ease;
}
.primary-btn:hover:not(:disabled){
	background:rgba(0,0,235,.9);
	transform:translateY(-1px);
}
.primary-btn:disabled{ opacity:.6; cursor:not-allowed; transform:none; }

/* mini spinner already exists in your viewer css; re-use */
.spinner.mini{
	width:14px;height:14px;
	border:2px solid rgba(0,0,235,.3);
	border-top:2px solid #0000eb;
	border-radius:50%;
	animation:spin 1s linear infinite;
}
@keyframes spin{ to{ transform:rotate(360deg);} }

@media(max-width:480px){
	.login-card{ padding:24px; }
}
</style>
