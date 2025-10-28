// inventoryFlow.js
// Inventory flow controller for Dicey Drinks

import { register, transitionTo } from '../stateMachine.js';
import { push, pop, peek, inventoryBack } from '../navigation.js';
import { renderInventoryLanding, renderInventoryList, renderInventoryItemDetail, showAddItemModal, showAddCategoryModal } from '../views/inventoryView.js';

let data = {};

// Update data reference (called from app.js when data changes)
export function setData(newData) {
    data = newData;
}

// Helper function to slugify strings
const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// Helper function to convert strings to title case
const toTitle = (s) => s.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Create the inventory flow states
function createInventoryStates() {
    // Render inventory landing page
    const renderLanding = (appContainer) => {
        renderInventoryLanding({
            parent: appContainer,
            handlers: {
                onBack: () => transitionTo('IDLE'),
                onExport: () => window.exportInventory(),
                onView: () => renderList2(appContainer),
                onAddItem: () => openAddModal(),
                onAddCategory: () => openAddCategoryModal()
            }
        });
    };

    // Render inventory list page
    const renderList = async (appContainer) => {
        data = await window.getData();
        window.setData(data);
        const families = data.inventory.spirits.filter(s => s.type === 'family');
        const secondaryKeys = Object.keys(data.secondary || {});
        let html = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                <button id="inv-back" class="secondary">Back</button>
                <h2 style="margin:0;">Inventory</h2>
            </div>
            <div style="margin-bottom:10px; display:flex; gap:8px; align-items:center;">
                <input id="inv-search" type="text" placeholder="Search…" style="flex:2; min-width:66%;">
                <select id="inv-filter" style="flex:1; min-width:25%;">
                    <option value="all">All</option>
                    ${families.map(f => `<option value="${f.subpool_id}">${f.name}</option>`).join('')}
                    <option value="mixers">Mixers</option>
                    <option value="additives">Additives</option>
                    ${secondaryKeys.map(k => `<option value="${k}">${(k.split('.')[1] || k)}</option>`).join('')}
                </select>
            </div>
            <div id="inv-list"></div>
        `;
        appContainer.innerHTML = html;
        const backBtn = document.getElementById('inv-back');
        const filterEl = document.getElementById('inv-filter');
        const searchEl = document.getElementById('inv-search');
        
        // Back navigates up one level: items -> categories, categories -> landing
        backBtn.addEventListener('click', () => {
            const backAction = inventoryBack({ 
                filter: filterEl.value, 
                query: searchEl.value 
            });
            
            if (backAction.action === 'goHome') {
                renderLanding(appContainer);
            } else {
                filterEl.value = backAction.filter;
                searchEl.value = backAction.query;
                renderItems(filterEl.value, searchEl.value.trim());
            }
        });

        const renderItemDetail = (ctx) => {
            const container = document.getElementById('inv-list');
            const { item, originKind, originId } = ctx;
            const faded = (on) => on ? '' : 'style="opacity:0.5"';
            container.innerHTML = `
                <div style="margin-bottom:8px;"><button id="detail-back" class="secondary">Back</button></div>
                <div ${faded(item.in_rotation)}>
                    <h3 style="margin:4px 0;">${item.name}</h3>
                    <button id="detail-toggle">${item.in_rotation ? 'Deprecate' : 'Restore'}</button>
                </div>
            `;
            document.getElementById('detail-back').addEventListener('click', () => {
                renderItems(filterEl.value, searchEl.value.trim());
            });
            document.getElementById('detail-toggle').addEventListener('click', async () => {
                item.in_rotation = !item.in_rotation;
                if (originKind === 'mixers' || originKind === 'additives') {
                    await window.updateItem(item);
                } else if (originKind === 'sub') {
                    await window.updateSubpoolItem(originId, item);
                } else if (originKind === 'sec') {
                    await window.updateSecondaryItem(originId, item);
                }
                data = await window.getData();
                window.setData(data);
                renderItemDetail({ item, originKind, originId });
            });
        };

        const renderItems = (filterVal, query) => {
            const container = document.getElementById('inv-list');
            const q = (query || '').toLowerCase();
            let out = '<ul style="list-style:none; padding:0;">';

            const pushItem = (obj) => {
                const isActive = obj.in_rotation !== false; // default true if missing
                const cls = isActive ? 'open-item' : 'open-item inv-deprecated';
                out += `<li><button class="${cls}" data-kind="${obj.kind}" data-origin="${obj.origin}" data-id="${obj.id}">${obj.name}</button></li>`;
            };

            if (q) {
                Object.keys(data.subpools || {}).forEach(sp => {
                    (data.subpools[sp] || []).forEach(it => {
                        if ((it.name || '').toLowerCase().includes(q)) pushItem({ kind: 'sub', origin: sp, id: it.id, name: it.name, in_rotation: it.in_rotation });
                    });
                });
                (data.inventory.mixers || []).forEach(m => {
                    if ((m.name || '').toLowerCase().includes(q)) pushItem({ kind: 'mixers', origin: 'mixers', id: m.id, name: m.name, in_rotation: m.in_rotation });
                });
                (data.inventory.additives || []).forEach(a => {
                    if ((a.name || '').toLowerCase().includes(q)) pushItem({ kind: 'additives', origin: 'additives', id: a.id, name: a.name, in_rotation: a.in_rotation });
                });
                Object.keys(data.secondary || {}).forEach(sk => {
                    (data.secondary[sk] || []).forEach(it => {
                        if ((it.name || '').toLowerCase().includes(q)) pushItem({ kind: 'sec', origin: sk, id: it.id, name: it.name, in_rotation: it.in_rotation });
                    });
                });
            } else if (filterVal === 'mixers') {
                (data.inventory.mixers || []).slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(m => pushItem({ kind: 'mixers', origin: 'mixers', id: m.id, name: m.name, in_rotation: m.in_rotation }));
            } else if (filterVal === 'additives') {
                (data.inventory.additives || []).slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(a => pushItem({ kind: 'additives', origin: 'additives', id: a.id, name: a.name, in_rotation: a.in_rotation }));
            } else if (filterVal && filterVal.startsWith('sub.')) {
                (data.subpools[filterVal] || []).slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(it => pushItem({ kind: 'sub', origin: filterVal, id: it.id, name: it.name, in_rotation: it.in_rotation }));
            } else if (filterVal && filterVal.startsWith('sec.')) {
                (data.secondary[filterVal] || []).slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(it => pushItem({ kind: 'sec', origin: filterVal, id: it.id, name: it.name, in_rotation: it.in_rotation }));
            } else {
                const categories = [
                    ...families.map(f => ({ id: f.subpool_id, label: f.name, kind: 'sub' })),
                    ...secondaryKeys.map(k => ({ id: k, label: toTitle(k.split('.')[1] || k), kind: 'sec' }))
                ].sort((a,b) => a.label.localeCompare(b.label));
                categories.forEach(c => {
                    out += `<li><button class="open-cat" data-id="${c.id}">${c.label}</button></li>`;
                });
            }

            out += '</ul>';
            container.innerHTML = out;

            container.querySelectorAll('.open-cat').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    filterEl.value = id;
                    // Navigating down a level: show items within this category
                    renderItems(id, '');
                });
            });
            container.querySelectorAll('.open-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const kind = e.currentTarget.getAttribute('data-kind');
                    const origin = e.currentTarget.getAttribute('data-origin');
                    let item = null;
                    if (kind === 'mixers' || kind === 'additives') {
                        item = (data.inventory[kind] || []).find(x => x.id === id);
                    } else if (kind === 'sub') {
                        item = (data.subpools[origin] || []).find(x => x.id === id);
                    } else if (kind === 'sec') {
                        item = (data.secondary[origin] || []).find(x => x.id === id);
                    }
                    if (item) {
                        renderItemDetail({ item: { ...item }, originKind: kind, originId: origin });
                    }
                });
            });
        };

        filterEl.addEventListener('change', () => {
            renderItems(filterEl.value, searchEl.value.trim());
        });
        searchEl.addEventListener('input', () => {
            renderItems(filterEl.value, searchEl.value.trim());
        });
        renderItems('all', '');
    };

    // Render inventory list using view helpers (incremental adoption)
    const renderList2 = async (appContainer) => {
        data = await window.getData();
        window.setData(data);

        let currentFilter = 'all';
        let currentQuery = '';

        const mount = () => renderInventoryList({
            parent: appContainer,
            data,
            initialFilter: currentFilter,
            initialQuery: currentQuery,
            handlers: {
                onBack: ({ filter, query }) => {
                    const backAction = inventoryBack({ filter, query });
                    if (backAction.action === 'goHome') {
                        renderLanding(appContainer);
                    } else {
                        currentFilter = backAction.filter;
                        currentQuery = backAction.query;
                        mount();
                    }
                },
                onOpenCategory: (id) => {
                    currentFilter = id;
                    currentQuery = '';
                    mount();
                },
                onOpenItem: ({ id, kind, origin }) => {
                    let item = null;
                    if (kind === 'mixers' || kind === 'additives') {
                        item = (data.inventory[kind] || []).find(x => x.id === id);
                    } else if (kind === 'sub') {
                        item = (data.subpools[origin] || []).find(x => x.id === id);
                    } else if (kind === 'sec') {
                        item = (data.secondary[origin] || []).find(x => x.id === id);
                    }
                    if (!item) return;
                    const listEl = appContainer.querySelector('#inv-list');
                    renderInventoryItemDetail({
                        parent: listEl,
                        ctx: { item: { ...item }, originKind: kind, originId: origin },
                        handlers: {
                            onBack: () => mount(),
                            onToggle: async ({ item: updated, originKind, originId }) => {
                                updated.in_rotation = !updated.in_rotation;
                                if (originKind === 'mixers' || originKind === 'additives') {
                                    await window.updateItem(updated);
                                } else if (originKind === 'sub') {
                                    await window.updateSubpoolItem(originId, updated);
                                } else if (originKind === 'sec') {
                                    await window.updateSecondaryItem(originId, updated);
                                }
                                data = await window.getData();
                                window.setData(data);
                                mount();
                            }
                        }
                    });
                },
                onFilterChange: (val) => { currentFilter = val; },
                onQueryChange: (q) => { currentQuery = q; }
            }
        });

        mount();
    };

    // Open add item modal
    const openAddModal = () => {
        showAddItemModal({
            data,
            handlers: {
                onSave: async ({ type, name, familyId, subpoolId, id }) => {
                    if (type === 'spirit') {
                        const newItem = { id, name, in_rotation: true };
                        await window.addSubpoolItem(subpoolId, newItem);
                    } else if (type === 'mixers' || type === 'additives') {
                        const newItem = { id, name, in_rotation: true };
                        await window.addItem(newItem);
                    }
                    const appContainer = document.getElementById('app-container');
                    await renderList2(appContainer);
                }
            }
        });
    };

    // Open add category modal
    const openAddCategoryModal = () => {
        showAddCategoryModal({
            handlers: {
                onSave: async ({ under, name, familyId, subpoolId, poolId }) => {
                    if (under === 'spirit') {
                        const familyItem = { id: familyId, name, type: 'family', in_rotation: true, subpool_id: subpoolId };
                        await window.addItem(familyItem);
                        await window.addSubpool(subpoolId, []);
                    } else if (under === 'secondary') {
                        await window.addSecondaryPool(poolId, []);
                    }
                    const appContainer = document.getElementById('app-container');
                    await renderList2(appContainer);
                }
            }
        });
    };

    // INVENTORY state
    return {
        enter: async () => {
            console.log('Entering INVENTORY state');
            const appContainer = document.getElementById('app-container');
            const panel = document.getElementById('dev-validations-panel');
            if (panel) panel.style.display = 'none';
            
            renderLanding(appContainer);
        },
        exit: () => {
            console.log('Exiting INVENTORY state');
        }
    };
}

// Register inventory flow states
export function registerInventoryFlowStates() {
    register('INVENTORY', createInventoryStates());
}
