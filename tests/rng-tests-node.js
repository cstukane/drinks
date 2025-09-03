// RNG Tests for Node.js
// This version can be run directly with Node.js

// Mock the browser crypto API for Node.js
if (typeof window === 'undefined' && typeof global !== 'undefined') {
    global.crypto = {
        getRandomValues: function(array) {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            return array;
        }
    };
}

// Import functions from rng.js
import { cryptoRoll, cryptoChoice, weightedCryptoChoice, getRandomFloat } from '../js/rng.js';

function runRNGTests() {
    console.log('Running RNG tests...');
    
    // Test cryptoRoll
    console.log('Testing cryptoRoll...');
    let rollResults = {};
    for (let i = 0; i < 1000; i++) {
        const result = cryptoRoll(20);
        rollResults[result] = (rollResults[result] || 0) + 1;
    }
    console.log('Roll distribution:', rollResults);
    
    // Test cryptoChoice
    console.log('Testing cryptoChoice...');
    const testArray = ['a', 'b', 'c', 'd', 'e'];
    let choiceResults = {};
    for (let i = 0; i < 1000; i++) {
        const result = cryptoChoice(testArray);
        choiceResults[result] = (choiceResults[result] || 0) + 1;
    }
    console.log('Choice distribution:', choiceResults);
    
    // Test weightedCryptoChoice
    console.log('Testing weightedCryptoChoice...');
    const items = ['low', 'medium', 'high'];
    const weights = [1, 5, 10]; // High should be chosen most often
    let weightedResults = {};
    for (let i = 0; i < 1000; i++) {
        const result = weightedCryptoChoice(items, weights);
        weightedResults[result] = (weightedResults[result] || 0) + 1;
    }
    console.log('Weighted choice distribution:', weightedResults);
    
    // Test getRandomFloat
    console.log('Testing getRandomFloat...');
    let floatResults = [];
    for (let i = 0; i < 100; i++) {
        const result = getRandomFloat();
        floatResults.push(result);
    }
    console.log('Float results sample (first 10):', floatResults.slice(0, 10));
    
    console.log('RNG tests completed.');
}

// Run tests
runRNGTests();