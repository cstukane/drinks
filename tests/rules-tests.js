// Rule Evaluation Tests
import { violatesHardBan, getSoftWeight } from '../js/rules.js';

function runRuleTests() {
    console.log('Running rule evaluation tests...');
    
    // Test violatesHardBan
    console.log('Testing violatesHardBan...');
    const hardBans = [
        { a: 'trait:coffee', b: 'trait:wine' },
        { a: 'trait:acidic', b: 'trait:dairy_or_cream' }
    ];
    
    const selectedItems = [
        { id: 'spirits.wine', traits: ['wine', 'alcoholic'] },
        { id: 'mixers.juice', traits: ['fruit', 'sweet'] }
    ];
    
    // Test case 1: Coffee mixer should be banned with wine selected
    const coffeeMixer = { id: 'mixers.coffee', traits: ['coffee', 'caffeinated'] };
    const isBanned1 = violatesHardBan(coffeeMixer, selectedItems, hardBans);
    console.log('Coffee mixer banned with wine selected:', isBanned1); // Should be true
    
    // Test case 2: Juice mixer should not be banned with wine selected
    const juiceMixer = { id: 'mixers.juice', traits: ['fruit', 'sweet'] };
    const isBanned2 = violatesHardBan(juiceMixer, selectedItems, hardBans);
    console.log('Juice mixer banned with wine selected:', isBanned2); // Should be false
    
    // Test getSoftWeight
    console.log('Testing getSoftWeight...');
    const softRules = [
        { a: 'trait:cream_liqueur', b: 'trait:beer', weight_mult: 0.25 }, // Downweight
        { a: 'trait:citrus', b: 'trait:vodka', weight_mult: 2.0 } // Upweight (hypothetical)
    ];
    
    // Test case 1: Cream liqueur and beer should be downweighted
    const creamLiqueur = { id: 'spirits.liqueur', traits: ['cream_liqueur', 'dairy_or_cream'] };
    const beer = { id: 'mixers.beer', traits: ['beer'] };
    const weight1 = getSoftWeight(beer, [creamLiqueur], softRules);
    console.log('Cream liqueur + Beer weight:', weight1); // Should be 0.25
    
    // Test case 2: Neutral items should have weight 1.0
    const neutralMixer = { id: 'mixers.soda', traits: ['carbonated'] };
    const weight2 = getSoftWeight(neutralMixer, [creamLiqueur], softRules);
    console.log('Cream liqueur + Neutral weight:', weight2); // Should be 1.0
    
    console.log('Rule evaluation tests completed.');
}

// Run tests
runRuleTests();