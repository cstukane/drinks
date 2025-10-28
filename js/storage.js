
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
                // Do not fetch here; seed after open in a separate transaction
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

            // Version 3 upgrade - ensure 'rules' store exists for older DBs
            if (event.oldVersion < 3) {
                console.log('Upgrading to version 3 - ensure rules store');
                if (!db.objectStoreNames.contains('rules')) {
                    db.createObjectStore('rules', { keyPath: 'id' });
                }
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('DB opened successfully');
            // Seed defaults if stores are empty or missing
            try {
                const checkTx = db.transaction(['settings', 'rules'], 'readonly');
                let needsInventorySeed = false;
                let needsRulesSeed = false;
                checkTx.objectStore('settings').get('settings').onsuccess = (e) => {
                    if (!e.target.result) needsInventorySeed = true;
                };
                checkTx.objectStore('rules').get('hard_bans').onsuccess = (e) => {
                    if (!e.target.result) needsRulesSeed = true;
                };
                checkTx.oncomplete = () => {
                    if (!needsInventorySeed && !needsRulesSeed) {
                        resolve(db);
                        return;
                    }
                    fetch('data/defaults.json')
                        .then(response => response.json())
                        .then(defaults => {
                            const stores = ['settings', 'spirits', 'mixers', 'additives', 'subpools', 'secondary', 'rules'];
                            const seedTx = db.transaction(stores, 'readwrite');
                            if (needsInventorySeed) {
                                if (defaults.settings) {
                                    seedTx.objectStore('settings').put({ id: 'settings', ...defaults.settings });
                                }
                                if (defaults.inventory) {
                                    if (defaults.inventory.spirits) {
                                        defaults.inventory.spirits.forEach(item => seedTx.objectStore('spirits').put(item));
                                    }
                                    if (defaults.inventory.mixers) {
                                        defaults.inventory.mixers.forEach(item => seedTx.objectStore('mixers').put(item));
                                    }
                                    if (defaults.inventory.additives) {
                                        defaults.inventory.additives.forEach(item => seedTx.objectStore('additives').put(item));
                                    }
                                }
                                if (defaults.subpools) {
                                    Object.keys(defaults.subpools).forEach(key => {
                                        seedTx.objectStore('subpools').put({ id: key, items: defaults.subpools[key] });
                                    });
                                }
                                if (defaults.secondary) {
                                    Object.keys(defaults.secondary).forEach(key => {
                                        seedTx.objectStore('secondary').put({ id: key, items: defaults.secondary[key] });
                                    });
                                }
                            }
                            if (needsRulesSeed && defaults.rules) {
                                seedTx.objectStore('rules').put({ id: 'hard_bans', items: defaults.rules.hard_bans || [] });
                                seedTx.objectStore('rules').put({ id: 'soft_rules', items: defaults.rules.soft_rules || [] });
                            }
                            seedTx.oncomplete = () => {
                                console.log('Defaults seeded as needed');
                                resolve(db);
                            };
                            seedTx.onerror = (e) => {
                                console.error('Error seeding defaults:', e.target.error);
                                resolve(db); // Continue even if seeding fails
                            };
                        })
                        .catch((err) => {
                            console.error('Error fetching defaults for seeding:', err);
                            resolve(db);
                        });
                };
            } catch (e) {
                console.warn('Seed check failed:', e);
                resolve(db);
            }
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

function storeNameForId(id) {
    const prefix = (id || '').split('.')[0];
    if (prefix === 'spirits') return 'spirits';
    if (prefix === 'mixers') return 'mixers';
    if (prefix === 'add' || prefix === 'additives') return 'additives';
    // Fallback: assume exact match
    return prefix;
}

export function updateItem(item) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const storeName = storeNameForId(item.id);
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
        const storeName = storeNameForId(itemId);
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
        const storeName = storeNameForId(item.id);
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add(item);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

// Create a new subpool record
export function addSubpool(subpoolId, initialItems = []) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const tx = db.transaction('subpools', 'readwrite');
        const store = tx.objectStore('subpools');
        const getReq = store.get(subpoolId);
        getReq.onsuccess = () => {
            if (getReq.result) {
                resolve(); // already exists
                return;
            }
            const putReq = store.put({ id: subpoolId, items: initialItems });
            putReq.onsuccess = () => resolve();
            putReq.onerror = (e) => reject(e.target.error);
        };
        getReq.onerror = (e) => reject(e.target.error);
    });
}

// Update an item inside a subpool (e.g., Whiskey family brand)
export function updateSubpoolItem(subpoolId, updatedItem) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const tx = db.transaction('subpools', 'readwrite');
        const store = tx.objectStore('subpools');
        const getReq = store.get(subpoolId);
        getReq.onsuccess = () => {
            const record = getReq.result;
            if (!record) { reject(new Error('Subpool not found')); return; }
            const idx = (record.items || []).findIndex(i => i.id === updatedItem.id);
            if (idx === -1) { reject(new Error('Item not found in subpool')); return; }
            record.items[idx] = updatedItem;
            const putReq = store.put(record);
            putReq.onsuccess = () => resolve();
            putReq.onerror = e => reject(e.target.error);
        };
        getReq.onerror = (e) => reject(e.target.error);
    });
}

// Add a new item into a subpool
export function addSubpoolItem(subpoolId, newItem) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const tx = db.transaction('subpools', 'readwrite');
        const store = tx.objectStore('subpools');
        const getReq = store.get(subpoolId);
        getReq.onsuccess = () => {
            const record = getReq.result;
            if (!record) { reject(new Error('Subpool not found')); return; }
            if (!Array.isArray(record.items)) record.items = [];
            record.items.push(newItem);
            const putReq = store.put(record);
            putReq.onsuccess = () => resolve();
            putReq.onerror = e => reject(e.target.error);
        };
        getReq.onerror = (e) => reject(e.target.error);
    });
}

// Create a new secondary pool record (e.g., sec.foam)
export function addSecondaryPool(poolId, initialItems = []) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const tx = db.transaction('secondary', 'readwrite');
        const store = tx.objectStore('secondary');
        const getReq = store.get(poolId);
        getReq.onsuccess = () => {
            if (getReq.result) { resolve(); return; }
            const putReq = store.put({ id: poolId, items: initialItems });
            putReq.onsuccess = () => resolve();
            putReq.onerror = (e) => reject(e.target.error);
        };
        getReq.onerror = (e) => reject(e.target.error);
    });
}

// Update an item inside a secondary pool
export function updateSecondaryItem(poolId, updatedItem) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not initialized');
            return;
        }
        const tx = db.transaction('secondary', 'readwrite');
        const store = tx.objectStore('secondary');
        const getReq = store.get(poolId);
        getReq.onsuccess = () => {
            const record = getReq.result;
            if (!record) { reject(new Error('Secondary pool not found')); return; }
            const idx = (record.items || []).findIndex(i => i.id === updatedItem.id);
            if (idx === -1) { reject(new Error('Item not found in secondary pool')); return; }
            record.items[idx] = updatedItem;
            const putReq = store.put(record);
            putReq.onsuccess = () => resolve();
            putReq.onerror = (e) => reject(e.target.error);
        };
        getReq.onerror = (e) => reject(e.target.error);
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
