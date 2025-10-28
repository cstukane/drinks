// rollUtils.js
// Shared roll operations (joker, weighted pick) wrapping rng.js, rules.js

import { cryptoRoll, cryptoChoice, weightedCryptoChoice } from '../rng.js';
import { violatesHardBan, getSoftWeight } from '../rules.js';

// Handle joker (Dealer's Choice) with a callback for joker and normal paths
export function maybeJoker(chance, onJoker, onNormal) {
    const isJoker = cryptoRoll(chance) === chance;
    if (isJoker) {
        onJoker();
    } else {
        onNormal();
    }
    return isJoker;
}

// Weighted pick with weights array
export function weightedPick(items, weights) {
    return weightedCryptoChoice(items, weights);
}

// Soft weighted pick that applies soft rules to locked items
export function softWeightedPick(items, lockedItems, rules) {
    const weights = items.map(item => {
        const base = typeof item.weight === 'number' ? item.weight : 1;
        return base * getSoftWeight(item, lockedItems, rules?.soft_rules || []);
    });
    return weightedCryptoChoice(items, weights);
}

// Roll for unique items with joker handling
export async function rollForUniqueItemsWithJoker(itemType, count, availableItems, lockedItems, rules, onJokerPick) {
    let selectedItems = [];
    let rollCount = 0;

    while (rollCount < count) {
        // Build allowed set: not already picked this batch and not hard-banned vs locked picks
        const alreadyIds = new Set(selectedItems.map(item => item.id));
        const allowed = availableItems
            .filter(item => !alreadyIds.has(item.id))
            .filter(item => !violatesHardBan(item, lockedItems, rules?.hard_bans || []));

        if (allowed.length === 0) {
            // No solution available
            return { selectedItems, noSolution: true };
        }

        // Check for joker (1-in-20 chance)
        const joker = cryptoRoll(20) === 20;
        if (joker) {
            // Handle joker case with callback - return a promise to await the user's choice
            await new Promise((resolve) => {
                onJokerPick(allowed, (pick) => {
                    if (pick) {
                        selectedItems.push(pick);
                        rollCount++;
                    }
                    resolve();
                });
            });
        } else {
            // Normal weighted pick
            const pick = softWeightedPick(allowed, lockedItems, rules);
            selectedItems.push(pick);
            rollCount++;
        }
    }

    return { selectedItems, noSolution: false };
}