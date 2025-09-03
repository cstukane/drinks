// Simple Node.js test runner
const fs = require('fs');

// Mock browser APIs for Node.js environment
global.window = {
    crypto: {
        getRandomValues: function(array) {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            return array;
        }
    }
};

// Mock other browser APIs
global.document = {
    createElement: function() {
        return {
            getContext: function() {
                return null;
            }
        };
    }
};

// Mock atob and btoa for share code functionality
global.atob = function(str) {
    return Buffer.from(str, 'base64').toString('binary');
};

global.btoa = function(str) {
    return Buffer.from(str, 'binary').toString('base64');
};

// Mock pako for share code functionality
global.pako = {
    deflate: function(data) {
        return new Uint8Array(Buffer.from(data, 'utf-8'));
    },
    inflate: function(data) {
        return Buffer.from(data).toString('utf-8');
    }
};

// Mock indexedDB
global.indexedDB = {
    open: function() {
        return {
            onsuccess: function() {},
            onerror: function() {},
            onupgradeneeded: function() {}
        };
    }
};

console.log('Running RNG tests...');
import('./rng-tests.js');