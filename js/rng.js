// rng.js
// Handles all random number generation using the Web Crypto API.

/**
 * Returns a cryptographically secure random integer between 0 (inclusive) and max (exclusive).
 * @param {number} max - The upper bound (exclusive).
 * @returns {number} A random integer.
 */
export function getRandomInt(max) {
    // Create a typed array to hold the random value
    const randomValues = new Uint32Array(1);
    // Fill the array with a random value
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(randomValues);
    } else if (typeof global !== 'undefined' && global.crypto) {
        global.crypto.getRandomValues(randomValues);
    } else {
        // Fallback for Node.js environment
        randomValues[0] = Math.floor(Math.random() * 0xFFFFFFFF);
    }
    // Scale the random value to the desired range
    return Math.floor(randomValues[0] / (0xFFFFFFFF + 1) * max);
}

/**
 * Returns a cryptographically secure random float between 0 (inclusive) and 1 (exclusive).
 * @returns {number} A random float.
 */
export function getRandomFloat() {
    // Create a typed array to hold the random value
    const randomValues = new Uint32Array(1);
    // Fill the array with a random value
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(randomValues);
    } else if (typeof global !== 'undefined' && global.crypto) {
        global.crypto.getRandomValues(randomValues);
    } else {
        // Fallback for Node.js environment
        randomValues[0] = Math.floor(Math.random() * 0xFFFFFFFF);
    }
    // Scale the random value to [0, 1)
    return randomValues[0] / (0xFFFFFFFF + 1);
}

/**
 * Selects a random element from an array using a cryptographically secure random number generator.
 * @param {Array} array - The array to choose from.
 * @returns {*} A random element from the array.
 */
export function cryptoChoice(array) {
    if (!array || array.length === 0) {
        return undefined;
    }
    const randomIndex = getRandomInt(array.length);
    return array[randomIndex];
}

/**
 * Selects a random element from an array based on weights using a cryptographically secure random number generator.
 * @param {Array} array - The array to choose from.
 * @param {Array<number>} weights - The weights corresponding to each element in the array.
 * @returns {*} A random element from the array.
 */
export function weightedCryptoChoice(array, weights) {
    if (!array || array.length === 0) {
        return undefined;
    }

    // Guard against zero/negative weights by defaulting to 1
    const validWeights = weights.map(weight => weight > 0 ? weight : 1);
    
    const totalWeight = validWeights.reduce((acc, weight) => acc + weight, 0);
    const randomValue = getRandomFloat() * totalWeight;

    let cumulativeWeight = 0;
    for (let i = 0; i < array.length; i++) {
        cumulativeWeight += validWeights[i];
        if (randomValue < cumulativeWeight) {
            return array[i];
        }
    }

    // This should not be reached if weights are calculated correctly
    return array[array.length - 1];
}

/**
 * Returns a cryptographically secure random integer between 1 (inclusive) and faces (inclusive).
 * @param {number} faces - The number of faces on the die.
 * @returns {number} A random integer.
 */
export function cryptoRoll(faces) {
    return getRandomInt(faces) + 1;
}

// Export functions for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getRandomInt,
        getRandomFloat,
        cryptoChoice,
        weightedCryptoChoice,
        cryptoRoll
    };
}
