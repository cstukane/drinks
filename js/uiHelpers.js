// uiHelpers.js
// UI helper functions

import { playConfirmSound, playJokerSound, playRollSound } from './sfx.js';
import { state } from './stateManager.js';
import { transitionTo } from './stateManager.js';
import { addProgressStep } from './progressDrawer.js';
import { addRecipeToCookbook } from './storage.js';

export function highlightAndSlideUp(element, callback) {
    element.classList.add('slide-up');
    setTimeout(callback, 500); // Match animation duration
}

export function showNoSolutionMessage(message) {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <h2>No Valid Options</h2>
        <p>${message}</p>
        <p>This combination of ingredients violates compatibility rules.</p>
        <button id="back-btn">Go Back</button>
    `;
    
    document.getElementById('back-btn').addEventListener('click', () => {
        // Remove the last selection and go back to the previous pick state
        let removedItem = null;
        if (state.recipe.secondaries && state.recipe.secondaries.length > 0) {
            removedItem = state.recipe.secondaries.pop();
            const index = state.selectedItems.findIndex(i => i.id === removedItem.id);
            if (index > -1) state.selectedItems.splice(index, 1);
        } else if (state.recipe.additives.length > 0) {
            removedItem = state.recipe.additives.pop();
            const index = state.selectedItems.findIndex(i => i.id === removedItem.id);
            if (index > -1) state.selectedItems.splice(index, 1);
        } else if (state.recipe.mixers.length > 0) {
            removedItem = state.recipe.mixers.pop();
            const index = state.selectedItems.findIndex(i => i.id === removedItem.id);
            if (index > -1) state.selectedItems.splice(index, 1);
        } else if (state.recipe.spirits.length > 0) {
            removedItem = state.recipe.spirits.pop();
            const index = state.selectedItems.findIndex(i => i.id === removedItem.id);
            if (index > -1) state.selectedItems.splice(index, 1);
        } else if (state.recipe.spiritFamilies && state.recipe.spiritFamilies.length > 0) {
            removedItem = state.recipe.spiritFamilies.pop();
        }
        
        if (removedItem) {
            addProgressStep(`Reverted: Removed ${removedItem.name}`);
        }
        
        transitionTo('PICKS');
    });
}

export function displayPick(item, type) {
    const appContainer = document.getElementById('app-container');
    let html = `<h2>You rolled: ${item.name}</h2>`;
    if (state.rerollTokens > 0) {
        html += `<button id="reroll-btn">Reroll (${state.rerollTokens} left)</button>`;
    }
    html += '<button id="confirm-btn">Confirm</button>';
    appContainer.innerHTML = html;

    if (state.rerollTokens > 0) {
        document.getElementById('reroll-btn').addEventListener('click', () => {
            state.rerollTokens--;
            if (type === 'spirit_family') {
                transitionTo('PICK_SPIRIT_FAMILY');
            } else if (type === 'secondary') {
                transitionTo('PICK_SECONDARY');
            } else {
                transitionTo(`PICK_${type.toUpperCase()}`);
            }
        });
    }

    document.getElementById('confirm-btn').addEventListener('click', () => {
        playConfirmSound();
        if (type === 'spirit_family') {
            state.recipe.spiritFamilies.push(item);
            addProgressStep(`Spirit Family: ${item.name}`);
        } else if (type === 'secondary') {
            state.recipe.secondaries.push(item);
            state.selectedItems.push(item);
            addProgressStep(`Secondary: ${item.name}`);
        } else {
            state.recipe[type + 's'].push(item);
            state.selectedItems.push(item);
            addProgressStep(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${item.name}`);
        }
        transitionTo('PICKS');
    });
}

export function showShareCodeImportModal(recipe) {
    const recipeName = recipe.name || 'Shared Recipe';
    const appContainer = document.getElementById('app-container');
    
    let html = `
        <div id="share-code-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: #222; padding: 20px; border-radius: 8px; max-width: 500px; width: 80%;">
                <h2>Shared Recipe Import</h2>
                <p>You've received a shared recipe: <strong>${recipeName}</strong></p>
                <p>What would you like to do?</p>
                <div style="margin-top: 20px;">
                    <button id="save-to-recipe-book" style="margin-right: 10px;">Save to Recipe Book</button>
                    <button id="view-only" style="margin-right: 10px;">View Only</button>
                    <button id="cancel-import">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    appContainer.innerHTML = html;
    
    document.getElementById('save-to-recipe-book').addEventListener('click', () => {
        // Add to recipe book and go to recipe view
        recipe.date = new Date().toISOString();
        addRecipeToCookbook(recipe);
        state.recipe = recipe;
        document.getElementById('share-code-modal').remove();
        transitionTo('RECIPE');
    });
    
    document.getElementById('view-only').addEventListener('click', () => {
        // Just view the recipe without saving
        state.recipe = recipe;
        document.getElementById('share-code-modal').remove();
        transitionTo('RECIPE');
    });
    
    document.getElementById('cancel-import').addEventListener('click', () => {
        // Cancel and go to IDLE
        document.getElementById('share-code-modal').remove();
        transitionTo('IDLE');
    });
}