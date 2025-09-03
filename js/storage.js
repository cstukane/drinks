
// storage.js
// Handles IndexedDB and localStorage operations.

const DB_NAME = 'DiceyDrinksDB';
const DB_VERSION = 3; // Updated version
let db;

export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('DB upgrade needed from version', event.oldVersion, 'to', event.newVersion);

            if (event.oldVersion < 1) {
                // Initial schema creation
                db.createObjectStore('settings', { keyPath: 'id' });
                db.createObjectStore('spirits', { keyPath: 'id' });
                db.createObjectStore('mixers', { keyPath: 'id' });
                db.createObjectStore('additives', { keyPath: 'id' });
                db.createObjectStore('subpools', { keyPath: 'id' });
                db.createObjectStore('secondary', { keyPath: 'id' });
                db.createObjectStore('rules', { keyPath: 'id' }); // Add rules store
                const cookbookStore = db.createObjectStore('cookbook', { keyPath: 'id', autoIncrement: true });
                cookbookStore.createIndex('rating', 'rating', { unique: false });
                cookbookStore.createIndex('notes', 'notes', { unique: false });

                // Fetch and load initial data
                fetch('data/defaults.json')
                    .then(response => response.json())
                    .then(data => {
                        console.log('Loading initial data into DB');
                        const tx = event.target.transaction;
                        if (data.settings) {
                            tx.objectStore('settings').put({ id: 'settings', ...data.settings });
                        }
                        if (data.inventory) {
                            if (data.inventory.spirits) {
                                data.inventory.spirits.forEach(item => tx.objectStore('spirits').put(item));
                            }
                            if (data.inventory.mixers) {
                                data.inventory.mixers.forEach(item => tx.objectStore('mixers').put(item));
                            }
                            if (data.inventory.additives) {
                                data.inventory.additives.forEach(item => tx.objectStore('additives').put(item));
                            }
                        }

                        if (data.subpools) {
                            Object.keys(data.subpools).forEach(key => {
                                tx.objectStore('subpools').put({ id: key, items: data.subpools[key] });
                            });
                        }

                        if (data.secondary) {
                            Object.keys(data.secondary).forEach(key => {
                                tx.objectStore('secondary').put({ id: key, items: data.secondary[key] });
                            });
                        }

                        // Load rules data
                        if (data.rules) {
                            tx.objectStore('rules').put({ id: 'hard_bans', items: data.rules.hard_bans || [] });
                            tx.objectStore('rules').put({ id: 'soft_rules', items: data.rules.soft_rules || [] });
                        }
                    })
                    .catch(error => {
                        console.error('Error loading initial data:', error);
                    });
            }

            if (event.oldVersion < 2) {
                // Version 2 upgrade
                const tx = event.target.transaction;
                const cookbookStore = tx.objectStore('cookbook');
                if (!cookbookStore.indexNames.contains('rating')) {
                    cookbookStore.createIndex('rating', 'rating', { unique: false });
                }
                if (!cookbookStore.indexNames.contains('notes')) {
                    cookbookStore.createIndex('notes', 'notes', { unique: false });
                }
            }

            // Version 3 upgrade - Add rules migration for existing users
            if (event.oldVersion < 3) {
                console.log('Upgrading to version 3 - migrating rules');
                const tx = event.target.transaction;
                
                // Check if rules store exists, if not create it
                if (!db.objectStoreNames.contains('rules')) {
                    db.createObjectStore('rules', { keyPath: 'id' });
                }
                
                // Load default rules
                fetch('data/defaults.json')
                    .then(response => response.json())
                    .then(data => {
                        if (data.rules) {
                            const rulesStore = tx.objectStore('rules');
                            rulesStore.put({ id: 'hard_bans', items: data.rules.hard_bans || [] });
                            rulesStore.put({ id: 'soft_rules', items: data.rules.soft_rules || [] });
                            console.log('Rules migrated successfully');
                        }
                    })
                    .catch(error => {
                        console.error('Error migrating rules:', error);
                    });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('DB opened successfully');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('DB error:', event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

export function getData() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const tx = db.transaction(['spirits', 'mixers', 'additives', 'subpools', 'secondary', 'settings', 'rules'], 'readonly');
        const spiritsStore = tx.objectStore('spirits');
        const mixersStore = tx.objectStore('mixers');
        const additivesStore = tx.objectStore('additives');
        const subpoolsStore = tx.objectStore('subpools');
        const secondaryStore = tx.objectStore('secondary');
        const settingsStore = tx.objectStore('settings');
        const rulesStore = tx.objectStore('rules');

        const data = { inventory: { spirits: [], mixers: [], additives: [] }, subpools: {}, secondary: {}, rules: {} };

        spiritsStore.getAll().onsuccess = e => data.inventory.spirits = e.target.result;
        mixersStore.getAll().onsuccess = e => data.inventory.mixers = e.target.result;
        additivesStore.getAll().onsuccess = e => data.inventory.additives = e.target.result;
        subpoolsStore.getAll().onsuccess = e => {
            // Convert array of {id, items} to object map
            e.target.result.forEach(sp => {
                data.subpools[sp.id] = sp.items;
            });
        };
        secondaryStore.getAll().onsuccess = e => {
            // Convert array of {id, items} to object map
            e.target.result.forEach(sec => {
                data.secondary[sec.id] = sec.items;
            });
        };
        settingsStore.get('settings').onsuccess = e => data.settings = e.target.result;
        
        // Get rules data
        const hardBansRequest = rulesStore.get('hard_bans');
        hardBansRequest.onsuccess = e => {
            if (e.target.result) {
                data.rules.hard_bans = e.target.result.items;
            }
        };
        
        const softRulesRequest = rulesStore.get('soft_rules');
        softRulesRequest.onsuccess = e => {
            if (e.target.result) {
                data.rules.soft_rules = e.target.result.items;
            }
        };

        tx.oncomplete = () => {
            resolve(data);
        };

        tx.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/*
function deleteDB() {
    return new Promise((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
            console.log('Database deleted successfully');
            resolve();
        };
        deleteRequest.onerror = () => {
            console.error('Error deleting database');
            reject();
        };
        deleteRequest.onblocked = () => {
            console.warn('Database delete blocked');
            reject('Database delete blocked');
        };
    });
}
*/

export function updateItem(item) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const storeName = item.id.split('.')[0] + 's'; // e.g. spirits, mixers
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

export function deleteItem(itemId) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const storeName = itemId.split('.')[0] + 's'; // e.g. spirits, mixers
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(itemId);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

export function addItem(item) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const storeName = item.id.split('.')[0] + 's'; // e.g. spirits, mixers
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add(item);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

export function addRecipeToCookbook(recipe) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const tx = db.transaction('cookbook', 'readwrite');
        const store = tx.objectStore('cookbook');
        const request = store.add(recipe);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

export function getCookbook() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const tx = db.transaction('cookbook', 'readonly');
        const store = tx.objectStore('cookbook');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}
// Function to replace all inventory data
export function replaceInventoryData(inventoryData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        
        const tx = db.transaction(['spirits', 'mixers', 'additives', 'subpools', 'secondary'], 'readwrite');
        
        // Clear all existing data
        const spiritsStore = tx.objectStore('spirits');
        const mixersStore = tx.objectStore('mixers');
        const additivesStore = tx.objectStore('additives');
        const subpoolsStore = tx.objectStore('subpools');
        const secondaryStore = tx.objectStore('secondary');
        
        const clearRequests = [
            spiritsStore.clear(),
            mixersStore.clear(),
            additivesStore.clear(),
            subpoolsStore.clear(),
            secondaryStore.clear()
        ];
        
        // Wait for all clears to complete
        Promise.all(clearRequests)
            .then(() => {
                // Add new inventory data
                if (inventoryData.inventory) {
                    if (inventoryData.inventory.spirits) {
                        inventoryData.inventory.spirits.forEach(item => spiritsStore.add(item));
                    }
                    if (inventoryData.inventory.mixers) {
                        inventoryData.inventory.mixers.forEach(item => mixersStore.add(item));
                    }
                    if (inventoryData.inventory.additives) {
                        inventoryData.inventory.additives.forEach(item => additivesStore.add(item));
                    }
                }
                
                // Add new subpools
                if (inventoryData.subpools) {
                    Object.keys(inventoryData.subpools).forEach(key => {
                        subpoolsStore.add({ id: key, items: inventoryData.subpools[key] });
                    });
                }
                
                // Add new secondary pools
                if (inventoryData.secondary) {
                    Object.keys(inventoryData.secondary).forEach(key => {
                        secondaryStore.add({ id: key, items: inventoryData.secondary[key] });
                    });
                }
                
                tx.oncomplete = () => {
                    console.log('Inventory data replaced successfully');
                    resolve();
                };
                
                tx.onerror = (event) => {
                    console.error('Error replacing inventory data:', event.target.error);
                    reject(event.target.error);
                };
            })
            .catch(error => {
                console.error('Error clearing inventory data:', error);
                reject(error);
            });
    });
}
