// recipeBookFlow.js
// Recipe book flow controller for Dicey Drinks

import { register, transitionTo } from '../stateMachine.js';

// Create the recipe book flow states
function createRecipeBookStates() {
    // RECIPE_BOOK state
    return {
        enter: async () => {
            console.log('Entering RECIPE_BOOK state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';
            const cookbook = await window.getCookbook();
            let html = `
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                    <button id="recipe-back" class="secondary">Back</button>
                    <h2 style="margin:0;">Recipe Book</h2>
                </div>
                <div style="margin-bottom:10px; display:flex; gap:8px; align-items:center;">
                    <input type="text" id="search-recipe-book" placeholder="Search recipes..." aria-label="Search recipes" style="flex:2; min-width:66%;">
                    <select id="sort-recipe-book" aria-label="Sort recipes" style="flex:1; min-width:25%;">
                        <option value="date">Date</option>
                        <option value="name">Name</option>
                        <option value="rating">Rating</option>
                    </select>
                </div>
            `;

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

            // Add bottom export button similar to Inventory
            const exportBar = document.createElement('div');
            exportBar.style.position = 'fixed';
            exportBar.style.bottom = '16px';
            exportBar.style.left = '0';
            exportBar.style.right = '0';
            exportBar.style.textAlign = 'center';
            exportBar.innerHTML = '<button id="export-recipe-book" class="secondary" style="opacity:0.9;" aria-label="Export recipes">Export Recipes</button>';
            document.body.appendChild(exportBar);

            // Back to Home
            document.getElementById('recipe-back').addEventListener('click', () => transitionTo('IDLE'));

            // Export recipe book
            document.getElementById('export-recipe-book').addEventListener('click', () => window.exportCookbook(cookbook));

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
            // Clean up floating export bar if present
            document.querySelectorAll('#export-recipe-book').forEach(btn => {
                const bar = btn.parentElement;
                if (bar && bar.parentElement === document.body) bar.remove();
            });
        }
    };
}

// Register recipe book flow states
export function registerRecipeBookFlowStates() {
    register('RECIPE_BOOK', createRecipeBookStates());
}