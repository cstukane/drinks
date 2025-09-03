// importExportUtils.js
// Import/export utility functions

import { addRecipeToCookbook, replaceInventoryData, getData } from './storage.js';
import { transitionTo } from './stateManager.js';

export function exportCookbook(cookbook) {
    // Add date to export
    const exportData = {
        version: 1,
        exported: new Date().toISOString(),
        recipes: cookbook
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dicey-drinks-recipe-book-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

export function exportInventory() {
    // Get current inventory data
    getData().then(data => {
        // Prepare export data
        const exportData = {
            version: 1,
            exported: new Date().toISOString(),
            inventory: data.inventory,
            subpools: data.subpools,
            secondary: data.secondary,
            rules: data.rules
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `dicey-drinks-inventory-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }).catch(error => {
        console.error('Error exporting inventory:', error);
        alert('Error exporting inventory: ' + error.message);
    });
}

export function importCookbook() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.version !== 1) {
                    alert('Unsupported file version');
                    return;
                }
                
                if (!data.recipes || !Array.isArray(data.recipes)) {
                    alert('Invalid recipe book file format');
                    return;
                }
                
                // Import recipes
                importRecipes(data.recipes);
            } catch (error) {
                alert('Error parsing recipe book file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

export function importInventory() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.version !== 1) {
                    alert('Unsupported file version');
                    return;
                }
                
                // Import inventory data
                importInventoryData(data);
            } catch (error) {
                alert('Error parsing inventory file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

export async function importRecipes(recipes) {
    try {
        for (const recipe of recipes) {
            // Ensure recipe has required fields
            if (!recipe.date) {
                recipe.date = new Date().toISOString();
            }
            await addRecipeToCookbook(recipe);
        }
        alert(`Successfully imported ${recipes.length} recipes!`);
        transitionTo('RECIPE_BOOK'); // Refresh the view
    } catch (error) {
        console.error('Error importing recipes:', error);
        alert('Error importing recipes: ' + error.message);
    }
}

export async function importInventoryData(data) {
    try {
        // Use the new replaceInventoryData function
        await replaceInventoryData(data);
        
        alert('Successfully imported inventory data!');
        transitionTo('INVENTORY'); // Refresh the view
    } catch (error) {
        console.error('Error importing inventory:', error);
        alert('Error importing inventory: ' + error.message);
    }
}