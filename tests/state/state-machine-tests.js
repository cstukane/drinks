// state-machine-tests.js
// Unit tests for the state machine module

import { register, transitionTo, getCurrentState, getRegisteredStates } from '../../js/state/stateMachine.js';

// Mock DOM for testing
global.document = {
    getElementById: () => ({ innerHTML: '' }),
    querySelector: () => null,
    querySelectorAll: () => []
};

// Mock window events
global.window = {
    dispatchEvent: () => {},
    addEventListener: () => {}
};

// Test state handlers
const testStates = {
    TEST_STATE_1: {
        enter: () => console.log('Entering TEST_STATE_1'),
        exit: () => console.log('Exiting TEST_STATE_1')
    },
    TEST_STATE_2: {
        enter: () => console.log('Entering TEST_STATE_2'),
        exit: () => console.log('Exiting TEST_STATE_2')
    }
};

// Test suite
export function runStateMachineTests() {
    console.log('Running state machine tests...');
    
    // Test 1: Register states
    register('TEST_STATE_1', testStates.TEST_STATE_1);
    register('TEST_STATE_2', testStates.TEST_STATE_2);
    
    const registered = getRegisteredStates();
    console.log('Registered states:', registered);
    
    // Test 2: Transition to state
    transitionTo('TEST_STATE_1');
    console.log('Current state:', getCurrentState());
    
    // Test 3: Transition to another state
    transitionTo('TEST_STATE_2');
    console.log('Current state:', getCurrentState());
    
    console.log('State machine tests completed.');
}
