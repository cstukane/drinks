// index.js
// State registration index for Dicey Drinks

import { register } from './stateMachine.js';
import { registerDrinkFlowStates } from './flows/drinkFlow.js';
import { registerInventoryFlowStates } from './flows/inventoryFlow.js';
import { registerRecipeBookFlowStates } from './flows/recipeBookFlow.js';
import { registerSettingsFlowStates } from './flows/settingsFlow.js';
import { registerCoreFlowStates } from './flows/coreFlow.js';

// Import and register all states
export function registerAllStates() {
    registerCoreFlowStates();
    registerDrinkFlowStates();
    registerInventoryFlowStates();
    registerRecipeBookFlowStates();
    registerSettingsFlowStates();
}

// Re-export key functions for backward compatibility
export { transitionTo, getCurrentState } from './stateMachine.js';
export { state, resetRecipeState, goHome } from './context.js';
