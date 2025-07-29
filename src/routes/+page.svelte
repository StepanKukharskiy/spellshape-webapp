<script lang="ts">
    import { page } from '$app/state';
    import logoText from '$lib/images/spellshape.png'
    import { schema } from '$lib/store';
    import { goto } from '$app/navigation';
    import logo from '$lib/images/spellshape_logo.svg'

    let inputValue = $state('')
    let isLoading = $state(false)
    let user = $state(page.data.user)
    $effect( ()=>{user = page.data.user; })
    
    
    async function handleSubmit() {
        if (!user) {
        goto('/user/signin');
        return;
    }
        if (inputValue.trim()) {
            isLoading = true
            // Your 3D generation logic here
            console.log('Generating 3D model for:', inputValue)
		const message = await fetch(`${page.url.origin}/api/spell`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				prompt: inputValue,
			})
		});
		const messageObject = await message.json();
		const generatedText = messageObject;
		console.log(messageObject);
        schema.set(messageObject);
        isLoading = false
        goto(`/viewer`);
		return generatedText;
        }
    }
    
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            if (event.ctrlKey || event.metaKey) {
                console.log('hi')
                // Ctrl/Cmd + Enter: Allow new line (default behavior)
                return
            } else {
                // Enter alone: Submit
                event.preventDefault()
                handleSubmit()
            }
        }
    }

    function handleSignIn() {
        // Navigate to sign in page or open modal
        window.location.href = '/user/signin'
    }
    
    function handleSignUp() {
        // Navigate to sign up page or open modal
        window.location.href = '/user/signup'
    }

    async function handleSignOut() {
        
        try {
        await fetch('/api/user/signout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // The redirect will happen on the server side
        window.location.href = '/';
    } catch (err) {
        console.error('Logout failed:', err);
    }
    }
</script>

<div class="container">

    <div class="content">
        <div class="auth-header">
            {#if user}
                <div class="user-info">
                    <span>Welcome, {user.email}</span>
                    <button class="auth-btn secondary" onclick={handleSignOut}>Sign Out</button>
                </div>
            {:else}
                <div class="auth-buttons">
                    <button class="auth-btn secondary" onclick={handleSignIn}>Sign In</button>
                    <button class="auth-btn primary" onclick={handleSignUp}>Sign Up</button>
                </div>
            {/if}
        </div>

        <header class="header">
            <div class="logo"><img src='{logoText}' alt='logo'/></div>
            <h1 class='title'>"Ta-da!" moment of 3D generation</h1>

            <!-- <p class="subtitle">Create controllable 3D models with AI magic</p> -->
        </header>
        
        <div class="input-section">
            <div class="input-wrapper">
                <textarea 
                    placeholder="Describe your 3D creation... (e.g., 'A parametric office tower with adjustable twist')"
                    bind:value={inputValue}
                    onkeydown={handleKeydown}
                    rows="2"
                ></textarea>
                <div class="input-footer">
                    <div class="hint">
                        <!-- <kbd>Enter</kbd> to cast spell • <kbd>Ctrl</kbd> + <kbd>Enter</kbd> for new line -->
                    </div>
                    <button 
                        class="generate-btn" 
                        onclick={handleSubmit}
                        disabled={!inputValue.trim() || isLoading}
                    >
                        {#if isLoading}
                            <div class="spinner"></div>
                            Working on it...
                        {:else}
                            <img src='{logo}' alt='logo' style='width: 20px; height: 20px;'/>
                            Spellshape Now
                        {/if}
                    </button>
                </div>
            </div>
        </div>
        
        <div class="examples">
            <p class="examples-title">Try these magical examples:</p>
            <div class="example-chips">
                <button class="chip" onclick={() => inputValue = `Create a modern minimalist dining chair with the following specifications:
    Seat: 45cm x 45cm oak wood seat (#a27c4b) with 5cm thickness, positioned 46cm from the ground
    Backrest: Matching oak wood back panel, 50cm tall and 4cm thick, positioned slightly inset from the rear edge of the seat
    Legs: Four slender cylindrical steel legs in brushed finish (#b0b0b0), 2cm diameter, positioned at each corner with 3cm inset from seat edges
    Style: Contemporary Scandinavian design with warm oak wood contrasting against cool brushed steel, clean geometric proportions, and parametric adjustability for seat dimensions and backrest height
The chair features a classic four-legged design with modern materials - combining the warmth of natural oak wood with the industrial elegance of brushed steel legs.`}>
                    Simple Chair
                </button>
                <button class="chip" onclick={() => inputValue = `Create a modular 3D kitchen with adjustable parameters:
Layout: 3-7 base cabinets (0.45-1.0m wide each), standalone fridge on left, continuous countertop, aligned wall cabinets above
Base Cabinets: 0.8-0.9m high, 0.5-0.7m deep, with side/back panels, shelf, swing door with handle, four cylindrical legs (adjustable height/radius)
Wall Cabinets: 0.6-0.8m high, 0.3-0.4m deep, mounted 0.5m above counter, same door/handle design
Countertop: 0.03-0.06m thick with 2cm overhang
Appliances: Stainless sink (0.55x0.4m) and black glass cooktop (0.58x0.52m), both positionable in any module
Materials: Light cream cabinets, off-white doors, gray countertop, dark metal handles
Controls: GUI groups for Layout, Base, Wall, Worktop, and Appliance positioning
Generate a realistic modern residential kitchen with real-time parameter updates.`}>
                    Kitchen Design
                </button>
                <button class="chip" onclick={() => inputValue = `Create a modern 40-story parametric tower with a 90-degree twist occurring over the middle 35% of its height. The building features:
    Structure: 3-meter floor heights, square footprint, 3 cylindrical columns per side
    Facade: 15 panels per side alternating between bright blue walls (#0000ff) and light gray windows (#f2f2f2) in a checkerboard pattern
    Core: Red-orange central core (#d94026) with dark gray structural columns (#404040)
    Style: Contemporary parametric architecture with clean geometric forms and dramatic rotational geometry`}>
                    Parametric Tower
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .container {
        width: 100%;
        min-height: 100vh;
        min-height: 100svh;
        padding: 20px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at top, #0000eb, #000065);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: relative;
        overflow-y: scroll;
    }

    .background-scribble {
        position: absolute;
        top: 0%;
        left: 50%;
        transform: translateX(-50%);
        width: min(80vh, 100%);
        height: min(80vh, 100%);
        z-index: 1;
        pointer-events: none;
        opacity: 0.6;
    }
    
    .content {
        max-width: 800px;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        position: relative;
        z-index: 10;
    }

    .auth-header {
        width: 100%;
        display: flex;
        justify-content: flex-end;
        margin-bottom: 2rem;
    }
    
    .auth-buttons {
        display: flex;
        gap: 0.75rem;
    }
    
    .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: white;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 0.75rem 1rem;
    }
    
    .auth-btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
    }
    
    .auth-btn.primary {
        background: white;
        color: #0000eb;
    }
    
    .auth-btn.secondary {
        background: transparent;
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .auth-btn:hover {
        transform: translateY(-1px);
    }
    
    .auth-btn.primary:hover {
        background: rgba(255, 255, 255, 0.9);
    }
    
    .auth-btn.secondary:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .header {
        text-align: center;
        margin-bottom: 1rem;
        position: relative;
        z-index: 15;
    }

    .logo {
        font-family: 'Rock Salt';
        font-size: 2rem;
        font-weight: 400;
        color: white;
        margin-bottom: 1rem;
        letter-spacing: 0.5px;
        
    }
    .logo img{
        width: 50%;
    }
    
    .title {
        font-size: 2.3rem;
        font-weight: 700;
        color: white;
        margin: 0 0 0.6rem 0;
    }
    
    .subtitle {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
        font-weight: 400;
    }
    
    .input-section {
        position: relative;
    }
    
    .input-wrapper {
        background: rgba(255, 255, 255, 0.1);
        background: linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 1.5rem;
        transition: all 0.2s ease;
        box-shadow: 0 0 30px rgba(0, 0, 35, 0.1);
    }
    
    .input-wrapper:focus-within {
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.15);
        background: linear-gradient(45deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.15));
    }
    
    textarea {
        width: 100%;
        background: transparent;
        border: none;
        outline: none;
        color: white;
        font-size: 1.2rem;
        line-height: 1.6;
        resize: none;
        min-height: 40px;
        font-family: inherit;
    }
    
    textarea::placeholder {
        color: rgba(255, 255, 255, 0.8);
    }
    
    .input-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        gap: 1rem;
    }
    
    .hint {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.875rem;
    }
    
    kbd {
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        padding: 0.125rem 0.375rem;
        font-size: 0.75rem;
        font-family: monospace;
        color: white;
    }
    
    .generate-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: white;
        color: #0000eb;
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
    }
    
    .generate-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.9);
    }
    
    .generate-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }
    
    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(0, 0, 235, 0.3);
        border-top: 2px solid #0000eb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .examples {
        text-align: center;
    }
    
    .examples-title {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        margin: 0 0 1rem 0;
    }
    
    .example-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: center;
    }
    
    .chip {
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 20px;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .chip:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-1px);
    }
    
    @media (max-width: 640px) {
        .container {
            padding: 1rem;
        }
        
        .background-scribble {
            width: min(400px, 70vh, 95%);
            height: min(400px, 70vh, 95%);
        }
        
        .title {
            font-size: 2rem;
        }

        .logo {
            font-size: 1.25rem;
        }
        
        .input-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
        }
        
        .hint {
            justify-content: center;
        }
        
        .example-chips {
            flex-direction: column;
            align-items: center;
        }
        
        .chip {
            width: 100%;
            max-width: 300px;
        }
    }
</style>
