<script lang="ts">
    import logo from '$lib/images/spellshape.png'
    let inputValue = $state('')
    let isLoading = $state(false)
    let user = $state(null)
    
    function handleSubmit() {
        if (inputValue.trim()) {
            isLoading = true
            // Your 3D generation logic here
            console.log('Generating 3D model for:', inputValue)
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
        window.location.href = '/auth/signin'
    }
    
    function handleSignUp() {
        // Navigate to sign up page or open modal
        window.location.href = '/auth/signup'
    }
</script>

<div class="container">
    <!-- Simplified Background SVG -->
    <svg class="background-scribble" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
        <path d="M300 50 Q450 150 350 300 Q500 450 300 400 Q150 550 250 300 Q50 150 300 200 Q550 250 400 450 Q200 600 300 350 Q600 200 450 300 Q100 400 350 150 Q500 50 300 250" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.8)" 
              stroke-width="1.5" 
              stroke-linecap="round"/>
        <path d="M300 100 Q400 200 200 300 Q500 400 300 500 Q100 300 400 250 Q550 150 250 400 Q50 500 350 200 Q600 300 300 450" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.5)" 
              stroke-width="1" 
              stroke-linecap="round"/>
    </svg>

    <div class="content">
        <div class="auth-header">
            {#if user}
                <div class="user-info">
                    <span>Welcome, {user.name}</span>
                    <button class="auth-btn secondary">Sign Out</button>
                </div>
            {:else}
                <div class="auth-buttons">
                    <button class="auth-btn secondary" onclick={handleSignIn}>Sign In</button>
                    <button class="auth-btn primary" onclick={handleSignUp}>Sign Up</button>
                </div>
            {/if}
        </div>

        <header class="header">
            <div class="logo"><img src='{logo}' alt='logo'/></div>
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                            Spellshape Now
                        {/if}
                    </button>
                </div>
            </div>
        </div>
        
        <div class="examples">
            <p class="examples-title">Try these magical examples:</p>
            <div class="example-chips">
                <button class="chip" onclick={() => inputValue = "A parametric office building with adjustable floor heights"}>
                    Office Building
                </button>
                <button class="chip" onclick={() => inputValue = "A voxel landscape with customizable rocks and caves"}>
                    Voxel Landscape
                </button>
                <button class="chip" onclick={() => inputValue = "A modular furniture set with interchangeable components"}>
                    Modular Furniture
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
        background: #0000eb;
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
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
        margin: 0 0 0.5rem 0;
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
