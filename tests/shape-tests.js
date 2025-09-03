// N→Shape Mapping Tests
// These tests verify the correct mapping of N (number of candidates) to dice shapes

function runShapeMappingTests() {
    console.log('Running N→shape mapping tests...');
    
    // Mapping function from anim.js
    function mapNToShape(N) {
        if (N <= 4) return 'd4';
        if (N <= 7) return 'd6';
        if (N <= 9) return 'd8';
        if (N <= 11) return 'd10'; // Using d20 as fallback for d10
        if (N <= 16) return 'd12';
        return 'd20';
    }
    
    // Test cases
    console.log('Testing shape mapping...');
    const testCases = [
        { N: 1, expected: 'd4' },
        { N: 2, expected: 'd4' },
        { N: 3, expected: 'd4' },
        { N: 4, expected: 'd4' },
        { N: 5, expected: 'd6' },
        { N: 6, expected: 'd6' },
        { N: 7, expected: 'd6' },
        { N: 8, expected: 'd8' },
        { N: 9, expected: 'd8' },
        { N: 10, expected: 'd10' },
        { N: 11, expected: 'd10' },
        { N: 12, expected: 'd12' },
        { N: 16, expected: 'd12' },
        { N: 17, expected: 'd20' },
        { N: 20, expected: 'd20' },
        { N: 100, expected: 'd20' }
    ];
    
    let allPassed = true;
    testCases.forEach(test => {
        const result = mapNToShape(test.N);
        const passed = result === test.expected;
        console.log(`N=${test.N} → ${result} (${passed ? 'PASS' : 'FAIL'})`);
        if (!passed) allPassed = false;
    });
    
    console.log('N→shape mapping tests completed.', allPassed ? 'All passed.' : 'Some failed.');
}

// Run tests
runShapeMappingTests();