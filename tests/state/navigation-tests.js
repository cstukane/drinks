// navigation-tests.js
// Unit tests for the navigation utility module

import { push, pop, peek, size, clear, inventoryBack } from '../../js/state/navigation.js';

// Test suite
export function runNavigationTests() {
    console.log('Running navigation tests...');
    
    // Test 1: Push and peek
    push('view1');
    push('view2');
    console.log('Peek:', peek());
    console.log('Size:', size());
    
    // Test 2: Pop
    const popped = pop();
    console.log('Popped:', popped);
    console.log('Peek after pop:', peek());
    console.log('Size after pop:', size());
    
    // Test 3: Clear
    clear();
    console.log('Size after clear:', size());
    
    // Test 4: Inventory back behavior
    const backToCategories = inventoryBack({ filter: 'sub.whiskey', query: '' });
    console.log('Back to categories:', backToCategories);
    
    const backToHome = inventoryBack({ filter: 'all', query: '' });
    console.log('Back to home:', backToHome);
    
    console.log('Navigation tests completed.');
}
