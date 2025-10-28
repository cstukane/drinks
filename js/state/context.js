// context.js
// Defines the state shape and reset helpers

import { transitionTo } from './stateMachine.js';

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