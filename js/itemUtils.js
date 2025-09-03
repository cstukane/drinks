// itemUtils.js
// Item-related utility functions

import { cryptoRoll, weightedCryptoChoice } from './rng.js';
import { getSoftWeight, violatesHardBan } from './rules.js';
import { state } from './stateManager.js';
import { playRollSound, playJokerSound, playConfirmSound } from './sfx.js';
import { transitionTo } from './stateManager.js';
import { addProgressStep } from './progressDrawer.js';
import { displayPick } from './uiHelpers.js';

let data; // This will be set by the main app

// Set the data object (to be called by main app)
export function setData(newData) {
    data = newData;
}

export async function rollForUniqueItems(category, numToRoll, availableItems) {
    const rolledItems = [];
    let remainingItems = [...availableItems];

    for (let i = 0; i < numToRoll; i++) {
        if (cryptoRoll(20) === 20) { // Joker
            rolledItems.push({ name: '🃏', isJoker: true });
            continue;
        }

        if (remainingItems.length === 0) break;

        const weights = remainingItems.map(item => getSoftWeight(item, state.selectedItems.concat(rolledItems), data.rules.soft_rules));
        const selectedItem = weightedCryptoChoice(remainingItems, weights);
        
        rolledItems.push(selectedItem);
        remainingItems = remainingItems.filter(item => item.id !== selectedItem.id);
    }

    return rolledItems;
}

export function findItem(itemId) {
    const category = itemId.split('.')[0] + 's';
    return data.inventory[category].find(item => item.id === itemId);
}

export async function displayAnimatedPick(item, type, candidates) {
    // Play roll sound
    if (item.name === '🃏') {
        playJokerSound();
    } else {
        playRollSound();
    }
    
    const appContainer = document.getElementById('app-container');
    
    // Create a wrapper for the animation
    const rollWrap = document.createElement('div');
    rollWrap.className = 'roll-wrap';
    
    // The original code used 'k' before its 'let' declaration, causing a parse-time error.
    let k;
    // Use the same joker emoji ('🃏') as used elsewhere in the app for consistency.
    const isJoker = (item && item.name === '🃏'); 
    
    if (isJoker) {
        k = 'joker'; // Use sentinel value for joker animation
    } else {
        k = candidates.findIndex(candidate => candidate.id === item.id) + 1;
        if (k === 0) k = 1; // Fallback to 1 if not found
    }
    
    const N = candidates.length || 1;
    
    // Show the animation
    if (isJoker) {
        // For joker, directly show the joker symbol
        appContainer.innerHTML = '<h2>Dealer\'s Choice!</h2>';
        appContainer.appendChild(rollWrap);
        
        try {
            // Perform the 3D roll animation with joker sentinel
            await window.roll3D({ 
                parent: rollWrap, 
                N: N, 
                k: k, // This will be 'joker'
                durationMs: 1200
            });
            
            // Show the manual selection UI after animation
            displayDealersChoice(type, candidates);
        } catch (error) {
            console.error('Animation error, falling back to simple display:', error);
            // Fallback to simple display
            displayDealersChoice(type, candidates);
        }
    } else {
        appContainer.innerHTML = '<h2>Rolling...</h2>';
        appContainer.appendChild(rollWrap);
        
        try {
            // Perform the 3D roll animation
            await window.roll3D({ 
                parent: rollWrap, 
                N: N, 
                k: k,
                durationMs: 1200
            });
            
            // After animation, show the result
            setTimeout(() => {
                appContainer.innerHTML = `
                    <h2>You rolled: ${item.name}</h2>
                    ${state.rerollTokens > 0 ? `<button id="reroll-btn">Reroll (${state.rerollTokens} left)</button>` : ''}
                    <button id="confirm-btn">Confirm</button>
                `;
                
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
            }, 300);
        } catch (error) {
            console.error('Animation error, falling back to simple display:', error);
            // Fallback to simple display
            displayPick(item, type);
        }
    }
}

export function displayDealersChoice(type, candidates) {
    // Play joker sound when showing dealer's choice
    playJokerSound();
    
    const appContainer = document.getElementById('app-container');
    let html = `<h2>Dealer's Choice!</h2><p>Select your ${type}:</p>`;
    candidates.forEach(item => {
        html += `<button class="choice-btn" data-id="${item.id}" data-type="${type}">${item.name}</button>`;
    });
    appContainer.innerHTML = html;

    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            const type = e.target.dataset.type;
            const item = candidates.find(c => c.id === itemId);
            
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
    });
}