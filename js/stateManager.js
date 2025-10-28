// stateManager.js
// Compatibility layer for Dicey Drinks state management refactor

import { transitionTo, state, resetRecipeState, goHome } from './state/index.js';

// Export for backward compatibility
export { transitionTo, state, resetRecipeState, goHome };

// For now, we'll keep an empty states object for compatibility
// but all state logic has been moved to the new modular structure
export const states = {};