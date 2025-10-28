// app.js
// Main application file that orchestrates all modules

import { roll3D, rollFallback, coinFlip } from './anim.js';
import { playRollSound, playConfirmSound, playJokerSound } from './sfx.js';
import { initDB, getData, updateItem, deleteItem, addItem, addRecipeToCookbook, getCookbook, replaceInventoryData, updateSubpoolItem, addSubpoolItem, addSubpool, addSecondaryPool, updateSecondaryItem } from './storage.js';
import { violatesHardBan, getSoftWeight } from './rules.js';
import { cryptoRoll, cryptoChoice, weightedCryptoChoice } from './rng.js';
import { generateRecipeDetails } from './measure.js';
import { generateSVG, downloadSVG, encodeShareCode, decodeShareCode } from './exporter.js';
import { registerAllStates, transitionTo, state, resetRecipeState, goHome } from './state/index.js';
import { initProgressDrawer, addProgressStep, updateProgressDrawer, toggleProgressDrawer, renderProgressDrawer } from './progressDrawer.js';
import { highlightAndSlideUp, showNoSolutionMessage, showShareCodeImportModal, displayPick } from './uiHelpers.js';
import { setData, rollForUniqueItems, findItem, displayAnimatedPick, displayDealersChoice } from './itemUtils.js';
import { remixRecipe, viewRecipe, rebuildRecipe, filterCookbook } from './recipeUtils.js';
import { exportCookbook, exportInventory, importCookbook, importInventory, importRecipes, importInventoryData } from './importExportUtils.js';
import { renderDevPanel, devIsWebGLSupported } from './devPanel.js';

// Register all modular states before any transitions
registerAllStates();

// Centralized state transition progress update
window.addEventListener('stateTransition', () => {
  try { if (typeof updateProgressDrawer === 'function') updateProgressDrawer(); } catch {}
});

let data = {};

// Make imported functions available globally for stateManager and other modules
window.roll3D = roll3D;
window.rollFallback = rollFallback;
window.coinFlip = coinFlip;
window.playRollSound = playRollSound;
window.playConfirmSound = playConfirmSound;
window.playJokerSound = playJokerSound;
window.initDB = initDB;
window.getData = getData;
window.updateItem = updateItem;
window.deleteItem = deleteItem;
window.addItem = addItem;
window.addRecipeToCookbook = addRecipeToCookbook;
window.getCookbook = getCookbook;
window.replaceInventoryData = replaceInventoryData;
window.updateSubpoolItem = updateSubpoolItem;
window.addSubpoolItem = addSubpoolItem;
window.addSubpool = addSubpool;
window.addSecondaryPool = addSecondaryPool;
window.updateSecondaryItem = updateSecondaryItem;
window.violatesHardBan = violatesHardBan;
window.getSoftWeight = getSoftWeight;
window.cryptoRoll = cryptoRoll;
window.cryptoChoice = cryptoChoice;
window.weightedCryptoChoice = weightedCryptoChoice;
window.generateRecipeDetails = generateRecipeDetails;
window.generateSVG = generateSVG;
window.downloadSVG = downloadSVG;
window.encodeShareCode = encodeShareCode;
window.decodeShareCode = decodeShareCode;
window.state = state;
window.transitionTo = transitionTo;
window.resetRecipeState = resetRecipeState;
window.goHome = goHome;
window.initProgressDrawer = initProgressDrawer;
window.addProgressStep = addProgressStep;
window.updateProgressDrawer = updateProgressDrawer;
window.toggleProgressDrawer = toggleProgressDrawer;
window.renderProgressDrawer = renderProgressDrawer;
window.highlightAndSlideUp = highlightAndSlideUp;
window.showNoSolutionMessage = showNoSolutionMessage;
window.showShareCodeImportModal = showShareCodeImportModal;
window.setData = setData;
window.rollForUniqueItems = rollForUniqueItems;
window.findItem = findItem;
window.displayPick = displayPick;
window.displayAnimatedPick = displayAnimatedPick;
window.displayDealersChoice = displayDealersChoice;
window.remixRecipe = remixRecipe;
window.viewRecipe = viewRecipe;
window.rebuildRecipe = rebuildRecipe;
window.filterCookbook = filterCookbook;
window.exportCookbook = exportCookbook;
window.exportInventory = exportInventory;
window.importCookbook = importCookbook;
window.importInventory = importInventory;
window.importRecipes = importRecipes;
window.importInventoryData = importInventoryData;
window.renderDevPanel = renderDevPanel;
window.devIsWebGLSupported = devIsWebGLSupported;

// Set the data object for itemUtils
setData(data);

// Expose goHome globally for the topbar button
window.goHome = goHome;

// Also bind the header Home icon without relying on inline handlers
const __homeBtn = document.getElementById('home-btn');
if (__homeBtn) {
    __homeBtn.addEventListener('click', goHome);
}

// Initial transition
transitionTo('LOADING');
