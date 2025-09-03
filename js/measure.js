
// measure.js
// Handles volume heuristics and instruction templates per method.

export function generateRecipeDetails(recipe) {
    const ingredientsWithVolumes = [];
    const instructions = [];

    // Helper function to check if an item has a specific trait
    function hasTrait(item, trait) {
        return item.traits && item.traits.includes(trait);
    }

    // Helper function to check if an item is a liqueur
    function isLiqueur(item) {
        return hasTrait(item, 'cream_liqueur') || 
               (item.name && (item.name.toLowerCase().includes('liqueur') || item.name.toLowerCase().includes('curacao')));
    }

    // Helper function to check if an item is a syrup
    function isSyrup(item) {
        return item.id && item.id.includes('syrup') ||
               (item.name && item.name.toLowerCase().includes('syrup'));
    }

    if (recipe.type === 'drink') {
        // Drink measurements
        let totalSpirit = 2.0;
        let totalLiqueur = 0.75;
        let totalSyrup = 0.5;
        let totalMixer = 3.0;

        // Categorize spirits
        const baseSpirits = recipe.spirits.filter(item => !isLiqueur(item));
        const liqueurs = recipe.spirits.filter(isLiqueur);
        
        // Assign volumes
        baseSpirits.forEach(item => {
            ingredientsWithVolumes.push({ ...item, volume: `${totalSpirit / baseSpirits.length} oz` });
        });
        
        liqueurs.forEach(item => {
            ingredientsWithVolumes.push({ ...item, volume: `${totalLiqueur / liqueurs.length} oz` });
        });

        // Categorize mixers
        const syrups = recipe.mixers.filter(isSyrup);
        const otherMixers = recipe.mixers.filter(item => !isSyrup(item));
        
        // Assign volumes
        syrups.forEach(item => {
            ingredientsWithVolumes.push({ ...item, volume: `${totalSyrup / syrups.length} oz` });
        });
        
        otherMixers.forEach(item => {
            ingredientsWithVolumes.push({ ...item, volume: `${totalMixer / otherMixers.length} oz` });
        });

        recipe.additives.forEach(item => {
            // Additives often don't have volumes (e.g. rim, smoke)
            ingredientsWithVolumes.push({ ...item, volume: 'to taste' });
        });

        // Instructions
        if (recipe.method === 'Shaken') {
            instructions.push('Add all ingredients to a shaker with ice.');
            instructions.push('Shake well for 10-12 seconds.');
            instructions.push('Strain into a chilled glass.');
        } else if (recipe.method === 'Stirred') {
            instructions.push('Add all ingredients to a mixing glass with ice.');
            instructions.push('Stir for 20-30 seconds.');
            instructions.push('Strain into a chilled glass.');
        } else if (recipe.method === 'Blended') {
            instructions.push('Add all ingredients to a blender with 1 cup of ice.');
            instructions.push('Blend until smooth.');
            instructions.push('Pour into a glass.');
        }

    } else { // Shot
        let totalBase = 1.5;
        recipe.spirits.forEach(item => {
            ingredientsWithVolumes.push({ ...item, volume: `${totalBase / recipe.spirits.length} oz` });
        });
        // ... other shot ingredients

        if (recipe.method === 'Layered') {
            instructions.push('Carefully layer ingredients in a shot glass in the following order:');
            // Order by density hints if available, otherwise use a heuristic
            const itemsToLayer = [...recipe.spirits];
            itemsToLayer.sort((a, b) => {
                // If both have density hints, sort by density (lighter first)
                if (a.density_hint !== undefined && b.density_hint !== undefined) {
                    return a.density_hint - b.density_hint;
                }
                // If only one has a density hint, it goes first
                if (a.density_hint !== undefined) return -1;
                if (b.density_hint !== undefined) return 1;
                // Default ordering
                return 0;
            });
            itemsToLayer.forEach(item => instructions.push(item.name));
        } else {
            instructions.push('Add all ingredients to a shaker with ice.');
            instructions.push('Shake and strain into a shot glass.');
        }
    }

    return { ingredientsWithVolumes, instructions };
}
