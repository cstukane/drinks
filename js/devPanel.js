// devPanel.js
// Developer panel for testing animations and other features

import { roll3D, rollFallback } from './anim.js';

export function devIsWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

function devHasThree() {
    return typeof window !== 'undefined' && !!window.THREE;
}

export function renderDevPanel() {
    const appContainer = document.getElementById('app-container');
    const containerId = 'dev-validations-panel';
    let panel = document.getElementById(containerId);
    if (!panel) {
        panel = document.createElement('div');
        panel.id = containerId;
        panel.style.margin = '16px auto';
        panel.style.maxWidth = '420px';
        panel.style.background = '#222';
        panel.style.border = '1px solid #00ffff';
        panel.style.borderRadius = '6px';
        panel.style.padding = '12px';
        const info = document.createElement('div');
        info.id = 'dev-info';
        const buttons = document.createElement('div');
        buttons.style.marginTop = '8px';
        const runBtn = document.createElement('button');
        runBtn.textContent = 'Run Anim Perf';
        runBtn.style.marginRight = '8px';
        const forceFallbackBtn = document.createElement('button');
        forceFallbackBtn.textContent = 'Force Fallback Roll';
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
        buttons.appendChild(runBtn);
        buttons.appendChild(forceFallbackBtn);
        panel.appendChild(info);
        panel.appendChild(buttons);
        panel.appendChild(output);
        panel.appendChild(mount);
        // Attach under app container
        appContainer.insertAdjacentElement('afterend', panel);

        // Populate environment info
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        info.innerHTML = `
            <div><strong>Dev Validations</strong></div>
            <div>WebGL: ${devIsWebGLSupported() ? 'supported' : 'not supported'}</div>
            <div>THREE: ${devHasThree() ? 'loaded' : 'missing'}</div>
            <div>Reduced motion: ${reduced ? 'true' : 'false'}</div>
        `;

        // Perf runner using 3D or fallback depending on support
        runBtn.addEventListener('click', async () => {
            const parent = document.getElementById('dev-mount');
            if (!parent) return;
            parent.innerHTML = '';
            const N = 12; const k = 7;
            const start = performance.now();
            try {
                await roll3D({ parent, N, k, durationMs: 1200 });
            } catch (e) {
                await rollFallback({ parent, N, k, durationMs: 1200 });
            }
            const end = performance.now();
            const duration = Math.round(end - start);
            const ok = duration <= 1200 ? 'OK' : 'SLOW';
            const path = window.__lastAnimPath || 'unknown';
            document.getElementById('dev-output').textContent = `Anim duration: ${duration} ms (${ok}) — path: ${path}`;
        });

        // Always use fallback path to validate number flip
        forceFallbackBtn.addEventListener('click', async () => {
            const parent = document.getElementById('dev-mount');
            if (!parent) return;
            parent.innerHTML = '';
            const N = 10; const k = 'joker';
            const start = performance.now();
            await rollFallback({ parent, N, k, durationMs: 900 });
            const end = performance.now();
            const duration = Math.round(end - start);
            document.getElementById('dev-output').textContent = `Fallback duration: ${duration} ms`;
        });
    } else {
        // Toggle visibility
        panel.style.display = (panel.style.display === 'none') ? '' : 'none';
    }
}
