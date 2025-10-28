// roll-utils-tests.js
// Unit tests for the roll utilities module

import { maybeJoker, weightedPick, softWeightedPick } from '../../js/state/rollUtils.js';

// Mock crypto functions
let mockRollValue = 1;
global.crypto = {
    getRandomValues: (array) => {
        for (let i = 0; i < array.length; i++) {
            array[i] = mockRollValue;
        }
        return array;
    }
};

// No need to set window.crypto; rng falls back to global.crypto in Node

// Test suite
export function runRollUtilsTests() {
    console.log('Running roll utilities tests...');
    
    // Test 1: maybeJoker - normal path
    mockRollValue = 1;
    let jokerCalled = false;
    let normalCalled = false;
    maybeJoker(20, () => { jokerCalled = true; }, () => { normalCalled = true; });
    console.log('Normal path called:', normalCalled);
    
    // Test 2: maybeJoker - joker path
    mockRollValue = 20;
    jokerCalled = false;
    normalCalled = false;
    maybeJoker(20, () => { jokerCalled = true; }, () => { normalCalled = true; });
    console.log('Joker path called:', jokerCalled);
    
    // Test 3: weightedPick
    const items = ['a', 'b', 'c'];
    const weights = [1, 2, 3];
    const result = weightedPick(items, weights);
    console.log('Weighted pick result:', result);
    
    // Test 4: softWeightedPick
    const testItems = [
        { id: 'item1', name: 'Item 1', weight: 1 },
        { id: 'item2', name: 'Item 2', weight: 2 },
        { id: 'item3', name: 'Item 3', weight: 3 }
    ];
    const lockedItems = [];
    const rules = { soft_rules: [] };
    const softResult = softWeightedPick(testItems, lockedItems, rules);
    console.log('Soft weighted pick result:', softResult);
    
    console.log('Roll utilities tests completed.');
}
