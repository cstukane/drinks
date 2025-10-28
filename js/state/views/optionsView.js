// optionsView.js
// Render helpers for options lists

import { highlightAndSlideUp } from '../../uiHelpers.js';

// Render options with highlighting and selection handling
export function renderOptions({ items, getKey, getLabel, onSelect }) {
    const container = document.createElement('div');
    container.className = 'options-container';
    
    const list = document.createElement('div');
    list.className = 'option-list';
    
    items.forEach((item, index) => {
        const option = document.createElement('div');
        option.className = 'option';
        option.dataset.key = getKey(item);
        option.textContent = `${index + 1}. ${getLabel(item)}`;
        option.addEventListener('click', () => {
            // Remove highlight from all options
            list.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
            // Highlight selected option
            option.classList.add('highlighted');
            // Call onSelect callback
            onSelect(item);
        });
        list.appendChild(option);
    });
    
    container.appendChild(list);
    return container;
}

// Apply highlight to a specific option
export function highlightOption(container, key) {
    const option = container.querySelector(`[data-key="${key}"]`);
    if (option) {
        option.classList.add('highlighted');
    }
}

// Remove highlight from all options
export function clearHighlights(container) {
    container.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
}

// Scroll highlighted option into view
export function scrollHighlightedIntoView(container) {
    const highlighted = container.querySelector('.option.highlighted');
    if (highlighted) {
        highlighted.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}