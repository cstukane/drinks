// settingsFlow.js
// Settings flow controller for Dicey Drinks

import { register, transitionTo } from '../stateMachine.js';

// Create the settings flow states
function createSettingsStates() {
    // SETTINGS state
    return {
        enter: () => {
            console.log('Entering SETTINGS state');
            const appContainer = document.getElementById('app-container');
            let html = '<h2>Settings</h2>';
            html += '<button id="back-to-idle">Back</button>';

            // Add dev validations panel inside the settings page
            html += '<div id="dev-validations-panel" style="margin: 16px auto; max-width: 420px; background: #222; border: 1px solid #00ffff; border-radius: 6px; padding: 12px;">';
            html += '<div id="dev-info"><div><strong>Dev Validations</strong></div></div>';
            html += '</div>';

            appContainer.innerHTML = html;

            document.getElementById('back-to-idle').addEventListener('click', () => transitionTo('IDLE'));

            // Populate the dev panel content
            setTimeout(() => {
                const infoEl = document.getElementById('dev-info');
                if (infoEl) {
                    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    infoEl.innerHTML = `
                        <div><strong>Dev Validations</strong></div>
                        <div>WebGL: ${window.devIsWebGLSupported() ? 'supported' : 'not supported'}</div>
                        <div>Reduced motion: ${reduced ? 'true' : 'false'}</div>
                    `;
                }

                const panelEl = document.getElementById('dev-validations-panel');
                if (panelEl) {
                    const buttonsDiv = document.createElement('div');
                    buttonsDiv.style.marginTop = '8px';
                    const runBtn = document.createElement('button');
                    runBtn.id = 'run-anim-perf';
                    runBtn.textContent = 'Run Anim Perf';
                    const forceFallbackBtn = document.createElement('button');
                    forceFallbackBtn.id = 'force-fallback-roll';
                    forceFallbackBtn.textContent = 'Force Fallback Roll';
                    forceFallbackBtn.style.marginLeft = '5px';
                    const output = document.createElement('div');
                    output.id = 'dev-output';
                    output.style.marginTop = '10px';
                    output.style.textAlign = 'left';
                    output.style.fontFamily = 'monospace';
                    output.style.fontSize = '12px';
                    const mount = document.createElement('div');
                    mount.id = 'dev-mount';
                    mount.className = 'roll-wrap';
                    mount.style.marginTop = '12px';

                    buttonsDiv.appendChild(runBtn);
                    buttonsDiv.appendChild(forceFallbackBtn);
                    panelEl.appendChild(buttonsDiv);
                    panelEl.appendChild(output);
                    panelEl.appendChild(mount);

                    // Add event listeners
                    runBtn.addEventListener('click', async () => {
                        const parent = document.getElementById('dev-mount');
                        if (!parent) return;
                        parent.innerHTML = '';
                        const N = 12; const k = 7;
                        const start = performance.now();
                        try {
                            if (window.roll3D) await window.roll3D({ parent, N, k, durationMs: 1200 });
                        } catch (e) {
                            if (window.rollFallback) await window.rollFallback({ parent, N, k, durationMs: 1200 });
                        }
                        const end = performance.now();
                        const duration = Math.round(end - start);
                        const ok = duration <= 1200 ? 'OK' : 'SLOW';
                        document.getElementById('dev-output').textContent = `Anim duration: ${duration} ms (${ok})`;
                    });

                    forceFallbackBtn.addEventListener('click', async () => {
                        const parent = document.getElementById('dev-mount');
                        if (!parent) return;
                        parent.innerHTML = '';
                        const N = 10; const k = 'joker';
                        const start = performance.now();
                        if (window.rollFallback) await window.rollFallback({ parent, N, k, durationMs: 900 });
                        const end = performance.now();
                        const duration = Math.round(end - start);
                        document.getElementById('dev-output').textContent = `Fallback duration: ${duration} ms`;
                    });
                }
            }, 0); // Next tick
        },
        exit: () => {
            console.log('Exiting SETTINGS state');
        }
    };
}

// Register settings flow states
export function registerSettingsFlowStates() {
    register('SETTINGS', createSettingsStates());
}