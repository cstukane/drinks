// stateMachine.js
// Minimal state machine engine for Dicey Drinks

// State registry
const stateRegistry = {};

// Current state name
let currentStateName = null;

// Register a state with enter/exit handlers
export function register(name, { enter, exit }) {
    stateRegistry[name] = { enter, exit };
}

// Transition to a new state with optional context
export function transitionTo(newState, context = {}) {
    // Call exit handler for current state if it exists
    if (currentStateName && stateRegistry[currentStateName] && stateRegistry[currentStateName].exit) {
        stateRegistry[currentStateName].exit();
    }
    
    // Update current state
    currentStateName = newState;
    
    // Call enter handler for new state if it exists
    if (stateRegistry[currentStateName] && stateRegistry[currentStateName].enter) {
        stateRegistry[currentStateName].enter(context);
    }
    
    // Emit event for progress drawer update
    window.dispatchEvent(new CustomEvent('stateTransition', { detail: { state: newState } }));
}

// Get current state name
export function getCurrentState() {
    return currentStateName;
}

// Get all registered states
export function getRegisteredStates() {
    return Object.keys(stateRegistry);
}