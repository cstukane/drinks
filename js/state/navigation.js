// navigation.js
// Back-stack utility with push/pop and helpers for inventory back behavior

// Simple stack for navigation history
const backStack = [];

// Push a view to the back stack
export function push(view) {
    backStack.push(view);
}

// Pop a view from the back stack
export function pop() {
    return backStack.pop();
}

// Peek at the top of the back stack
export function peek() {
    return backStack.length > 0 ? backStack[backStack.length - 1] : null;
}

// Get the size of the back stack
export function size() {
    return backStack.length;
}

// Clear the back stack
export function clear() {
    backStack.length = 0;
}

// Flow-aware helpers for inventory back behavior
export function inventoryBack({ filter, query }) {
    const hasQuery = (query || '').trim().length > 0;
    const notAtCategories = (filter && filter !== 'all') || hasQuery;
    
    if (notAtCategories) {
        // Go up to category list
        return { filter: 'all', query: '' };
    } else {
        // Already at categories: go back to the inventory home
        return { action: 'goHome' };
    }
}