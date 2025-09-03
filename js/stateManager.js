// stateManager.js
// Handles application state and state transitions

import { initDB, getData } from './storage.js';
import { violatesHardBan, getSoftWeight } from './rules.js';
import { cryptoRoll, cryptoChoice, weightedCryptoChoice } from './rng.js';
import { generateRecipeDetails } from './measure.js';
import { generateSVG, downloadSVG, encodeShareCode, decodeShareCode } from './exporter.js';
import { rollForUniqueItems, findItem } from './itemUtils.js';
import { addProgressStep, initProgressDrawer } from './progressDrawer.js';
import { highlightAndSlideUp, showNoSolutionMessage } from './uiHelpers.js';
import { transitionTo as transitionToFunc } from './stateManager.js';

// Global application state
export const state = {
    currentState: 'LOADING',
    sessionActive: false,
    recipe: {
        spirits: [],
        spiritFamilies: [],
        mixers: [],
        additives: [],
        secondaries: []
    },
    rerollTokens: 1,
    selectedItems: []
};

let data = {};

// State definitions
export const states = {
    LOADING: {
        enter: async () => {
            console.log('Entering LOADING state');
            const appContainer = document.getElementById('app-container');
            appContainer.innerHTML = '<h2>Loading...</h2>';
            try {
                await initDB();
                data = await getData();
                window.setData(data); // Update data in itemUtils
                console.log('Data loaded', data);
                // Initialize progress drawer
                initProgressDrawer();
                // If URL includes a share code, decode it and offer to save to Recipe Book
                const hash = (window.location && window.location.hash) ? window.location.hash.slice(1) : '';
                if (hash) {
                    try {
                        const decoded = decodeShareCode(hash);
                        if (decoded) {
                            // Show modal to confirm save or view only
                            window.showShareCodeImportModal(decoded);
                        } else {
                            transitionTo('IDLE');
                        }
                    } catch (e) {
                        console.warn('Invalid share code in URL:', e);
                        transitionTo('IDLE');
                    }
                } else {
                    transitionTo('IDLE');
                }
            } catch (error) {
                console.error('Failed to initialize and load data:', error);
                const appContainer = document.getElementById('app-container');
                appContainer.innerHTML = '<h2>Error loading data. Please refresh.</h2>';
            }
        }
    },
    IDLE: {
        enter: () => {
            console.log('Entering IDLE state');
            const appContainer = document.getElementById('app-container');
            state.sessionActive = false;
            state.rerollTokens = 1;
            state.selectedItems = [];
            state.recipe = { 
                spirits: [], 
                spiritFamilies: [], 
                mixers: [], 
                additives: [],
                secondaries: []
            };
            appContainer.innerHTML = `
                <div class="home-container">
                    <button id="roll-cta">Roll</button>
                </div>
                <div class="bottom-nav">
                    <button id="inventory-nav">Inventory</button>
                    <button id="recipe-book-nav">Recipe Book</button>
                    <button id="settings-nav">Settings</button>
                </div>
            `;
            document.getElementById('roll-cta').addEventListener('click', () => transitionTo('METHOD', { type: 'drink' }));
            document.getElementById('inventory-nav').addEventListener('click', () => transitionTo('INVENTORY'));
            document.getElementById('recipe-book-nav').addEventListener('click', () => transitionTo('RECIPE_BOOK'));
            document.getElementById('settings-nav').addEventListener('click', () => {
                // Placeholder for settings
                window.renderDevPanel();
            });

            // Reset and hide progress drawer when returning to IDLE
            initProgressDrawer();
            const progressContainer = document.getElementById('progress-drawer-container');
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
        },
        exit: () => {
            console.log('Exiting IDLE state');
        }
    },
    METHOD: {
        enter: (context) => {
            console.log(`Entering METHOD state for: ${context.type}`);
            const appContainer = document.getElementById('app-container');
            state.sessionActive = true;
            state.recipe.type = context.type;
            
            // Add to progress
            initProgressDrawer();
            addProgressStep(`New ${context.type}`);

            let methods;
            if (context.type === 'drink') {
                methods = ['Shaken', 'Stirred', 'Blended', '🃏'];
            } else {
                methods = ['Shaken', 'Stirred', 'Layered', '🃏'];
            }

            appContainer.innerHTML = `
                <h2>Choose a Method</h2>
                <div class="options-container">
                    ${methods.map(m => `<div class="option" data-method="${m}">${m}</div>`).join('')}
                </div>
                <div class="roll-actions">
                    <button id="roll-method-btn">Roll</button>
                    <button id="next-method-btn" style="display:none;">Next</button>
                </div>
            `;

            const rollBtn = document.getElementById('roll-method-btn');
            const nextBtn = document.getElementById('next-method-btn');

            rollBtn.addEventListener('click', async () => {
                const methodsCore = (state.recipe.type === 'drink')
                    ? ['Shaken', 'Stirred', 'Blended']
                    : ['Shaken', 'Stirred', 'Layered'];

                const joker = cryptoRoll(20) === 20; // 1-in-20 Dealer's Choice
                let picked;
                if (joker) {
                    picked = '🃏';
                } else {
                    picked = cryptoChoice(methodsCore);
                }

                const optionsContainer = document.querySelector('.options-container');
                
                if (methodsCore.length <= 2) {
                    optionsContainer.innerHTML = ''; // Clear options
                    window.coinFlip({ parent: optionsContainer, onComplete: () => {
                        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                        const selectedOption = document.querySelector(`[data-method="${picked}"]`);
                        if (selectedOption) {
                            selectedOption.classList.add('highlighted');
                        }
                        state.recipe.method = picked;
                        rollBtn.style.display = 'none';
                        nextBtn.style.display = 'inline-block';
                    }});
                } else {
                    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                    const selectedOption = document.querySelector(`[data-method="${picked}"]`);
                    if (selectedOption) {
                        selectedOption.classList.add('highlighted');
                    }
    
                    state.recipe.method = picked;
                    rollBtn.style.display = 'none';
                    nextBtn.style.display = 'inline-block';
                }
            });

            nextBtn.addEventListener('click', () => {
                const selectedOption = document.querySelector('.option.highlighted');
                if (selectedOption) {
                    highlightAndSlideUp(selectedOption, () => {
                        addProgressStep(`Method: ${state.recipe.method}`);
                        if (state.recipe.type === 'drink') {
                            transitionTo('ROCKS_NEAT');
                        } else {
                            transitionTo('HOW_MANY');
                        }
                    });
                }
            });
        },
        exit: () => {
            console.log('Exiting METHOD state');
        }
    },
    ROCKS_NEAT: {
        enter: () => {
            console.log('Entering ROCKS_NEAT state');
            const appContainer = document.getElementById('app-container');
            const options = ['Rocks', 'Neat'];

            appContainer.innerHTML = `
                <h2>Style</h2>
                <div class="options-container">
                    ${options.map(o => `<div class="option" data-style="${o}">${o}</div>`).join('')}
                    <div class="coin-overlay" style="display:none;"></div>
                </div>
                <div class="roll-actions">
                    <button id="roll-style-btn">Roll</button>
                    <button id="next-style-btn" style="display:none;">Next</button>
                </div>
            `;

            const rollBtn = document.getElementById('roll-style-btn');
            const nextBtn = document.getElementById('next-style-btn');

            rollBtn.addEventListener('click', () => {
                const picked = cryptoChoice(options);
                const optionsContainer = document.querySelector('.options-container');
                const overlay = optionsContainer.querySelector('.coin-overlay');
                if (overlay) {
                    overlay.style.display = 'block';
                    window.coinFlip({ parent: overlay, onComplete: () => {
                        overlay.style.display = 'none';
                        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                        const selectedOption = document.querySelector(`[data-style="${picked}"]`);
                        if (selectedOption) {
                            selectedOption.classList.add('highlighted');
                        }
                        state.recipe.style = picked;
                        rollBtn.style.display = 'none';
                        nextBtn.style.display = 'inline-block';
                    }});
                } else {
                    // Fallback: no overlay container
                    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                    const selectedOption = document.querySelector(`[data-style="${picked}"]`);
                    if (selectedOption) selectedOption.classList.add('highlighted');
                    state.recipe.style = picked;
                    rollBtn.style.display = 'none';
                    nextBtn.style.display = 'inline-block';
                }
            });

            nextBtn.addEventListener('click', () => {
                const selectedOption = document.querySelector('.option.highlighted');
                if (selectedOption) {
                    highlightAndSlideUp(selectedOption, () => {
                        addProgressStep(`Style: ${state.recipe.style}`);
                        transitionTo('HOW_MANY');
                    });
                }
            });
        },
        exit: () => {
            console.log('Exiting ROCKS_NEAT state');
        }
    },
    HOW_MANY: {
        enter: () => {
            console.log('Entering HOW_MANY state');
            const appContainer = document.getElementById('app-container');
            appContainer.innerHTML = `
                <h2>How Many?</h2>
                <div class="options-container">
                    <div class="option" data-type="spirits">Spirits</div>
                    <div class="option" data-type="mixers">Mixers</div>
                    <div class="option" data-type="additives">Additives</div>
                </div>
                <div class="roll-actions">
                    <button id="roll-how-many-btn">Roll</button>
                    <button id="next-how-many-btn" style="display:none;">Next</button>
                </div>
            `;

            const rollBtn = document.getElementById('roll-how-many-btn');
            const nextBtn = document.getElementById('next-how-many-btn');

            rollBtn.addEventListener('click', () => {
                const numSpirits = cryptoRoll(3);
                const numMixers = cryptoRoll(4);
                const numAdditives = cryptoRoll(2);

                document.querySelector('[data-type="spirits"]').textContent = `${numSpirits} Spirits`;
                document.querySelector('[data-type="mixers"]').textContent = `${numMixers} Mixers`;
                document.querySelector('[data-type="additives"]').textContent = `${numAdditives} Additives`;

                state.recipe.numSpirits = numSpirits;
                state.recipe.numMixers = numMixers;
                state.recipe.numAdditives = numAdditives;

                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });

            nextBtn.addEventListener('click', () => {
                addProgressStep(`How Many: ${state.recipe.numSpirits} Spirits, ${state.recipe.numMixers} Mixers, ${state.recipe.numAdditives} Additives`);
                transitionTo('PICKS');
            });
        },
        exit: () => {
            console.log('Exiting HOW_MANY state');
        }
    },
    PICKS: {
        enter: () => {
            console.log('Entering PICKS state');
            // Initialize arrays if they don't exist
            if (!state.recipe.spiritFamilies) {
                state.recipe.spiritFamilies = [];
            }
            if (!state.recipe.secondaries) {
                state.recipe.secondaries = [];
            }
            
            // Check if we need to pick spirit families first
            if (state.recipe.spiritFamilies.length < state.recipe.numSpirits) {
                transitionTo('PICK_SPIRIT_FAMILY');
            } else if (state.recipe.spirits.length < state.recipe.numSpirits) {
                transitionTo('PICK_SPIRIT');
            } else if (state.recipe.mixers.length < state.recipe.numMixers) {
                transitionTo('PICK_MIXER');
            } else if (state.recipe.additives.length < state.recipe.numAdditives) {
                transitionTo('PICK_ADDITIVE');
            } else {
                // Check if we need to pick secondary items for mixers
                const mixersRequiringSecondary = state.recipe.mixers.filter(m => m.requires_secondary);
                const mixerSecondaries = state.recipe.secondaries.filter(s => s.parentType === 'mixer');
                if (mixersRequiringSecondary.length > mixerSecondaries.length) {
                    transitionTo('PICK_SECONDARY');
                    return;
                } 
                // Check if we need to pick secondary items for additives
                const additivesRequiringSecondary = state.recipe.additives.filter(a => a.requires_secondary);
                const additiveSecondaries = state.recipe.secondaries.filter(s => s.parentType === 'additive');
                if (additivesRequiringSecondary.length > additiveSecondaries.length) {
                    transitionTo('PICK_SECONDARY');
                    return;
                }
                transitionTo('RECIPE');
            }
        }
    },
    PICK_SPIRIT_FAMILY: {
        enter: async () => {
            console.log('Entering PICK_SPIRIT_FAMILY state');
            const appContainer = document.getElementById('app-container');
            const spiritFamilies = data.inventory.spirits.filter(spirit => spirit.type === 'family' && spirit.in_rotation);

            if (spiritFamilies.length === 0) {
                console.error('No spirit families available');
                return;
            }

            let rolledFamilies = [];

            appContainer.innerHTML = `
                <h2>Spirit Families</h2>
                <div class="options-container">
                    ${spiritFamilies.map(f => `<div class="option" data-name="${f.name}">${f.name}</div>`).join('')}
                </div>
                <div class="roll-actions">
                    <button id="roll-spirit-family-btn">Roll</button>
                    <button id="next-spirit-family-btn" style="display:none;">Next</button>
                </div>
            `;

            const rollBtn = document.getElementById('roll-spirit-family-btn');
            const nextBtn = document.getElementById('next-spirit-family-btn');

            rollBtn.addEventListener('click', async () => {
                rolledFamilies = await rollForUniqueItems('spirit_family', state.recipe.numSpirits, spiritFamilies);
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                rolledFamilies.forEach(f => {
                    const el = document.querySelector(`.option[data-name="${f.name}"]`);
                    if (el) el.classList.add('highlighted');
                });
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });

            nextBtn.addEventListener('click', () => {
                const selectedOptions = document.querySelectorAll('.option.highlighted');
                selectedOptions.forEach(option => highlightAndSlideUp(option, () => {}));
                setTimeout(() => {
                    state.recipe.spiritFamilies.push(...rolledFamilies);
                    addProgressStep(`${rolledFamilies.length} Spirit Families`);
                    transitionTo('PICKS');
                }, 500);
            });
        }
    },
    PICK_SPIRIT: {
        enter: async () => {
            console.log('Entering PICK_SPIRIT state');
            const appContainer = document.getElementById('app-container');
            let rolledSpirits = [];

            appContainer.innerHTML = `
                <h2>Spirits</h2>
                <div class="options-container" id="spirits-results">
                    <!-- Roll to reveal selected spirits -->
                </div>
                <div class="roll-actions">
                    <button id="roll-spirits-btn">Roll</button>
                    <button id="next-spirits-btn" style="display:none;">Next</button>
                </div>
            `;

            const rollBtn = document.getElementById('roll-spirits-btn');
            const nextBtn = document.getElementById('next-spirits-btn');
            const results = document.getElementById('spirits-results');

            rollBtn.addEventListener('click', async () => {
                rolledSpirits = [];
                for (const family of state.recipe.spiritFamilies) {
                    let subpoolItems = [];
                    if (family.subpool_id && data.subpools[family.subpool_id]) {
                        subpoolItems = data.subpools[family.subpool_id].filter(item => item.in_rotation);
                    }

                    if (subpoolItems.length === 0) {
                        rolledSpirits.push(family);
                        continue;
                    }

                    const availableItems = subpoolItems.filter(item => !violatesHardBan(item, state.selectedItems.concat(rolledSpirits), data.rules.hard_bans));
                    if (availableItems.length === 0) {
                        showNoSolutionMessage('No compatible spirits available in this category.');
                        return;
                    }

                    const weights = availableItems.map(item => getSoftWeight(item, state.selectedItems.concat(rolledSpirits), data.rules.soft_rules));
                    const spirit = weightedCryptoChoice(availableItems, weights);
                    rolledSpirits.push(spirit);
                }

                results.innerHTML = rolledSpirits.map(s => `<div class="option highlighted">${s.name}</div>`).join('');
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });

            nextBtn.addEventListener('click', () => {
                document.querySelectorAll('#spirits-results .option.highlighted').forEach(option => highlightAndSlideUp(option, () => {}));
                setTimeout(() => {
                    state.recipe.spirits.push(...rolledSpirits);
                    addProgressStep(`${rolledSpirits.length} Spirits`);
                    transitionTo('PICKS');
                }, 500);
            });
        }
    },
    PICK_MIXER: {
        enter: async () => {
            console.log('Entering PICK_MIXER state');
            const appContainer = document.getElementById('app-container');
            const availableMixers = data.inventory.mixers.filter(mixer => 
                mixer.in_rotation && !violatesHardBan(mixer, state.selectedItems, data.rules.hard_bans));
            
            if (availableMixers.length === 0) {
                showNoSolutionMessage('No compatible mixers available in this category.');
                return;
            }

            let rolledMixers = [];

            appContainer.innerHTML = `
                <h2>Mixers</h2>
                <div class="options-container">
                    ${availableMixers.map(m => `<div class="option" data-name="${m.name}">${m.name}</div>`).join('')}
                </div>
                <div class="roll-actions">
                    <button id="roll-mixers-btn">Roll</button>
                    <button id="next-mixers-btn" style="display:none;">Next</button>
                </div>
            `;

            const rollBtn = document.getElementById('roll-mixers-btn');
            const nextBtn = document.getElementById('next-mixers-btn');

            rollBtn.addEventListener('click', async () => {
                rolledMixers = await rollForUniqueItems('mixer', state.recipe.numMixers, availableMixers);
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                rolledMixers.forEach(m => {
                    const el = document.querySelector(`.option[data-name="${m.name}"]`);
                    if (el) el.classList.add('highlighted');
                });
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });

            nextBtn.addEventListener('click', () => {
                const selectedOptions = document.querySelectorAll('.option.highlighted');
                selectedOptions.forEach(option => highlightAndSlideUp(option, () => {}));
                setTimeout(() => {
                    state.recipe.mixers.push(...rolledMixers);
                    addProgressStep(`${rolledMixers.length} Mixers`);
                    transitionTo('PICKS');
                }, 500);
            });
        }
    },
    PICK_SECONDARY: {
        enter: () => {
            console.log('Entering PICK_SECONDARY state');
            const appContainer = document.getElementById('app-container');
            
            // Determine what type of parent item needs a secondary
            let parentItem = null;
            let parentType = null;
            
            // Check mixers first
            const mixersRequiringSecondary = state.recipe.mixers.filter(m => m.requires_secondary);
            const mixerSecondaries = state.recipe.secondaries.filter(s => s.parentType === 'mixer');
            
            if (mixersRequiringSecondary.length > mixerSecondaries.length) {
                // Find the last mixer that requires a secondary but doesn't have one yet
                for (let i = mixersRequiringSecondary.length - 1; i >= 0; i--) {
                    const mixer = mixersRequiringSecondary[i];
                    const hasSecondary = state.recipe.secondaries.some(s => s.parentId === mixer.id);
                    if (!hasSecondary) {
                        parentItem = mixer;
                        parentType = 'mixer';
                        break;
                    }
                }
            } else {
                // Check additives
                const additivesRequiringSecondary = state.recipe.additives.filter(a => a.requires_secondary);
                const additiveSecondaries = state.recipe.secondaries.filter(s => s.parentType === 'additive');
                
                if (additivesRequiringSecondary.length > additiveSecondaries.length) {
                    // Find the last additive that requires a secondary but doesn't have one yet
                    for (let i = additivesRequiringSecondary.length - 1; i >= 0; i--) {
                        const additive = additivesRequiringSecondary[i];
                        const hasSecondary = state.recipe.secondaries.some(s => s.parentId === additive.id);
                        if (!hasSecondary) {
                            parentItem = additive;
                            parentType = 'additive';
                            break;
                        }
                    }
                }
            }
            
            if (!parentItem || !parentType) {
                // This shouldn't happen, but just in case
                transitionTo('PICKS');
                return;
            }
            
            // Get items from the secondary pool
            let secondaryItems = [];
            if (data.secondary[parentItem.requires_secondary]) {
                secondaryItems = data.secondary[parentItem.requires_secondary].filter(item => item.in_rotation);
            }

            if (secondaryItems.length === 0) {
                // No secondary items available, continue to next pick
                transitionTo('PICKS');
                return;
            }

            // Apply hard bans and soft weights
            let availableItems = secondaryItems.filter(item => !violatesHardBan(item, state.selectedItems, data.rules.hard_bans));
            
            if (availableItems.length === 0) {
                // Handle no solution - revert one step
                console.log('No available secondary items after applying hard bans');
                showNoSolutionMessage('No compatible secondary items available in this category.');
                return;
            }

            // Store parent info in each available item for later reference
            availableItems = availableItems.map(item => ({
                ...item,
                parentId: parentItem.id,
                parentType: parentType
            }));

            if (cryptoRoll(20) === 20) {
                window.displayAnimatedPick({ name: '🃏' }, 'secondary', availableItems);
            } else {
                const weights = availableItems.map(item => getSoftWeight(item, state.selectedItems, data.rules.soft_rules));
                let secondary = weightedCryptoChoice(availableItems, weights);
                window.displayAnimatedPick(secondary, 'secondary', availableItems);
            }
        }
    },
    PICK_ADDITIVE: {
        enter: async () => {
            console.log('Entering PICK_ADDITIVE state');
            const appContainer = document.getElementById('app-container');
            const availableAdditives = data.inventory.additives.filter(additive => 
                additive.in_rotation && !violatesHardBan(additive, state.selectedItems, data.rules.hard_bans));
            
            if (availableAdditives.length === 0) {
                showNoSolutionMessage('No compatible additives available in this category.');
                return;
            }

            let rolledAdditives = [];

            appContainer.innerHTML = `
                <h2>Additives</h2>
                <div class="options-container">
                    ${availableAdditives.map(a => `<div class="option" data-name="${a.name}">${a.name}</div>`).join('')}
                </div>
                <div class="roll-actions">
                    <button id="roll-additives-btn">Roll</button>
                    <button id="next-additives-btn" style="display:none;">Next</button>
                </div>
            `;

            const rollBtn = document.getElementById('roll-additives-btn');
            const nextBtn = document.getElementById('next-additives-btn');

            rollBtn.addEventListener('click', async () => {
                rolledAdditives = await rollForUniqueItems('additive', state.recipe.numAdditives, availableAdditives);
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                rolledAdditives.forEach(a => {
                    const el = document.querySelector(`.option[data-name="${a.name}"]`);
                    if (el) el.classList.add('highlighted');
                });
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });

            nextBtn.addEventListener('click', () => {
                const selectedOptions = document.querySelectorAll('.option.highlighted');
                selectedOptions.forEach(option => highlightAndSlideUp(option, () => {}));
                setTimeout(() => {
                    state.recipe.additives.push(...rolledAdditives);
                    addProgressStep(`${rolledAdditives.length} Additives`);
                    transitionTo('PICKS');
                }, 500);
            });
        }
    },
    RECIPE: {
        enter: () => {
            console.log('Entering RECIPE state');
            const appContainer = document.getElementById('app-container');
            const recipeDetails = generateRecipeDetails(state.recipe);

            let html = '<h2>Your Recipe:</h2>';
            html += `<h3>${state.recipe.name || 'My Dicey Drink'}</h3>`;
            html += `<p>Method: ${state.recipe.method}</p>`;

            html += '<h4>Ingredients:</h4><ul>';
            recipeDetails.ingredientsWithVolumes.forEach(item => {
                html += `<li>${item.volume} ${item.name}</li>`;
            });
            html += '</ul>';

            html += '<h4>Instructions:</h4><ol>';
            recipeDetails.instructions.forEach(step => {
                html += `<li>${step}</li>`;
            });
            html += '</ol>';

            html += '<button id="export-svg-btn">Export SVG</button>';
            if (navigator.share) {
                html += '<button id="share-btn">Share Recipe</button>';
            }
            html += '<button id="new-drink-btn">New Drink</button>';

            html += `
                <hr>
                <h3>Rate and Save</h3>
                <form id="save-recipe-form">
                    <label>Rating (1-5): <input type="number" id="recipe-rating" min="1" max="5" value="5"></label><br>
                    <label>Notes: <textarea id="recipe-notes"></textarea></label><br>
                    <button type="submit">Save to Recipe Book</button>
                </form>
            `;

            appContainer.innerHTML = html;

            document.getElementById('export-svg-btn').addEventListener('click', () => {
                const svg = generateSVG(state.recipe, recipeDetails);
                downloadSVG(svg);
            });

            if (navigator.share) {
                document.getElementById('share-btn').addEventListener('click', async () => {
                    try {
                        const recipeName = state.recipe.name || 'My Dicey Drink';
                        const textHeader = `Check out this recipe for ${recipeName}!`;

                        const text = `${textHeader}

Ingredients:
${recipeDetails.ingredientsWithVolumes.map(i => `- ${i.volume} ${i.name}`).join('\n')}

Instructions:
${recipeDetails.instructions.map((step, i) => `${i+1}. ${step}`).join('\n')}
`;

                        await navigator.share({ title: recipeName, text, url: window.location.href });
                    } catch (error) {
                        console.log('Sharing failed:', error);
                        const svg = generateSVG(state.recipe, recipeDetails);
                        downloadSVG(svg);
                    }
                });
            }

            const shareCodeBtn = document.createElement('button');
            shareCodeBtn.id = 'share-code-btn';
            shareCodeBtn.textContent = 'Get Share Code';
            shareCodeBtn.style.marginLeft = '10px';
            const exportBtn = document.getElementById('export-svg-btn');
            if (exportBtn && exportBtn.parentNode) {
                exportBtn.insertAdjacentElement('afterend', shareCodeBtn);
            } else {
                appContainer.appendChild(shareCodeBtn);
            }

            document.getElementById('share-code-btn').addEventListener('click', () => {
                const shareCode = encodeShareCode(state.recipe);
                if (!shareCode) {
                    alert('Unable to generate share code.');
                    return;
                }
                const baseUrl = window.location.origin + window.location.pathname;
                const shareUrl = `${baseUrl}#${shareCode}`;
                (navigator.clipboard && navigator.clipboard.writeText ?
                    navigator.clipboard.writeText(shareUrl) : Promise.reject()
                ).then(() => {
                    alert('Shareable URL copied to clipboard!');
                }).catch(() => {
                    const textArea = document.createElement('textarea');
                    textArea.value = shareUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('Shareable URL copied to clipboard!');
                });
            });

            document.getElementById('new-drink-btn').addEventListener('click', () => {
                transitionTo('IDLE');
            });

            document.getElementById('save-recipe-form').addEventListener('submit', (e) => {
                e.preventDefault();
                state.recipe.rating = parseInt(document.getElementById('recipe-rating').value);
                state.recipe.notes = document.getElementById('recipe-notes').value;
                state.recipe.date = new Date().toISOString();
                window.addRecipeToCookbook(state.recipe);
                addProgressStep('Recipe Saved');
                transitionTo('RECIPE_BOOK');
            });
            
            // Add progress step for recipe completion
            addProgressStep('Recipe Complete');
        },
        exit: () => {
            console.log('Exiting RECIPE state');
        }
    },
    INVENTORY: {
        enter: () => {
            console.log('Entering INVENTORY state');
            const appContainer = document.getElementById('app-container');
            let html = '<h2>Inventory Management</h2>';
            html += '<button id="back-to-idle">Back</button>';
            
            // Add import/export buttons
            html += `<div style="margin: 10px 0;">
                <button id="export-inventory">Export Inventory</button>
                <button id="import-inventory">Import Inventory</button>
            </div>`;

            html += '<h3>Spirits</h3>';
            html += '<ul>';
            data.inventory.spirits.forEach(item => {
                html += `<li>${item.name} <button class="archive-btn" data-id="${item.id}">${item.in_rotation ? 'Archive' : 'Unarchive'}</button><button class="delete-btn" data-id="${item.id}">Delete</button></li>`;
            });
            html += '</ul>';

            html += '<h3>Mixers</h3>';
            html += '<ul>';
            data.inventory.mixers.forEach(item => {
                html += `<li>${item.name} <button class="archive-btn" data-id="${item.id}">${item.in_rotation ? 'Archive' : 'Unarchive'}</button><button class="delete-btn" data-id="${item.id}">Delete</button></li>`;
            });
            html += '</ul>';

            html += '<h3>Additives</h3>';
            html += '<ul>';
            data.inventory.additives.forEach(item => {
                html += `<li>${item.name} <button class="archive-btn" data-id="${item.id}">${item.in_rotation ? 'Archive' : 'Unarchive'}</button><button class="delete-btn" data-id="${item.id}">Delete</button></li>`;
            });
            html += '</ul>';

            html += `
                <h3>Add New Item</h3>
                <form id="add-item-form">
                    <label>Category: 
                        <select id="item-category">
                            <option value="spirits">Spirit</option>
                            <option value="mixers">Mixer</option>
                            <option value="additives">Additive</option>
                        </select>
                    </label><br>
                    <label>ID: <input type="text" id="item-id" required></label><br>
                    <label>Name: <input type="text" id="item-name" required></label><br>
                    <label>Traits: <input type="text" id="item-traits"></label><br>
                    <button type="submit">Add Item</button>
                </form>
            `;

            appContainer.innerHTML = html;

            document.getElementById('back-to-idle').addEventListener('click', () => transitionTo('IDLE'));
            
            // Add export inventory functionality
            document.getElementById('export-inventory').addEventListener('click', () => window.exportInventory());
            
            // Add import inventory functionality
            document.getElementById('import-inventory').addEventListener('click', () => window.importInventory());

            document.querySelectorAll('.archive-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const itemId = e.target.dataset.id;
                    const item = findItem(itemId);
                    if (item) {
                        item.in_rotation = !item.in_rotation;
                        await window.updateItem(item);
                        data = await getData(); // Refresh data
                        window.setData(data); // Update data in itemUtils
                        transitionTo('INVENTORY'); // Re-render
                    }
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const itemId = e.target.dataset.id;
                    await window.deleteItem(itemId);
                    data = await getData(); // Refresh data
                    window.setData(data); // Update data in itemUtils
                    transitionTo('INVENTORY'); // Re-render
                });
            });

            document.getElementById('add-item-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const category = document.getElementById('item-category').value;
                const id = document.getElementById('item-id').value;
                const name = document.getElementById('item-name').value;
                const traits = document.getElementById('item-traits').value.split(',').map(t => t.trim());
                const newItem = { id: `${category}.${id}`, name, traits, in_rotation: true };
                await window.addItem(newItem);
                data = await getData();
                window.setData(data); // Update data in itemUtils
                transitionTo('INVENTORY');
            });
        },
        exit: () => {
            console.log('Exiting INVENTORY state');
        }
    },
    RECIPE_BOOK: {
        enter: async () => {
            console.log('Entering RECIPE_BOOK state');
            const appContainer = document.getElementById('app-container');
            const cookbook = await window.getCookbook();
            let html = '<h2>Recipe Book</h2>';
            html += '<button id="back-to-idle">Back</button>';
            
            // Add import/export buttons
            html += `<div style="margin: 10px 0;">
                <button id="export-recipe-book">Export Recipe Book</button>
                <button id="import-recipe-book">Import Recipe Book</button>
                <button id="export-inventory">Export Inventory</button>
                <button id="import-inventory">Import Inventory</button>
            </div>`;
            
            // Add search/filter
            html += `<div style="margin: 10px 0;">
                <input type="text" id="search-recipe-book" placeholder="Search recipes..." style="width: 70%; margin-right: 10px;">
                <select id="sort-recipe-book">
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                    <option value="rating">Rating</option>
                </select>
            </div>`;

            if (cookbook.length === 0) {
                html += '<p>No saved recipes yet.</p>';
            } else {
                // Sort by date descending (newest first)
                const sortedCookbook = [...cookbook].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                
                html += '<div id="recipe-list">';
                html += '<ul>';
                sortedCookbook.forEach((recipe, index) => {
                    const recipeName = recipe.name || 'My Dicey Drink';
                    const rating = recipe.rating || 0;
                    const notes = recipe.notes || '';
                    const date = recipe.date ? new Date(recipe.date).toLocaleDateString() : 'Unknown date';
                    
                    html += `<li style="text-align: left; padding: 10px; margin: 5px 0; background: #333; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${recipeName}</strong>
                                <div>Rating: ${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</div>
                                <div style="font-size: 0.9em; color: #aaa;">${date}</div>
                                ${notes ? `<div style="font-style: italic; margin-top: 5px;">"${notes}"</div>` : ''}
                            </div>
                            <div>
                                <button class="remix-recipe" data-index="${index}" style="display: block; margin: 2px 0;">Remix</button>
                                <button class="view-recipe" data-index="${index}" style="display: block; margin: 2px 0;">View</button>
                            </div>
                        </div>
                    </li>`;
                });
                html += '</ul>';
                html += '</div>';
            }

            appContainer.innerHTML = html;

            document.getElementById('back-to-idle').addEventListener('click', () => transitionTo('IDLE'));
            
            // Add export functionality
            document.getElementById('export-recipe-book').addEventListener('click', () => window.exportCookbook(cookbook));
            
            // Add import functionality
            document.getElementById('import-recipe-book').addEventListener('click', () => window.importCookbook());
            
            // Add export inventory functionality
            document.getElementById('export-inventory').addEventListener('click', () => window.exportInventory());
            
            // Add import inventory functionality
            document.getElementById('import-inventory').addEventListener('click', () => window.importInventory());
            
            // Add search functionality
            document.getElementById('search-recipe-book').addEventListener('input', (e) => {
                window.filterCookbook(cookbook, e.target.value, document.getElementById('sort-recipe-book').value);
            });
            
            // Add sort functionality
            document.getElementById('sort-recipe-book').addEventListener('change', (e) => {
                window.filterCookbook(cookbook, document.getElementById('search-recipe-book').value, e.target.value);
            });
            
            // Add remix functionality
            document.querySelectorAll('.remix-recipe').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    window.remixRecipe(cookbook[index]);
                });
            });
            
            // Add view functionality
            document.querySelectorAll('.view-recipe').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    window.viewRecipe(cookbook[index]);
                });
            });
        },
        exit: () => {
            console.log('Exiting RECIPE_BOOK state');
        }
    }
};

// State transition function
export function transitionTo(newState, context = {}) {
    if (states[state.currentState] && states[state.currentState].exit) {
        states[state.currentState].exit();
    }
    state.currentState = newState;
    if (states[state.currentState] && states[state.currentState].enter) {
        states[state.currentState].enter(context);
    }
    window.updateProgressDrawer();
}

// Utility functions for state management
export function resetRecipeState() {
    state.sessionActive = false;
    state.rerollTokens = 1;
    state.selectedItems = [];
    state.recipe = {
        spirits: [],
        spiritFamilies: [],
        mixers: [],
        additives: [],
        secondaries: []
    };
}

// Expose a simple Home action for the topbar button
export function goHome() {
    transitionTo('IDLE');
}
