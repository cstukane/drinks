// progressDrawer.js
// Handles the progress drawer UI component

import { state } from './stateManager.js';

// Progress drawer state
export let progressDrawer = {
    isOpen: true,
    steps: [],
    currentStep: 0
};

// Progress drawer DOM element
export let progressDrawerElement = null;

// Progress drawer functions
export function initProgressDrawer() {
    progressDrawer.steps = [];
    progressDrawer.currentStep = 0;
    renderProgressDrawer();
}

export function addProgressStep(stepName) {
    progressDrawer.steps.push(stepName);
    progressDrawer.currentStep = progressDrawer.steps.length - 1;
    updateProgressDrawer();
}

export function updateProgressDrawer() {
    renderProgressDrawer();
}

export function toggleProgressDrawer() {
    progressDrawer.isOpen = !progressDrawer.isOpen;
    renderProgressDrawer();
}

export function renderProgressDrawer() {
    const container = document.getElementById('progress-drawer-container');
    if (!container) return;

    if (!state.sessionActive) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';

    // Create the drawer element if it doesn't exist
    if (!progressDrawerElement) {
        progressDrawerElement = document.createElement('div');
        progressDrawerElement.className = 'progress-drawer';
        container.appendChild(progressDrawerElement);
    }

    // Create header
    let header = progressDrawerElement.querySelector('.progress-drawer-header');
    if (!header) {
        header = document.createElement('div');
        header.className = 'progress-drawer-header';
        progressDrawerElement.appendChild(header);
        
        const title = document.createElement('span');
        title.textContent = 'Progress';
        header.appendChild(title);
        
        const toggleButton = document.createElement('button');
        toggleButton.className = 'progress-drawer-toggle';
        toggleButton.textContent = progressDrawer.isOpen ? '▼' : '▶';
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleProgressDrawer();
        });
        header.addEventListener('click', toggleProgressDrawer);
        header.appendChild(toggleButton);
    } else {
        // Update toggle button text
        const toggleButton = header.querySelector('.progress-drawer-toggle');
        if (toggleButton) {
            toggleButton.textContent = progressDrawer.isOpen ? '▼' : '▶';
        }
    }

    // Create or update content
    let content = progressDrawerElement.querySelector('.progress-drawer-content');
    if (!content) {
        content = document.createElement('div');
        content.className = 'progress-drawer-content';
        progressDrawerElement.appendChild(content);
    }

    // Update content based on steps
    if (progressDrawer.steps.length > 0) {
        let html = '<ul>';
        progressDrawer.steps.forEach((step, index) => {
            const isCurrent = index === progressDrawer.currentStep;
            html += `<li class="progress-step ${isCurrent ? 'current' : ''}">${step}</li>`;
        });
        html += '</ul>';
        content.innerHTML = html;
    } else {
        content.innerHTML = '<p>No steps yet</p>';
    }

    // Toggle open/closed class
    if (progressDrawer.isOpen) {
        progressDrawerElement.classList.add('open');
    } else {
        progressDrawerElement.classList.remove('open');
    }
}