// inventoryView.js
// Pure view builders for Inventory UI (landing, list, item detail, add modals)
// These functions only build DOM and wire UI events; callers provide callbacks
// for data mutations and navigation.

// Utility: slugify and title-case helpers (kept local to view for now)
const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const toTitle = (s) => (s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Render the landing page for Inventory
// handlers: { onBack, onExport, onView, onAddItem, onAddCategory }
export function renderInventoryLanding({ parent, handlers = {} }) {
  const { onBack, onExport, onView, onAddItem, onAddCategory } = handlers;
  const container = document.createElement('div');
  container.innerHTML = `
    <h2>Inventory</h2>
    <div class="inv-landing" style="display:flex; flex-direction:column; gap:12px; align-items:center;">
      <button id="view-inventory" class="primary">View Inventory</button>
      <button id="add-item" class="primary">Add Item</button>
      <button id="add-category" class="primary">Add Category</button>
    </div>
    <div style="position:fixed; bottom:16px; left:0; right:0; text-align:center;">
      <button id="export-inventory" class="secondary" style="opacity:0.9;">Export Inventory</button>
    </div>
    <div style="position:fixed; top:16px; left:16px;"><button id="back-to-idle">Back</button></div>
  `;

  parent.innerHTML = '';
  parent.appendChild(container);

  container.querySelector('#back-to-idle')?.addEventListener('click', () => onBack && onBack());
  container.querySelector('#export-inventory')?.addEventListener('click', () => onExport && onExport());
  container.querySelector('#view-inventory')?.addEventListener('click', () => onView && onView());
  container.querySelector('#add-item')?.addEventListener('click', () => onAddItem && onAddItem());
  container.querySelector('#add-category')?.addEventListener('click', () => onAddCategory && onAddCategory());

  return container;
}

// Render the inventory list scaffold (header + search/filter + list)
// args: { parent, data, initialFilter = 'all', initialQuery = '', handlers }
// handlers: { onBack, onOpenCategory(id), onOpenItem({ id, kind, origin }), onFilterChange(val), onQueryChange(q) }
export function renderInventoryList({ parent, data, initialFilter = 'all', initialQuery = '', handlers = {} }) {
  const { onBack, onOpenCategory, onOpenItem, onFilterChange, onQueryChange } = handlers;
  const families = (data?.inventory?.spirits || []).filter(s => s.type === 'family');
  const secondaryKeys = Object.keys(data?.secondary || {});

  const container = document.createElement('div');
  container.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
      <button id="inv-back" class="secondary">Back</button>
      <h2 style="margin:0;">Inventory</h2>
    </div>
    <div style="margin-bottom:10px; display:flex; gap:8px; align-items:center;">
      <input id="inv-search" type="text" placeholder="Search..." style="flex:2; min-width:66%;">
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

  parent.innerHTML = '';
  parent.appendChild(container);

  const backBtn = container.querySelector('#inv-back');
  const filterEl = container.querySelector('#inv-filter');
  const searchEl = container.querySelector('#inv-search');
  const listEl = container.querySelector('#inv-list');

  filterEl.value = initialFilter;
  searchEl.value = initialQuery;

  const renderItems = (filterVal, query) => {
    const q = (query || '').toLowerCase();
    let out = '<ul style="list-style:none; padding:0;">';

    const pushItem = (obj) => {
      const isActive = obj.in_rotation !== false;
      const cls = isActive ? 'open-item' : 'open-item inv-deprecated';
      out += `<li><button class="${cls}" data-kind="${obj.kind}" data-origin="${obj.origin}" data-id="${obj.id}">${obj.name}</button></li>`;
    };

    if (q) {
      Object.keys(data.subpools || {}).forEach(sp => {
        (data.subpools[sp] || []).forEach(it => {
          if ((it.name || '').toLowerCase().includes(q)) pushItem({ kind: 'sub', origin: sp, id: it.id, name: it.name, in_rotation: it.in_rotation });
        });
      });
      (data.inventory?.mixers || []).forEach(m => {
        if ((m.name || '').toLowerCase().includes(q)) pushItem({ kind: 'mixers', origin: 'mixers', id: m.id, name: m.name, in_rotation: m.in_rotation });
      });
      (data.inventory?.additives || []).forEach(a => {
        if ((a.name || '').toLowerCase().includes(q)) pushItem({ kind: 'additives', origin: 'additives', id: a.id, name: a.name, in_rotation: a.in_rotation });
      });
      Object.keys(data.secondary || {}).forEach(sk => {
        (data.secondary[sk] || []).forEach(it => {
          if ((it.name || '').toLowerCase().includes(q)) pushItem({ kind: 'sec', origin: sk, id: it.id, name: it.name, in_rotation: it.in_rotation });
        });
      });
    } else if (filterVal === 'mixers') {
      (data.inventory?.mixers || []).slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(m => pushItem({ kind: 'mixers', origin: 'mixers', id: m.id, name: m.name, in_rotation: m.in_rotation }));
    } else if (filterVal === 'additives') {
      (data.inventory?.additives || []).slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(a => pushItem({ kind: 'additives', origin: 'additives', id: a.id, name: a.name, in_rotation: a.in_rotation }));
    } else if (filterVal && filterVal.startsWith('sub.')) {
      (data.subpools[filterVal] || []).slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(it => pushItem({ kind: 'sub', origin: filterVal, id: it.id, name: it.name, in_rotation: it.in_rotation }));
    } else if (filterVal && filterVal.startsWith('sec.')) {
      (data.secondary[filterVal] || []).slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(it => pushItem({ kind: 'sec', origin: filterVal, id: it.id, name: it.name, in_rotation: it.in_rotation }));
    } else {
      const categories = [
        ...(families.map(f => ({ id: f.subpool_id, label: f.name, kind: 'sub' }))),
        ...(secondaryKeys.map(k => ({ id: k, label: toTitle(k.split('.')[1] || k), kind: 'sec' })))
      ].sort((a,b) => a.label.localeCompare(b.label));
      categories.forEach(c => {
        out += `<li><button class="open-cat" data-id="${c.id}">${c.label}</button></li>`;
      });
    }

    out += '</ul>';
    listEl.innerHTML = out;

    listEl.querySelectorAll('.open-cat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (onOpenCategory) onOpenCategory(id);
      });
    });
    listEl.querySelectorAll('.open-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const kind = e.currentTarget.getAttribute('data-kind');
        const origin = e.currentTarget.getAttribute('data-origin');
        if (onOpenItem) onOpenItem({ id, kind, origin });
      });
    });
  };

  backBtn?.addEventListener('click', () => onBack && onBack({ filter: filterEl.value, query: searchEl.value }));
  filterEl?.addEventListener('change', () => {
    const v = filterEl.value;
    if (onFilterChange) onFilterChange(v);
    renderItems(v, searchEl.value.trim());
  });
  searchEl?.addEventListener('input', () => {
    const q = searchEl.value.trim();
    if (onQueryChange) onQueryChange(q);
    renderItems(filterEl.value, q);
  });

  // Initial render
  renderItems(initialFilter, initialQuery);

  return { container, filterEl, searchEl, listEl, renderItems };
}

// Render item detail view (name + Deprecate/Restore toggle)
// args: { parent, ctx: { item, originKind, originId }, handlers: { onBack, onToggle } }
export function renderInventoryItemDetail({ parent, ctx, handlers = {} }) {
  const { onBack, onToggle } = handlers;
  const { item, originKind, originId } = ctx || {};
  const faded = (on) => on ? '' : 'style="opacity:0.5"';
  const container = document.createElement('div');
  container.innerHTML = `
    <div style="margin-bottom:8px;"><button id="detail-back" class="secondary">Back</button></div>
    <div ${faded(item?.in_rotation)}>
      <h3 style="margin:4px 0;">${item?.name || ''}</h3>
      <button id="detail-toggle">${item?.in_rotation ? 'Deprecate' : 'Restore'}</button>
    </div>
  `;
  parent.innerHTML = '';
  parent.appendChild(container);

  container.querySelector('#detail-back')?.addEventListener('click', () => onBack && onBack());
  container.querySelector('#detail-toggle')?.addEventListener('click', () => onToggle && onToggle({ item, originKind, originId }));

  return container;
}

// Show Add Item modal (returns a function to close)
// args: { data, handlers: { onCancel, onSave({ type, name, familyId?, subpoolId? }) } }
export function showAddItemModal({ data, handlers = {} }) {
  const { onCancel, onSave } = handlers;
  const families = (data?.inventory?.spirits || []).filter(s => s.type === 'family');
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="add-item-modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000;">
      <div style="background:#222; padding:16px; border-radius:8px; width:90%; max-width:520px;">
        <h3>Add Item</h3>
        <label>Type:
          <select id="new-type">
            <option value="spirit">Spirit</option>
            <option value="mixers">Mixer</option>
            <option value="additives">Additive</option>
          </select>
        </label>
        <div id="family-wrap" style="margin-top:8px; display:block;">
          <label>Family:
            <select id="new-family">
              ${families.map(f => `<option value="${f.id}|${f.subpool_id}">${f.name}</option>`).join('')}
            </select>
          </label>
        </div>
        <label style="display:block; margin-top:8px;">Name: <input id="new-name" type="text" placeholder="e.g., Jim Beam"></label>
        <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end;">
          <button id="new-cancel">Cancel</button>
          <button id="new-save" class="primary">Save</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap.firstElementChild);

  const modal = document.getElementById('add-item-modal');
  const typeEl = modal.querySelector('#new-type');
  const famWrap = modal.querySelector('#family-wrap');
  const famSelect = modal.querySelector('#new-family');

  const onTypeChange = () => { famWrap.style.display = typeEl.value === 'spirit' ? 'block' : 'none'; };
  typeEl.addEventListener('change', onTypeChange);
  onTypeChange();

  const close = () => { document.getElementById('add-item-modal')?.remove(); };
  modal.querySelector('#new-cancel')?.addEventListener('click', () => { close(); onCancel && onCancel(); });
  modal.querySelector('#new-save')?.addEventListener('click', () => {
    const t = typeEl.value;
    const name = (modal.querySelector('#new-name').value || '').trim();
    if (!name) return;
    if (t === 'spirit') {
      const val = famSelect.value; // e.g., spirits.whiskey|sub.whiskey
      const [familyId, subpoolId] = (val || '').split('|');
      onSave && onSave({ type: t, name, familyId, subpoolId, id: `${(familyId || '').split('.')[1]}.${slugify(name)}` });
    } else if (t === 'mixers') {
      onSave && onSave({ type: t, name, id: `mixers.${slugify(name)}` });
    } else if (t === 'additives') {
      onSave && onSave({ type: t, name, id: `add.${slugify(name)}` });
    }
    close();
  });

  return close;
}

// Show Add Category modal (returns a function to close)
// args: { handlers: { onCancel, onSave({ under, name, familyId?, subpoolId?, poolId? }) } }
export function showAddCategoryModal({ handlers = {} }) {
  const { onCancel, onSave } = handlers;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="add-category-modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000;">
      <div style="background:#222; padding:16px; border-radius:8px; width:90%; max-width:520px;">
        <h3>Add Category</h3>
        <label>Under:
          <select id="cat-under">
            <option value="spirit">Spirit</option>
            <option value="secondary">Secondary</option>
          </select>
        </label>
        <label style="display:block; margin-top:8px;">Name: <input id="cat-name" type="text" placeholder="e.g., Whiskey"></label>
        <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end;">
          <button id="cat-cancel">Cancel</button>
          <button id="cat-save" class="primary">Save</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap.firstElementChild);

  const modal = document.getElementById('add-category-modal');
  const close = () => { document.getElementById('add-category-modal')?.remove(); };
  modal.querySelector('#cat-cancel')?.addEventListener('click', () => { close(); onCancel && onCancel(); });
  modal.querySelector('#cat-save')?.addEventListener('click', () => {
    const under = (modal.querySelector('#cat-under').value || 'spirit');
    const name = (modal.querySelector('#cat-name').value || '').trim();
    if (!name) return;
    if (under === 'spirit') {
      const key = slugify(name);
      const familyId = `spirits.${key}`;
      const subpoolId = `sub.${key}`;
      onSave && onSave({ under, name, familyId, subpoolId });
    } else if (under === 'secondary') {
      const key = slugify(name);
      const poolId = `sec.${key}`;
      onSave && onSave({ under, name, poolId });
    }
    close();
  });

  return close;
}

