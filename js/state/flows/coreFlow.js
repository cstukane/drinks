// coreFlow.js
// Core UI states (LOADING, IDLE) ported from original stateManager

import { register, transitionTo } from '../stateMachine.js';
import { state, resetRecipeState } from '../context.js';
import { initDB, getData } from '../../storage.js';

// Register core flow states
export function registerCoreFlowStates() {
  register('LOADING', createLoadingState());
  register('IDLE', createIdleState());
}

function createLoadingState() {
  return {
    enter: async () => {
      try {
        const appContainer = document.getElementById('app-container');
        if (appContainer) appContainer.innerHTML = '<h2>Loading...</h2>';
        const panel = document.getElementById('dev-validations-panel');
        if (panel) panel.style.display = 'none';

        await initDB();
        const data = await getData();
        // Update global data references used by item/utils flows
        if (window.setData) window.setData(data);

        // Initialize/refresh progress drawer via global helper if available
        if (window.initProgressDrawer) window.initProgressDrawer();

        // Handle share code in URL hash, if present
        const hash = (window.location && window.location.hash) ? window.location.hash.slice(1) : '';
        if (hash && window.decodeShareCode) {
          try {
            const decoded = window.decodeShareCode(hash);
            if (decoded && window.showShareCodeImportModal) {
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
        if (appContainer) appContainer.innerHTML = '<h2>Error loading data. Please refresh.</h2>';
      }
    }
  };
}

function createIdleState() {
  return {
    enter: () => {
      const appContainer = document.getElementById('app-container');
      const panel = document.getElementById('dev-validations-panel');
      if (panel) panel.style.display = 'none';

      // Reset session state
      state.sessionActive = false;
      state.rerollTokens = 1;
      state.selectedItems = [];
      resetRecipeState();

      if (appContainer) {
        appContainer.innerHTML = `
          <div class="home-container">
            <button id="roll-cta" aria-label="Start a new roll">Roll</button>
          </div>
          <div class="bottom-nav" role="navigation" aria-label="Home navigation">
            <button id="inventory-nav">Inventory</button>
            <button id="recipe-book-nav">Recipe Book</button>
            <button id="settings-nav">Settings</button>
          </div>
        `;

        const rollBtn = document.getElementById('roll-cta');
        const invBtn = document.getElementById('inventory-nav');
        const bookBtn = document.getElementById('recipe-book-nav');
        const settingsBtn = document.getElementById('settings-nav');

        if (rollBtn) rollBtn.addEventListener('click', () => transitionTo('DRINK_TYPE'));
        if (invBtn) invBtn.addEventListener('click', () => transitionTo('INVENTORY'));
        if (bookBtn) bookBtn.addEventListener('click', () => transitionTo('RECIPE_BOOK'));
        if (settingsBtn) settingsBtn.addEventListener('click', () => transitionTo('SETTINGS'));
      }

      // Reset and hide progress drawer when returning to IDLE (match original behavior)
      try {
        if (window.initProgressDrawer) window.initProgressDrawer();
        const progressContainer = document.getElementById('progress-drawer-container');
        if (progressContainer) progressContainer.style.display = 'none';
        if (window.progressDrawer) {
          // best-effort keep open state consistent for next session
          window.progressDrawer.isOpen = true;
        }
      } catch {}
    },
    exit: () => {
      // No-op for now
    }
  };
}

