// recipeUtils.js
// Recipe-related utility functions

import { transitionTo } from './stateManager.js';
import { state } from './stateManager.js';

export function remixRecipe(recipe) {
    // Create a new recipe based on the original with small perturbations
    const remixedRecipe = {
        ...recipe,
        // Clear any existing ID/date so it gets a new one when saved
        id: undefined,
        date: undefined,
        // Add a note that this is a remix
        name: `${recipe.name || 'My Dicey Drink'} (Remix)`,
        // For a basic implementation, we'll just start a new build with the same parameters
        // A more advanced implementation would use the seed/roll trace with perturbations
    };
    
    // Set the state to start a new build with the same parameters
    state.recipe = {
        type: recipe.type,
        method: recipe.method,
        style: recipe.style,
        numSpirits: recipe.spirits ? recipe.spirits.length : 1,
        numMixers: recipe.mixers ? recipe.mixers.length : 0,
        numAdditives: recipe.additives ? recipe.additives.length : 0,
        spirits: [],
        spiritFamilies: [],
        mixers: [],
        additives: [],
        secondaries: []
    };
    
    // Transition to the appropriate state to start building
    if (state.recipe.type === 'drink') {
        transitionTo('ROCKS_NEAT');
    } else {
        transitionTo('HOW_MANY');
    }
}

export function viewRecipe(recipe) {
    // Show the recipe details
    const recipeName = recipe.name || 'My Dicey Drink';
    const appContainer = document.getElementById('app-container');
    let html = `<h2>${recipeName}</h2>`;
    html += `<p><strong>Method:</strong> ${recipe.method || 'Unknown'}</p>`;
    
    if (recipe.style) {
        html += `<p><strong>Style:</strong> ${recipe.style}</p>`;
    }
    
    html += `<p><strong>Rating:</strong> ${'★'.repeat(recipe.rating || 0)}${'☆'.repeat(5 - (recipe.rating || 0))}</p>`;
    
    if (recipe.notes) {
        html += `<p><strong>Notes:</strong> ${recipe.notes}</p>`;
    }
    
    if (recipe.date) {
        html += `<p><strong>Date:</strong> ${new Date(recipe.date).toLocaleDateString()}</p>`;
    }
    
    html += '<h3>Ingredients:</h3><ul>';
    // Show actual ingredients
    if (recipe.spirits) {
        recipe.spirits.forEach(spirit => {
            html += `<li>${spirit.name}</li>`;
        });
    }
    if (recipe.mixers) {
        recipe.mixers.forEach(mixer => {
            html += `<li>${mixer.name}</li>`;
        });
    }
    if (recipe.additives) {
        recipe.additives.forEach(additive => {
            html += `<li>${additive.name}</li>`;
        });
    }
    html += '</ul>';
    
    html += '<div style="margin-top: 20px;">';
    html += '<button id="back-to-recipe-book">Back to Recipe Book</button>';
    html += '<button id="rebuild-recipe" style="margin-left: 10px;">Rebuild Recipe</button>';
    html += '</div>';
    
    appContainer.innerHTML = html;
    
    document.getElementById('back-to-recipe-book').addEventListener('click', () => transitionTo('RECIPE_BOOK'));
    document.getElementById('rebuild-recipe').addEventListener('click', () => rebuildRecipe(recipe));
}

export function rebuildRecipe(recipe) {
    // Set the state to the saved recipe
    state.recipe = { ...recipe };
    
    // Transition to the RECIPE state to view/edit/export
    transitionTo('RECIPE');
}

export function filterCookbook(cookbook, searchTerm, sortBy) {
    let filtered = [...cookbook];

    // Build a lowercase search string containing name, notes, ingredients, and family/category tokens
    const buildSearchText = (recipe) => {
        const parts = [];
        const lower = (s) => (s || '').toString().toLowerCase();
        const pushName = (obj) => { if (obj && obj.name) parts.push(lower(obj.name)); };
        const familyFromSpiritId = (id) => {
            if (!id || typeof id !== 'string') return '';
            // spirit ids look like "whiskey.jim_beam" -> family key = whiskey -> title-case Whiskey
            const key = id.split('.')[0] || '';
            if (!key) return '';
            return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        };

        parts.push(lower(recipe.name || 'My Dicey Drink'));
        parts.push(lower(recipe.notes || ''));
        parts.push(lower(recipe.method || ''));
        parts.push(lower(recipe.style || ''));

        (recipe.spirits || []).forEach(s => {
            pushName(s);
            const fam = familyFromSpiritId(s.id);
            if (fam) parts.push(lower(fam));
        });
        (recipe.mixers || []).forEach(pushName);
        (recipe.additives || []).forEach(pushName);
        (recipe.secondaries || []).forEach(pushName);

        return parts.join(' ');
    };

    // Apply search filter (name, ingredients, families/categories, notes, method/style)
    if (searchTerm) {
        const q = (searchTerm || '').toLowerCase();
        filtered = filtered.filter(recipe => buildSearchText(recipe).includes(q));
    }

    // Apply sorting
    switch (sortBy) {
    case 'name':
        filtered.sort((a, b) => (a.name || 'My Dicey Drink').localeCompare(b.name || 'My Dicey Drink'));
        break;
    case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    case 'date':
    default:
        filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        break;
    }
    
    // Update the recipe list
    const listContainer = document.getElementById('recipe-list');
    if (listContainer) {
        let html = '<ul>';
        filtered.forEach((recipe, index) => {
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
        
        listContainer.innerHTML = html;
        
        // Reattach event listeners
        document.querySelectorAll('.remix-recipe').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                // We need to call the function directly to avoid circular dependency
                window.remixRecipe(filtered[index]);
            });
        });
        
        document.querySelectorAll('.view-recipe').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                // We need to call the function directly to avoid circular dependency
                window.viewRecipe(filtered[index]);
            });
        });
    }
}
