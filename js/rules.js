// rules.js
// Handles hard-ban & soft-rule evaluation, and candidate filtering.

/**
 * Checks if a candidate item violates a hard ban with any of the already selected items.
 * @param {object} candidateItem - The item being considered.
 * @param {Array} selectedItems - The items already chosen.
 * @param {Array} hardBans - The list of hard ban rules.
 * @returns {boolean} - True if a violation is found, false otherwise.
 */
export function violatesHardBan(candidateItem, selectedItems, hardBans) {
    if (!hardBans || hardBans.length === 0) {
        return false;
    }

    for (const ban of hardBans) {
        for (const selected of selectedItems) {
            const itemA_traits = candidateItem.traits || [];
            const itemB_traits = selected.traits || [];

            const a_is_candidate = ban.a.startsWith('trait:') ? itemA_traits.includes(ban.a.substring(6)) : candidateItem.id === ban.a;
            const b_is_selected = ban.b.startsWith('trait:') ? itemB_traits.includes(ban.b.substring(6)) : selected.id === ban.b;

            const b_is_candidate = ban.b.startsWith('trait:') ? itemA_traits.includes(ban.b.substring(6)) : candidateItem.id === ban.b;
            const a_is_selected = ban.a.startsWith('trait:') ? itemB_traits.includes(ban.a.substring(6)) : selected.id === ban.a;

            if ((a_is_candidate && b_is_selected) || (b_is_candidate && a_is_selected)) {
                // Only log in browser environment
                if (typeof window !== 'undefined') {
                    console.log(`Hard ban violated: ${candidateItem.name} and ${selected.name}`);
                }
                return true;
            }
        }
    }

    return false;
}

/**
 * Calculates the weight multiplier for a candidate item based on soft rules.
 * @param {object} candidateItem - The item being considered.
 * @param {Array} selectedItems - The items already chosen.
 * @param {Array} softRules - The list of soft rules.
 * @returns {number} - The weight multiplier.
 */
export function getSoftWeight(candidateItem, selectedItems, softRules) {
    if (!softRules || softRules.length === 0) {
        return 1;
    }

    let weight = 1;

    for (const rule of softRules) {
        for (const selected of selectedItems) {
            const itemA_traits = candidateItem.traits || [];
            const itemB_traits = selected.traits || [];

            const a_is_candidate = rule.a.startsWith('trait:') ? itemA_traits.includes(rule.a.substring(6)) : candidateItem.id === rule.a;
            const b_is_selected = rule.b.startsWith('trait:') ? itemB_traits.includes(rule.b.substring(6)) : selected.id === rule.b;

            const b_is_candidate = rule.b.startsWith('trait:') ? itemA_traits.includes(rule.b.substring(6)) : candidateItem.id === rule.b;
            const a_is_selected = rule.a.startsWith('trait:') ? itemB_traits.includes(rule.a.substring(6)) : selected.id === rule.a;

            if ((a_is_candidate && b_is_selected) || (b_is_candidate && a_is_selected)) {
                weight *= rule.weight_mult;
            }
        }
    }

    return weight;
}

// Export functions for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        violatesHardBan,
        getSoftWeight
    };
}
