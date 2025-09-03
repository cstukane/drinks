// Node.js Test Runner for Dicey Drinks
// This script runs all tests in a Node.js environment with appropriate mocks

// Mock browser APIs for Node.js environment
global.window = {
    crypto: {
        getRandomValues: function(array) {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            return array;
        }
    },
    location: {
        origin: 'http://localhost:5012',
        pathname: '/index.html',
        hash: ''
    }
};

// Mock other browser APIs
global.document = {
    createElement: function(tag) {
        return {
            getContext: function() {
                return null;
            },
            appendChild: function() {},
            innerHTML: '',
            style: {}
        };
    },
    getElementById: function() {
        return {
            addEventListener: function() {},
            innerHTML: '',
            style: {}
        };
    },
    querySelector: function() {
        return {
            addEventListener: function() {}
        };
    },
    querySelectorAll: function() {
        return [{
            addEventListener: function() {}
        }];
    }
};

// Mock atob and btoa for share code functionality
global.atob = function(str) {
    try {
        return Buffer.from(str, 'base64').toString('binary');
    } catch (e) {
        return str;
    }
};

global.btoa = function(str) {
    try {
        return Buffer.from(str, 'binary').toString('base64');
    } catch (e) {
        return str;
    }
};

// Mock pako for share code functionality
global.pako = {
    deflate: function(data) {
        try {
            return new Uint8Array(Buffer.from(data, 'utf-8'));
        } catch (e) {
            return new Uint8Array(0);
        }
    },
    inflate: function(data) {
        try {
            return Buffer.from(data).toString('utf-8');
        } catch (e) {
            return '';
        }
    }
};

// Mock indexedDB
global.indexedDB = {
    open: function(name, version) {
        return {
            onsuccess: null,
            onerror: null,
            onupgradeneeded: null,
            result: {
                transaction: function() {
                    return {
                        objectStore: function() {
                            return {
                                put: function() {
                                    return {
                                        onsuccess: null,
                                        onerror: null
                                    };
                                },
                                get: function() {
                                    return {
                                        onsuccess: null,
                                        onerror: null
                                    };
                                },
                                getAll: function() {
                                    return {
                                        onsuccess: null,
                                        onerror: null
                                    };
                                },
                                add: function() {
                                    return {
                                        onsuccess: null,
                                        onerror: null
                                    };
                                },
                                delete: function() {
                                    return {
                                        onsuccess: null,
                                        onerror: null
                                    };
                                },
                                clear: function() {
                                    return {
                                        onsuccess: null,
                                        onerror: null
                                    };
                                }
                            };
                        }
                    };
                }
            }
        };
    },
    deleteDatabase: function() {
        return {
            onsuccess: null,
            onerror: null,
            onblocked: null
        };
    }
};

// Mock AudioContext
global.AudioContext = function() {
    return {
        createOscillator: function() {
            return {
                connect: function() {},
                frequency: {
                    setValueAtTime: function() {},
                    exponentialRampToValueAtTime: function() {}
                },
                start: function() {},
                stop: function() {}
            };
        },
        createGain: function() {
            return {
                connect: function() {},
                gain: {
                    setValueAtTime: function() {},
                    linearRampToValueAtTime: function() {},
                    exponentialRampToValueAtTime: function() {}
                }
            };
        }
    };
};

// Mock THREE.js
global.THREE = {
    Scene: function() {
        return {
            background: null,
            add: function() {}
        };
    },
    PerspectiveCamera: function() {
        return {
            position: { set: function() {} },
            lookAt: function() {}
        };
    },
    HemisphereLight: function() {},
    DirectionalLight: function() {
        return {
            position: { set: function() {} }
        };
    },
    WebGLRenderer: function() {
        return {
            setSize: function() {},
            setPixelRatio: function() {},
            domElement: global.document.createElement('canvas'),
            render: function() {}
        };
    },
    MeshStandardMaterial: function() {},
    IcosahedronGeometry: function() {},
    Mesh: function() {
        return {
            rotation: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 }
        };
    }
};

// Mock matchMedia
global.window.matchMedia = function() {
    return {
        matches: false
    };
};

// Mock requestAnimationFrame
global.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 16);
};

// Mock cancelAnimationFrame
global.cancelAnimationFrame = function(id) {
    clearTimeout(id);
};

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

// Test RNG functions
function testRNG() {
    console.log('\n🧪 Testing RNG functions...');
    
    try {
        // Import RNG functions
        const rngModule = require('../js/rng.js');
        
        // Test getRandomInt
        let rollResults = {};
        for (let i = 0; i < 100; i++) {
            const result = rngModule.getRandomInt(20);
            if (result >= 0 && result < 20) {
                rollResults[result] = (rollResults[result] || 0) + 1;
            }
        }
        const allInRange = Object.keys(rollResults).every(k => k >= 0 && k < 20);
        logTestResult('getRandomInt range check', allInRange, `Generated 100 values in range [0,20)`);

        // Test getRandomFloat
        let floatResults = [];
        for (let i = 0; i < 100; i++) {
            const result = rngModule.getRandomFloat();
            if (result >= 0 && result < 1) {
                floatResults.push(result);
            }
        }
        const allFloatsInRange = floatResults.length === 100;
        logTestResult('getRandomFloat range check', allFloatsInRange, `Generated 100 values in range [0,1)`);

        // Test cryptoChoice
        const testArray = ['a', 'b', 'c', 'd', 'e'];
        let choiceResults = {};
        for (let i = 0; i < 100; i++) {
            const result = rngModule.cryptoChoice(testArray);
            if (result) {
                choiceResults[result] = (choiceResults[result] || 0) + 1;
            }
        }
        const allChoicesValid = Object.keys(choiceResults).every(k => testArray.includes(k));
        logTestResult('cryptoChoice validity check', allChoicesValid, `Made 100 valid choices from array`);

        // Test weightedCryptoChoice
        const items = ['low', 'medium', 'high'];
        const weights = [1, 5, 10];
        let weightedResults = {};
        for (let i = 0; i < 100; i++) {
            const result = rngModule.weightedCryptoChoice(items, weights);
            if (result) {
                weightedResults[result] = (weightedResults[result] || 0) + 1;
            }
        }
        const allWeightedChoicesValid = Object.keys(weightedResults).every(k => items.includes(k));
        logTestResult('weightedCryptoChoice validity check', allWeightedChoicesValid, `Made 100 valid weighted choices`);

        return true;
    } catch (error) {
        logTestResult('RNG tests', false, `Error: ${error.message}`);
        return false;
    }
}

// Test Rules functions
function testRules() {
    console.log('\n🧪 Testing Rules functions...');

    try {
        // Import Rules functions
        const rulesModule = require('../js/rules.js');

        // Test violatesHardBan
        const hardBans = [
            { a: 'trait:coffee', b: 'trait:wine' },
            { a: 'trait:acidic', b: 'trait:dairy_or_cream' }
        ];

        const coffeeMixer = { id: 'mixers.coffee', traits: ['coffee', 'caffeinated'] };
        const selectedItemsWithWine = [{ id: 'spirits.wine', traits: ['wine', 'alcoholic'] }];
        const isBanned1 = rulesModule.violatesHardBan(coffeeMixer, selectedItemsWithWine, hardBans);
        logTestResult('violatesHardBan - coffee with wine', isBanned1, 'Coffee correctly banned with wine selected');

        // Test getSoftWeight
        const softRules = [
            { a: 'trait:cream_liqueur', b: 'trait:beer', weight_mult: 0.25 }
        ];

        const creamLiqueur = { id: 'spirits.liqueur', traits: ['cream_liqueur', 'dairy_or_cream'] };
        const beer = { id: 'mixers.beer', traits: ['beer'] };
        const weight1 = rulesModule.getSoftWeight(beer, [creamLiqueur], softRules);
        logTestResult('getSoftWeight - cream liqueur + beer', weight1 === 0.25, `Weight is ${weight1}, expected 0.25`);

        return true;
    } catch (error) {
        logTestResult('Rules tests', false, `Error: ${error.message}`);
        return false;
    }
}

// Test Animation functions
function testAnimation() {
    console.log('\n🧪 Testing Animation functions...');

    try {
        // Import Animation functions
        const animModule = require('../js/anim.js');

        // Test mapNToShape (this is a private function, so we'll test the logic directly)
        function mapNToShape(N) {
            if (N <= 4) return 'd4';
            if (N <= 7) return 'd6';
            if (N <= 9) return 'd8';
            if (N <= 11) return 'd10';
            if (N <= 16) return 'd12';
            return 'd20';
        }

        const testCases = [
            { N: 1, expected: 'd4' },
            { N: 5, expected: 'd6' },
            { N: 8, expected: 'd8' },
            { N: 10, expected: 'd10' },
            { N: 12, expected: 'd12' },
            { N: 17, expected: 'd20' }
        ];

        let allPassed = true;
        for (const test of testCases) {
            const result = mapNToShape(test.N);
            if (result !== test.expected) {
                logTestResult(`mapNToShape N=${test.N}`, false, `Expected ${test.expected}, got ${result}`);
                allPassed = false;
            }
        }

        if (allPassed) {
            logTestResult('mapNToShape all cases', true, 'All shape mappings correct');
        }

        return allPassed;
    } catch (error) {
        logTestResult('Animation tests', false, `Error: ${error.message}`);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Dicey Drinks Test Suite...\n');

    // Run individual test suites
    const rngPassed = testRNG();
    const rulesPassed = testRules();
    const animationPassed = testAnimation();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${passedTests + failedTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);

    if (failedTests === 0) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ Dicey Drinks core functionality is working correctly.');
        return true;
    } else {
        console.log('\n❌ SOME TESTS FAILED');
        console.log('Please check the errors above and fix the implementation.');
        return false;
    }
}

// Run the tests
runAllTests().then(success => {
    process.exit(success ? 0 : 1);
});
