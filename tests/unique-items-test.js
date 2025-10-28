// Test for rollForUniqueItems function
// This test is designed to run with the existing node-test-runner.js

// Mock the necessary browser APIs
if (typeof global === 'undefined') {
    global = window;
}

// Mock browser APIs for Node.js environment
if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // Extend the existing mocks
    global.state = {
        selectedItems: []
    };
    
    global.data = {
        rules: {
            soft_rules: []
        }
    };
    
    // Mock the required functions
    global.getSoftWeight = function(item, selectedItems, softRules) {
        return 1; // Default weight
    };
    
    global.violatesHardBan = function(item, selectedItems, hardBans) {
        return false; // No violations by default
    };
}

// Test results tracking
let testResults = [];
let passedTests = 0;
let failedTests = 0;

function logTestResult(testName, passed, details = '') {
    testResults.push({ name: testName, passed, details });
    if (passed) {
        passedTests++;
        console.log(`✅ ${testName}: PASS ${details ? '- ' + details : ''}`);
    } else {
        failedTests++;
        console.log(`❌ ${testName}: FAIL ${details ? '- ' + details : ''}`);
    }
}

// Test rollForUniqueItems function
async function testRollForUniqueItems() {
    console.log('\n🧪 Testing rollForUniqueItems function...');
    
    try {
        // Import the function to test
        const itemUtilsModule = require('../js/itemUtils.js');
        
        // Test 1: Basic functionality with unique items
        const testItems = [
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
            { id: '3', name: 'Item 3' },
            { id: '4', name: 'Item 4' },
            { id: '5', name: 'Item 5' }
        ];
        
        // Test with 3 items to select
        const result1 = await itemUtilsModule.rollForUniqueItems('test', 3, testItems);
        console.log('Test 1 - Selected items:', result1.map(item => item.name || item.id));
        
        // Verify no duplicates (unless jokers)
        const nonJokerItems = result1.filter(item => !item.isJoker);
        const ids1 = nonJokerItems.map(item => item.id);
        const uniqueIds1 = [...new Set(ids1)];
        const noDuplicates1 = ids1.length === uniqueIds1.length;
        logTestResult('rollForUniqueItems - no duplicates', noDuplicates1, `Selected ${result1.length} items, ${nonJokerItems.length} non-jokers`);
        
        // Test 2: Requesting more items than available
        const result2 = await itemUtilsModule.rollForUniqueItems('test', 10, testItems);
        const validCount2 = result2.length <= testItems.length + 1; // +1 for possible joker
        logTestResult('rollForUniqueItems - respects available items', validCount2, `Requested 10, got ${result2.length} items`);
        
        // Test 3: Edge case with empty array
        const result3 = await itemUtilsModule.rollForUniqueItems('test', 3, []);
        const emptyResult3 = result3.length === 0;
        logTestResult('rollForUniqueItems - handles empty array', emptyResult3, `Empty array result: ${result3.length} items`);
        
        return true;
    } catch (error) {
        logTestResult('rollForUniqueItems tests', false, `Error: ${error.message}`);
        return false;
    }
}

// Add to the main test runner
async function runUniqueItemsTests() {
    const uniqueItemsPassed = await testRollForUniqueItems();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 UNIQUE ITEMS TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${passedTests + failedTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    
    if (failedTests === 0) {
        console.log('\n🎉 ALL UNIQUE ITEMS TESTS PASSED!');
        return true;
    } else {
        console.log('\n❌ SOME UNIQUE ITEMS TESTS FAILED');
        return false;
    }
}

// Export for use in the main test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runUniqueItemsTests };
}