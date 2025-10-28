// drinkFlow.js
// Drink flow controller for Dicey Drinks

import { register, transitionTo } from '../stateMachine.js';
import { state } from '../context.js';
import { addProgressStep, initProgressDrawer } from '../../progressDrawer.js';
import { highlightAndSlideUp, showNoSolutionMessage } from '../../uiHelpers.js';
import { cryptoRoll, cryptoChoice, weightedCryptoChoice } from '../../rng.js';
import { violatesHardBan, getSoftWeight } from '../../rules.js';
import { displayDealersChoiceForBatch } from '../../itemUtils.js';
import { rollForUniqueItemsWithJoker, softWeightedPick } from '../rollUtils.js';
import { renderOptions, clearHighlights } from '../views/optionsView.js';
import { attachRollBar } from '../views/rollBar.js';
import { runCoinFlip } from '../views/common.js';

let data = {};

// Update data reference (called from app.js when data changes)
export function setData(newData) {
    data = newData;
}

// DRINK_TYPE state
function createDrinkTypeState() {
    return {
        enter: () => {
            console.log('Entering DRINK_TYPE state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';
            state.sessionActive = true;
            
            // Add to progress
            initProgressDrawer();
            addProgressStep('New Drink');
            
            appContainer.innerHTML = `
                <h2>Drink Type</h2>
                <div class="options-container">
                    <div class="option-list">
                        <div class="option" data-type="1">1. Drink</div>
                        <div class="option" data-type="2">2. Shot</div>
                        <div class="option" data-type="3">3. Dealer's Choice</div>
                    </div>
                </div>
                <div class="roll-actions">
                    <button id="roll-drink-type-btn" class="primary-roll-btn" aria-label="Roll drink type">Roll</button>
                    <button id="next-drink-type-btn" class="primary-roll-btn" style="display:none;" aria-label="Next: confirm drink type">Next</button>
                </div>
            `;
            
            const rollBtn = document.getElementById('roll-drink-type-btn');
            const nextBtn = document.getElementById('next-drink-type-btn');
            
            rollBtn.addEventListener('click', async () => {
                // 1-in-20 chance for Dealer's Choice
                const isJoker = cryptoRoll(20) === 20;
                if (isJoker) {
                    // Show Joker animation then dealer's choice modal to pick Drink vs Shot
                    const candidates = [
                        { id: 'type.drink', name: 'Drink', value: 'drink' },
                        { id: 'type.shot', name: 'Shot', value: 'shot' }
                    ];
                    try {
                        if (window.playJokerSound) window.playJokerSound();
                        const rollWrap = document.createElement('div');
                        rollWrap.className = 'roll-wrap';
                        const appContainer = document.getElementById('app-container');
                        appContainer.innerHTML = '<h2>Dealer\'s Choice!</h2>';
                        appContainer.appendChild(rollWrap);
                        if (window.roll3D) {
                            await window.roll3D({ parent: rollWrap, N: 2, k: 'joker', durationMs: 1200 });
                        }
                    } catch (e) {
                        // ignore animation errors and continue to modal
                        console.warn('Joker animation failed:', e);
                    }
                    displayDealersChoiceForBatch('type', candidates, (pick) => {
                        const chosen = pick?.value === 'shot' ? 2 : 1;
                        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                        const optEl = document.querySelector(`[data-type="${chosen}"]`);
                        if (optEl) optEl.classList.add('highlighted');
                        state.recipe.type = (pick?.value === 'shot') ? 'shot' : 'drink';
                        rollBtn.style.display = 'none';
                        nextBtn.style.display = 'inline-block';
                    });
                    return;
                }

                // Normal 1 or 2 roll
                const picked = cryptoRoll(2); // 1 or 2
                const pickedType = picked === 1 ? 'drink' : 'shot';

                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                const selectedOption = document.querySelector(`[data-type="${picked}"]`);
                if (selectedOption) {
                    selectedOption.classList.add('highlighted');
                }

                state.recipe.type = pickedType;
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });
            
            nextBtn.addEventListener('click', () => {
                const selectedOption = document.querySelector('.option.highlighted');
                if (selectedOption) {
                    highlightAndSlideUp(selectedOption, () => {
                        addProgressStep(`Type: ${state.recipe.type.charAt(0).toUpperCase() + state.recipe.type.slice(1)}`);
                        transitionTo('METHOD', { type: state.recipe.type });
                    });
                }
            });
        },
        exit: () => {
            console.log('Exiting DRINK_TYPE state');
        }
    };
}

// METHOD_SELECTION state
function createMethodSelectionState() {
    return {
        enter: () => {
            console.log('Entering METHOD_SELECTION state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';
            
            appContainer.innerHTML = `
                <h2>Choose a Method</h2>
                <p>Dealer's Choice - Select your preferred method:</p>
                <div class="options-container">
                    <button class="option" data-method="Shaken">Shaken</button>
                    <button class="option" data-method="Stirred">Stirred</button>
                    <button class="option" data-method="Blended">Blended</button>
                    <button class="option" data-method="Layered">Layered</button>
                </div>
                <div class="roll-actions">
                    <button id="next-method-selection-btn">Next</button>
                </div>
            `;
            
            document.querySelectorAll('.option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                    e.target.classList.add('highlighted');
                    state.recipe.method = e.target.dataset.method;
                });
            });
            
            document.getElementById('next-method-selection-btn').addEventListener('click', () => {
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
            console.log('Exiting METHOD_SELECTION state');
        }
    };
}

// METHOD state
function createMethodState() {
    return {
        enter: (context) => {
            console.log(`Entering METHOD state for: ${context.type}`);
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';
            state.recipe.type = context.type;
            
            // Don't add to progress here since we already did in DRINK_TYPE
            
            let methods;
            if (context.type === 'drink') {
                methods = ['Shaken', 'Stirred', 'Blended', '🃏'];
            } else {
                methods = ['Shaken', 'Stirred', 'Layered', '🃏'];
            }

            appContainer.innerHTML = `
                <h2>Choose a Method</h2>
                <div class="options-container">
                    ${methods.filter(m => ['Shaken','Stirred','Blended','Layered'].includes(m)).map(m => `<div class="option" data-method="${m}">${m}</div>`).join('')}
                </div>
                <div class="roll-actions">
                    <button id="roll-method-btn" class="primary-roll-btn" aria-label="Roll method">Roll</button>
                    <button id="next-method-btn" class="primary-roll-btn" style="display:none;" aria-label="Next: confirm method">Next</button>
                </div>
            `;

            const rollBtn = document.getElementById('roll-method-btn');
            const nextBtn = document.getElementById('next-method-btn');

            rollBtn.addEventListener('click', async () => {
                const methodsCore = (state.recipe.type === 'drink')
                    ? ['Shaken', 'Stirred', 'Blended']
                    : ['Shaken', 'Stirred', 'Layered'];

                const joker = cryptoRoll(20) === 20; // 1-in-20 Dealer's Choice
                if (joker) {
                    // Trigger manual method selection instead of auto-picking
                    transitionTo('METHOD_SELECTION');
                    return;
                }
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
    };
}

// ROCKS_NEAT state
function createRocksNeatState() {
    return {
        enter: () => {
            console.log('Entering ROCKS_NEAT state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';
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
                    runCoinFlip(overlay, () => {
                        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                        const selectedOption = document.querySelector(`[data-style="${picked}"]`);
                        if (selectedOption) selectedOption.classList.add('highlighted');
                        state.recipe.style = picked;
                        rollBtn.style.display = 'none';
                        nextBtn.style.display = 'inline-block';
                    });
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
    };
}

// METHOD state (refactored to use views/options + roll bar)
function createMethodState2() {
    return {
        enter: (context) => {
            console.log(`Entering METHOD state for: ${context.type}`);
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';
            state.recipe.type = context.type;

            const methodsCore = (state.recipe.type === 'drink')
                ? ['Shaken', 'Stirred', 'Blended']
                : ['Shaken', 'Stirred', 'Layered'];

            appContainer.innerHTML = '<h2>Choose a Method</h2>';
            const listContainer = renderOptions({
                items: methodsCore,
                getKey: (m) => m,
                getLabel: (m) => m,
                onSelect: (m) => { state.recipe.method = m; }
            });
            appContainer.appendChild(listContainer);

            const bar = attachRollBar({
                parent: appContainer,
                onRoll: () => {
                    const joker = cryptoRoll(20) === 20;
                    if (joker) {
                        transitionTo('METHOD_SELECTION');
                        return;
                    }
                    const picked = cryptoChoice(methodsCore);
                    clearHighlights(listContainer);
                    const el = listContainer.querySelector(`[data-key="${picked}"]`);
                    if (el) el.classList.add('highlighted');
                    state.recipe.method = picked;
                    bar.showNext();
                },
                onNext: () => {
                    const selectedOption = listContainer.querySelector('.option.highlighted');
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
                }
            });
        },
        exit: () => {
            console.log('Exiting METHOD state');
        }
    };
}

// HOW_MANY state
function createHowManyState() {
    return {
        enter: () => {
            console.log('Entering HOW_MANY state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';
            appContainer.innerHTML = `
                <h2>How Many?</h2>
                <div class="options-container">
                    <div class="option-list">
                        <div class="option" data-type="spirits">Spirits</div>
                        <div class="option" data-type="mixers">Mixers</div>
                        <div class="option" data-type="additives">Additives</div>
                    </div>
                </div>
                <div class="roll-actions">
                    <button id="roll-how-many-btn" class="primary-roll-btn" aria-label="Roll counts">Roll</button>
                    <button id="next-how-many-btn" class="primary-roll-btn" style="display:none;" aria-label="Next: confirm counts">Next</button>
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
                transitionTo('ROLL_SPIRITS');
            });
        },
        exit: () => {
            console.log('Exiting HOW_MANY state');
        }
    };
}

// Register all drink flow states
export function registerDrinkFlowStates() {
    register('DRINK_TYPE', createDrinkTypeState());
    register('METHOD_SELECTION', createMethodSelectionState());
    register('METHOD', createMethodState2());
    register('ROCKS_NEAT', createRocksNeatState());
    register('HOW_MANY', createHowManyState());
    register('ROLL_SPIRITS', createRollSpiritsState());
    register('ROLL_MIXERS', createRollMixersState());
    register('ROLL_ADDITIVES', createRollAdditivesState());
    register('PICK_SECONDARY', createPickSecondaryState());
    register('RECIPE', createRecipeState());
    register('PICKS', createPicksState());
    register('PICK_SPIRIT_FAMILY', createPickSpiritFamilyState());
    register('PICK_SPIRIT', createPickSpiritState());
    register('PICK_MIXER', createPickMixerState());
    register('PICK_ADDITIVE', createPickAdditiveState());
}

// ROLL_SPIRITS state (ported from backup)
function createRollSpiritsState() {
    return {
        enter: async () => {
            console.log('Entering ROLL_SPIRITS state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';
            const currData = window.getData ? await window.getData() : null;

            // Get all available spirits (exclude families; only in rotation)
            const allSpirits = ((currData && currData.inventory?.spirits) || []).filter(spirit => spirit.type !== 'family' && spirit.in_rotation);

            // Build options list
            let spiritList = '';
            allSpirits.forEach((spirit, index) => {
                spiritList += `<div class="option" data-id="${spirit.id}">${index + 1}. ${spirit.name}</div>`;
            });

            appContainer.innerHTML = `
                <h2>Select ${state.recipe.numSpirits} Spirit${state.recipe.numSpirits !== 1 ? 's' : ''}</h2>
                <div class="options-container">
                    <div class="option-list">${spiritList}</div>
                </div>
                <div class="roll-actions">
                    <button id="roll-spirits-btn" class="primary-roll-btn" aria-label="Roll spirits">Roll</button>
                    <button id="next-spirits-btn" class="primary-roll-btn" style="display:none;" aria-label="Next: confirm spirits">Next</button>
                </div>
            `;

            const rollBtn = document.getElementById('roll-spirits-btn');
            const nextBtn = document.getElementById('next-spirits-btn');
            const optionsContainer = document.querySelector('.options-container');

            let rolled = [];

            rollBtn.addEventListener('click', async () => {
                const res = await rollForUniqueItemsWithJoker(
                    'spirit',
                    state.recipe.numSpirits || 0,
                    allSpirits,
                    state.selectedItems || [],
                    (currData || {}).rules || {},
                    (allowed, commit) => {
                        displayDealersChoiceForBatch('spirit', allowed, (pick) => commit(pick));
                    }
                );
                if (res.noSolution) { showNoSolutionMessage('No compatible spirits available given prior selections.'); return; }
                rolled = res.selectedItems;
                optionsContainer.querySelectorAll('.option').forEach(el => el.classList.remove('highlighted'));
                rolled.forEach(s => {
                    const el = optionsContainer.querySelector(`.option[data-id="${s.id}"]`);
                    if (el) el.classList.add('highlighted');
                });
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });

            nextBtn.addEventListener('click', () => {
                const selectedOptions = document.querySelectorAll('.option.highlighted');
                selectedOptions.forEach(option => highlightAndSlideUp(option, () => {}));

                setTimeout(() => {
                    state.recipe.spirits = rolled.slice();
                    state.selectedItems.push(...rolled);
                    addProgressStep(`${rolled.length} Spirits`);
                    transitionTo('ROLL_MIXERS');
                }, 500);
            });
        },
        exit: () => {
            console.log('Exiting ROLL_SPIRITS state');
        }
    };
}

// ROLL_MIXERS state (ported from backup)
function createRollMixersState() {
    return {
        enter: async () => {
            console.log('Entering ROLL_MIXERS state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';

            const currData = window.getData ? await window.getData() : null;

            // Get all available mixers (in rotation)
            const allMixers = ((currData && currData.inventory?.mixers) || []).filter(m => m.in_rotation);

            // Build options list
            let mixerList = '';
            allMixers.forEach((mixer, index) => {
                mixerList += `<div class='option' data-id='${mixer.id}'>${index + 1}. ${mixer.name}</div>`;
            });

            appContainer.innerHTML = `
                <h2>Select ${state.recipe.numMixers} Mixer${state.recipe.numMixers !== 1 ? 's' : ''}</h2>
                <div class="options-container">
                    <div class="option-list">${mixerList}</div>
                </div>
                <div class="roll-actions">
                    <button id="roll-mixers-btn" class="primary-roll-btn" aria-label="Roll mixers">Roll</button>
                    <button id="next-mixers-btn" class="primary-roll-btn" style="display:none;" aria-label="Next: confirm mixers">Next</button>
                </div>
            `;

            const rollBtn = document.getElementById('roll-mixers-btn');
            const nextBtn = document.getElementById('next-mixers-btn');
            const optionsContainer = document.querySelector('.options-container');

            let rolledMixers = [];

            rollBtn.addEventListener('click', async () => {
                const res = await rollForUniqueItemsWithJoker(
                    'mixer',
                    state.recipe.numMixers || 0,
                    allMixers,
                    state.selectedItems || [],
                    (currData || {}).rules || {},
                    (allowed, commit) => {
                        displayDealersChoiceForBatch('mixer', allowed, (pick) => commit(pick));
                    }
                );
                if (res.noSolution) { showNoSolutionMessage('No compatible mixers available given prior selections.'); return; }
                rolledMixers = res.selectedItems;
                optionsContainer.querySelectorAll('.option').forEach(el => el.classList.remove('highlighted'));
                rolledMixers.forEach(m => {
                    const el = optionsContainer.querySelector(`.option[data-id="${m.id}"]`);
                    if (el) el.classList.add('highlighted');
                });
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });

            nextBtn.addEventListener('click', () => {
                const selectedOptions = document.querySelectorAll('.option.highlighted');
                selectedOptions.forEach(option => highlightAndSlideUp(option, () => {}));

                setTimeout(() => {
                    state.recipe.mixers = rolledMixers.slice();
                    state.selectedItems.push(...rolledMixers);
                    addProgressStep(`${rolledMixers.length} Mixers`);
                    transitionTo('ROLL_ADDITIVES');
                }, 500);
            });
        },
        exit: () => {
            console.log('Exiting ROLL_MIXERS state');
        }
    };
}

// ROLL_ADDITIVES state (ported from backup)
function createRollAdditivesState() {
    return {
        enter: async () => {
            console.log('Entering ROLL_ADDITIVES state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';

            const currData = window.getData ? await window.getData() : null;

            // Get all available additives (in rotation)
            const allAdditives = ((currData && currData.inventory?.additives) || []).filter(a => a.in_rotation);

            // Build options list
            let additiveList = '';
            allAdditives.forEach((a, index) => {
                additiveList += `<div class='option' data-id='${a.id}'>${index + 1}. ${a.name}</div>`;
            });

            appContainer.innerHTML = `
                <h2>Select ${state.recipe.numAdditives} Additive${state.recipe.numAdditives !== 1 ? 's' : ''}</h2>
                <div class="options-container">
                    <div class="option-list">${additiveList}</div>
                </div>
                <div class="roll-actions">
                    <button id="roll-additives-btn" class="primary-roll-btn" aria-label="Roll additives">Roll</button>
                    <button id="next-additives-btn" class="primary-roll-btn" style="display:none;" aria-label="Next: confirm additives">Next</button>
                </div>
            `;

            const rollBtn = document.getElementById('roll-additives-btn');
            const nextBtn = document.getElementById('next-additives-btn');
            const optionsContainer = document.querySelector('.options-container');

            let rolledAdds = [];

            rollBtn.addEventListener('click', async () => {
                const res = await rollForUniqueItemsWithJoker(
                    'additive',
                    state.recipe.numAdditives || 0,
                    allAdditives,
                    state.selectedItems || [],
                    (currData || {}).rules || {},
                    (allowed, commit) => {
                        displayDealersChoiceForBatch('additive', allowed, (pick) => commit(pick));
                    }
                );
                if (res.noSolution) { showNoSolutionMessage('No compatible additives available given prior selections.'); return; }
                rolledAdds = res.selectedItems;
                optionsContainer.querySelectorAll('.option').forEach(el => el.classList.remove('highlighted'));
                rolledAdds.forEach(a => {
                    const el = optionsContainer.querySelector(`.option[data-id="${a.id}"]`);
                    if (el) el.classList.add('highlighted');
                });
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });

            nextBtn.addEventListener('click', () => {
                const selectedOptions = document.querySelectorAll('.option.highlighted');
                selectedOptions.forEach(option => highlightAndSlideUp(option, () => {}));

                setTimeout(() => {
                    state.recipe.additives = rolledAdds.slice();
                    state.selectedItems.push(...rolledAdds);
                    addProgressStep(`${rolledAdds.length} Additives`);

                    // After additives, resolve secondary picks if required
                    const mixersReq = (state.recipe.mixers || []).filter(m => m.requires_secondary);
                    const mixersSec = (state.recipe.secondaries || []).filter(s => s.parentType === 'mixer');
                    const addsReq = (state.recipe.additives || []).filter(a => a.requires_secondary);
                    const addsSec = (state.recipe.secondaries || []).filter(s => s.parentType === 'additive');
                    if (mixersReq.length > mixersSec.length || addsReq.length > addsSec.length) {
                        transitionTo('PICK_SECONDARY');
                    } else {
                        transitionTo('RECIPE');
                    }
                }, 500);
            });
        },
        exit: () => {
            console.log('Exiting ROLL_ADDITIVES state');
        }
    };
}

// PICK_SECONDARY state (ported from backup)
function createPickSecondaryState() {
    return {
        enter: async () => {
            console.log('Entering PICK_SECONDARY state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';

            // Determine next parent needing a secondary
            let parentItem = null;
            let parentType = null;
            const mixersRequiringSecondary = (state.recipe.mixers || []).filter(m => m.requires_secondary);
            const mixerSecondaries = (state.recipe.secondaries || []).filter(s => s.parentType === 'mixer');
            if (mixersRequiringSecondary.length > mixerSecondaries.length) {
                for (let i = mixersRequiringSecondary.length - 1; i >= 0; i--) {
                    const mixer = mixersRequiringSecondary[i];
                    const hasSecondary = (state.recipe.secondaries || []).some(s => s.parentId === mixer.id);
                    if (!hasSecondary) { parentItem = mixer; parentType = 'mixer'; break; }
                }
            } else {
                const additivesRequiringSecondary = (state.recipe.additives || []).filter(a => a.requires_secondary);
                const additiveSecondaries = (state.recipe.secondaries || []).filter(s => s.parentType === 'additive');
                if (additivesRequiringSecondary.length > additiveSecondaries.length) {
                    for (let i = additivesRequiringSecondary.length - 1; i >= 0; i--) {
                        const additive = additivesRequiringSecondary[i];
                        const hasSecondary = (state.recipe.secondaries || []).some(s => s.parentId === additive.id);
                        if (!hasSecondary) { parentItem = additive; parentType = 'additive'; break; }
                    }
                }
            }

            if (!parentItem || !parentType) {
                transitionTo('RECIPE');
                return;
            }

            const currData = window.getData ? await window.getData() : null;
            let secondaryItems = [];
            const poolId = parentItem.requires_secondary;
            if (poolId && (currData?.secondary?.[poolId])) {
                secondaryItems = (currData.secondary[poolId] || []).filter(it => it.in_rotation);
            }
            if (secondaryItems.length === 0) {
                // No secondaries available; skip
                transitionTo('RECIPE');
                return;
            }

            // Apply hard bans and augment with parent info
            const allowed = secondaryItems
                .filter(item => !violatesHardBan(item, state.selectedItems || [], (currData?.rules?.hard_bans) || []))
                .map(item => ({ ...item, parentId: parentItem.id, parentType }));
            if (allowed.length === 0) {
                showNoSolutionMessage('No compatible secondary items available in this category.');
                return;
            }

            // Joker display path uses existing UI hook
            let picked;
            const joker = cryptoRoll(20) === 20;
            if (joker) {
                // Use displayAnimatedPick to show manual selection list
                window.displayAnimatedPick({ name: 'Dealer\'s Choice' }, 'secondary', allowed);
                // Fallback: pick first to continue flow if no manual choice handled
                picked = allowed[0];
            } else {
                picked = softWeightedPick(allowed, state.selectedItems || [], (currData || {}).rules || {});
                if (window.displayAnimatedPick) window.displayAnimatedPick(picked, 'secondary', allowed);
            }

            if (picked) {
                state.recipe.secondaries = state.recipe.secondaries || [];
                state.recipe.secondaries.push({ ...picked, parentId: picked.parentId, parentType: picked.parentType });
            }

            // If more secondaries needed, loop; else continue
            const moreMix = (state.recipe.mixers || []).filter(m => m.requires_secondary).length > (state.recipe.secondaries || []).filter(s => s.parentType === 'mixer').length;
            const moreAdd = (state.recipe.additives || []).filter(a => a.requires_secondary).length > (state.recipe.secondaries || []).filter(s => s.parentType === 'additive').length;
            if (moreMix || moreAdd) {
                transitionTo('PICK_SECONDARY');
            } else {
                transitionTo('RECIPE');
            }
        }
    };
}

// RECIPE state (summary + save)
function createRecipeState() {
    return {
        enter: () => {
            console.log('Entering RECIPE state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';

            const name = state.recipe.name || 'My Dicey Drink';
            const spirits = (state.recipe.spirits || []).map(s => s.name).join(', ');
            const mixers = (state.recipe.mixers || []).map(m => m.name).join(', ');
            const additives = (state.recipe.additives || []).map(a => a.name).join(', ');
            const method = state.recipe.method || '';
            const style = state.recipe.style || '';

            appContainer.innerHTML = `
                <h2>Recipe</h2>
                <div class="recipe-summary">
                    <div><strong>Type:</strong> ${state.recipe.type || ''}</div>
                    <div><strong>Method:</strong> ${method}</div>
                    ${style ? `<div><strong>Style:</strong> ${style}</div>` : ''}
                    <div><strong>Spirits:</strong> ${spirits || '—'}</div>
                    <div><strong>Mixers:</strong> ${mixers || '—'}</div>
                    <div><strong>Additives:</strong> ${additives || '—'}</div>
                </div>
                <form id="save-recipe-form" style="margin-top:12px;">
                    <label>Rating:
                        <select id="recipe-rating">
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                    </label>
                    <label style="display:block; margin-top:8px;">Notes:
                        <textarea id="recipe-notes" rows="3" style="width:100%;"></textarea>
                    </label>
                    <div style="margin-top:12px; display:flex; gap:8px;">
                        <button type="submit" class="primary">Save Recipe</button>
                        <button type="button" id="done-recipe">Done</button>
                    </div>
                </form>
            `;

            document.getElementById('save-recipe-form').addEventListener('submit', (e) => {
                e.preventDefault();
                state.recipe.rating = parseInt(document.getElementById('recipe-rating').value);
                state.recipe.notes = document.getElementById('recipe-notes').value;
                state.recipe.date = new Date().toISOString();
                if (window.addRecipeToCookbook) window.addRecipeToCookbook(state.recipe);
                addProgressStep('Recipe Saved');
                transitionTo('RECIPE_BOOK');
            });
            document.getElementById('done-recipe').addEventListener('click', () => {
                transitionTo('IDLE');
            });
            addProgressStep('Recipe Complete');
        },
        exit: () => { console.log('Exiting RECIPE state'); }
    };
}

// Decide next pick step based on recipe progress
function createPicksState() {
    return {
        enter: () => {
            const fams = state.recipe.spiritFamilies || (state.recipe.spiritFamilies = []);
            const spirits = state.recipe.spirits || (state.recipe.spirits = []);
            const mixers = state.recipe.mixers || (state.recipe.mixers = []);
            const adds = state.recipe.additives || (state.recipe.additives = []);
            const secs = state.recipe.secondaries || (state.recipe.secondaries = []);

            if ((fams.length || 0) < (state.recipe.numSpirits || 0)) {
                transitionTo('PICK_SPIRIT_FAMILY');
                return;
            }
            if ((spirits.length || 0) < (state.recipe.numSpirits || 0)) {
                transitionTo('PICK_SPIRIT');
                return;
            }
            if ((mixers.length || 0) < (state.recipe.numMixers || 0)) {
                transitionTo('PICK_MIXER');
                return;
            }
            if ((adds.length || 0) < (state.recipe.numAdditives || 0)) {
                transitionTo('PICK_ADDITIVE');
                return;
            }
            const needMixSec = (mixers.filter(m => m.requires_secondary).length) > (secs.filter(s => s.parentType === 'mixer').length);
            const needAddSec = (adds.filter(a => a.requires_secondary).length) > (secs.filter(s => s.parentType === 'additive').length);
            if (needMixSec || needAddSec) {
                transitionTo('PICK_SECONDARY');
                return;
            }
            transitionTo('RECIPE');
        }
    };
}

// Manual pick: Spirit Families
function createPickSpiritFamilyState() {
    return {
        enter: async () => {
            console.log('Entering PICK_SPIRIT_FAMILY state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';
            const currData = window.getData ? await window.getData() : null;
            const families = ((currData?.inventory?.spirits) || []).filter(s => s.type === 'family' && s.in_rotation);

            appContainer.innerHTML = `
                <h2>Spirit Families</h2>
                <div class="options-container" id="families-results"></div>
                <div class="roll-actions">
                    <button id="roll-spirit-family-btn">Roll</button>
                    <button id="next-spirit-family-btn" style="display:none;">Next</button>
                </div>
            `;
            const results = document.getElementById('families-results');
            const rollBtn = document.getElementById('roll-spirit-family-btn');
            const nextBtn = document.getElementById('next-spirit-family-btn');

            // Render list
            results.innerHTML = families.map(f => `<div class="option" data-id="${f.id}">${f.name}</div>`).join('');

            let pickedFamilies = [];
            rollBtn.addEventListener('click', () => {
                pickedFamilies = [];
                const pool = families.slice();
                const count = Math.min(state.recipe.numSpirits || 0, pool.length);
                while (pickedFamilies.length < count && pool.length) {
                    const idx = (cryptoRoll(pool.length) - 1);
                    pickedFamilies.push(pool[idx]);
                    pool.splice(idx, 1);
                }
                results.querySelectorAll('.option').forEach(opt => opt.classList.remove('highlighted'));
                pickedFamilies.forEach(f => {
                    const el = results.querySelector(`.option[data-id="${f.id}"]`);
                    if (el) el.classList.add('highlighted');
                });
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });

            nextBtn.addEventListener('click', () => {
                results.querySelectorAll('.option.highlighted').forEach(opt => highlightAndSlideUp(opt, () => {}));
                setTimeout(() => {
                    state.recipe.spiritFamilies = pickedFamilies.slice();
                    addProgressStep(`${pickedFamilies.length} Spirit Families`);
                    transitionTo('PICK_SPIRIT');
                }, 500);
            });
        }
    };
}

// Manual pick: Spirits within previously picked families
function createPickSpiritState() {
    return {
        enter: async () => {
            console.log('Entering PICK_SPIRIT state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';
            const currData = window.getData ? await window.getData() : null;
            const families = state.recipe.spiritFamilies || [];

            appContainer.innerHTML = `
                <h2>Spirits</h2>
                <div class="options-container" id="spirits-results"></div>
                <div class="roll-actions">
                    <button id="roll-spirits-btn">Roll</button>
                    <button id="next-spirits-btn" style="display:none;">Next</button>
                </div>
            `;
            const results = document.getElementById('spirits-results');
            const rollBtn = document.getElementById('roll-spirits-btn');
            const nextBtn = document.getElementById('next-spirits-btn');

            rollBtn.addEventListener('click', async () => {
                const rolled = [];
                for (const family of families) {
                    let subpoolItems = [];
                    if (family.subpool_id && (currData?.subpools?.[family.subpool_id])) {
                        subpoolItems = (currData.subpools[family.subpool_id] || []).filter(item => item.in_rotation);
                    }
                    if (!subpoolItems.length) { rolled.push(family); continue; }
                    const allowed = subpoolItems.filter(item => !violatesHardBan(item, (state.selectedItems || []).concat(rolled), (currData?.rules?.hard_bans) || []));
                    if (!allowed.length) { showNoSolutionMessage('No compatible spirits available in this category.'); return; }
                    const pick = softWeightedPick(allowed, (state.selectedItems || []).concat(rolled), (currData || {}).rules || {});
                    if (pick) rolled.push(pick);
                }
                results.innerHTML = rolled.map(s => `<div class="option highlighted">${s.name}</div>`).join('');
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });

            nextBtn.addEventListener('click', () => {
                results.querySelectorAll('.option.highlighted').forEach(opt => highlightAndSlideUp(opt, () => {}));
                setTimeout(() => {
                    state.recipe.spirits = state.recipe.spirits || [];
                    // Append or set based on flow
                    const newOnes = Array.from(results.querySelectorAll('.option.highlighted')).map(el => ({ name: el.textContent }));
                    // If we have actual objects from rolled array, prefer that; but in this simplified path, names suffice
                    if (newOnes.length) {
                        // Note: best-effort merge; in practice we used objects above
                        state.recipe.spirits = newOnes;
                    }
                    addProgressStep(`${state.recipe.spirits.length} Spirits`);
                    transitionTo('PICKS');
                }, 500);
            });
        }
    };
}

// Manual pick: Mixers (unique)
function createPickMixerState() {
    return {
        enter: async () => {
            console.log('Entering PICK_MIXER state');
            const appContainer = document.getElementById('app-container');
            const currData = window.getData ? await window.getData() : null;
            const available = ((currData?.inventory?.mixers) || []).filter(m => m.in_rotation && !violatesHardBan(m, state.selectedItems || [], (currData?.rules?.hard_bans) || []));
            if (!available.length) { showNoSolutionMessage('No compatible mixers available in this category.'); return; }

            appContainer.innerHTML = `
                <h2>Mixers</h2>
                <div class="options-container" id="mixers-list">${available.map(m => `<div class="option" data-id="${m.id}">${m.name}</div>`).join('')}</div>
                <div class="roll-actions">
                    <button id="roll-mixers-btn">Roll</button>
                    <button id="next-mixers-btn" style="display:none;">Next</button>
                </div>
            `;
            const rollBtn = document.getElementById('roll-mixers-btn');
            const nextBtn = document.getElementById('next-mixers-btn');
            const list = document.getElementById('mixers-list');
            let rolled = [];
            rollBtn.addEventListener('click', async () => {
                rolled = [];
                const res = await rollForUniqueItemsWithJoker('mixer', state.recipe.numMixers || 0, available, state.selectedItems || [], (currData || {}).rules || {}, (allowed, commit) => {
                    displayDealersChoiceForBatch('mixer', allowed, (pick) => commit(pick));
                });
                if (res.noSolution) { showNoSolutionMessage('No compatible mixers available given prior selections.'); return; }
                rolled = res.selectedItems;
                list.querySelectorAll('.option').forEach(el => el.classList.remove('highlighted'));
                rolled.forEach(m => {
                    const el = list.querySelector(`.option[data-id="${m.id}"]`);
                    if (el) el.classList.add('highlighted');
                });
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });
            nextBtn.addEventListener('click', () => {
                list.querySelectorAll('.option.highlighted').forEach(opt => highlightAndSlideUp(opt, () => {}));
                setTimeout(() => {
                    state.recipe.mixers = rolled.slice();
                    state.selectedItems.push(...rolled);
                    addProgressStep(`${rolled.length} Mixers`);
                    transitionTo('PICKS');
                }, 500);
            });
        }
    };
}

// Manual pick: Additives (unique)
function createPickAdditiveState() {
    return {
        enter: async () => {
            console.log('Entering PICK_ADDITIVE state');
            const appContainer = document.getElementById('app-container');
            const currData = window.getData ? await window.getData() : null;
            const available = ((currData?.inventory?.additives) || []).filter(a => a.in_rotation && !violatesHardBan(a, state.selectedItems || [], (currData?.rules?.hard_bans) || []));
            if (!available.length) { showNoSolutionMessage('No compatible additives available in this category.'); return; }

            appContainer.innerHTML = `
                <h2>Additives</h2>
                <div class="options-container" id="additives-list">${available.map(a => `<div class="option" data-id="${a.id}">${a.name}</div>`).join('')}</div>
                <div class="roll-actions">
                    <button id="roll-additives-btn">Roll</button>
                    <button id="next-additives-btn" style="display:none;">Next</button>
                </div>
            `;
            const rollBtn = document.getElementById('roll-additives-btn');
            const nextBtn = document.getElementById('next-additives-btn');
            const list = document.getElementById('additives-list');
            let rolled = [];
            rollBtn.addEventListener('click', async () => {
                rolled = [];
                const res = await rollForUniqueItemsWithJoker('additive', state.recipe.numAdditives || 0, available, state.selectedItems || [], (currData || {}).rules || {}, (allowed, commit) => {
                    displayDealersChoiceForBatch('additive', allowed, (pick) => commit(pick));
                });
                if (res.noSolution) { showNoSolutionMessage('No compatible additives available given prior selections.'); return; }
                rolled = res.selectedItems;
                list.querySelectorAll('.option').forEach(el => el.classList.remove('highlighted'));
                rolled.forEach(a => {
                    const el = list.querySelector(`.option[data-id="${a.id}"]`);
                    if (el) el.classList.add('highlighted');
                });
                rollBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
            });
            nextBtn.addEventListener('click', () => {
                list.querySelectorAll('.option.highlighted').forEach(opt => highlightAndSlideUp(opt, () => {}));
                setTimeout(() => {
                    state.recipe.additives = rolled.slice();
                    state.selectedItems.push(...rolled);
                    addProgressStep(`${rolled.length} Additives`);
                    transitionTo('PICKS');
                }, 500);
            });
        }
    };
}
