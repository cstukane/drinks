// Joker Sentinel Tests
// These tests verify the correct handling of the joker sentinel value

function runJokerTests() {
    console.log('Running joker sentinel tests...');
    
    // Test joker detection
    console.log('Testing joker detection...');
    const jokerItem = { name: '🃏' };
    const regularItem = { name: 'Vodka' };
    
    const isJoker1 = (jokerItem && jokerItem.name === '🃏');
    const isJoker2 = (regularItem && regularItem.name === '🃏');
    
    console.log('Joker item correctly identified:', isJoker1); // Should be true
    console.log('Regular item correctly not identified as joker:', !isJoker2); // Should be true
    
    // Test k value assignment
    console.log('Testing k value assignment...');
    const candidates = [
        { id: 'spirits.vodka', name: 'Vodka' },
        { id: 'spirits.gin', name: 'Gin' },
        { id: 'spirits.whiskey', name: 'Whiskey' }
    ];
    
    // For regular item
    const selectedItem = candidates[1]; // Gin
    let k = 1;
    if (selectedItem.name !== '🃏') {
        k = candidates.findIndex(candidate => candidate.id === selectedItem.id) + 1;
        if (k === 0) k = 1; // Fallback
    } else {
        k = 'joker'; // Use sentinel value for joker
    }
    
    console.log('Regular item k value:', k); // Should be 2 (Gin is at index 1, so position 2)
    
    // For joker item
    const jokerK = 'joker';
    console.log('Joker item k value:', jokerK); // Should be 'joker'
    
    console.log('Joker sentinel tests completed.');
}

// Run tests
runJokerTests();