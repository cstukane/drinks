// backups/rollFlows.backup.js
// Snapshot of roll flow state implementations at time of refactor.
// This file is not imported by the app; retained for reference.

/* ROLL_SPIRITS (snapshot) */
function createRollSpiritsState_Backup() {
  return {
    enter: async () => {
      console.log('Entering ROLL_SPIRITS state');
      const appContainer = document.getElementById('app-container');
      const panel = document.getElementById('dev-validations-panel');
      if (panel) panel.style.display = 'none';
      const currData = window.getData ? await window.getData() : null;

      const allSpirits = ((currData && currData.inventory?.spirits) || []).filter(spirit => spirit.type !== 'family' && spirit.in_rotation);

      let spiritList = '';
      allSpirits.forEach((spirit, index) => {
        spiritList += `<div class="option" data-id="${spirit.id}">${index + 1}. ${spirit.name}</div>`;
      });

      appContainer.innerHTML = `
        <h2>Select ${state.recipe.numSpirits} Spirit${state.recipe.numSpirits !== 1 ? 's' : ''}</h2>
        <div class="options-container">
          <div class="option-list">${spiritList}</div>
        </div>
        <div class="roll-actions">
          <button id="roll-spirits-btn" class="primary-roll-btn" aria-label="Roll spirits">Roll</button>
          <button id="next-spirits-btn" class="primary-roll-btn" style="display:none;" aria-label="Next: confirm spirits">Next</button>
        </div>
      `;

      const rollBtn = document.getElementById('roll-spirits-btn');
      const nextBtn = document.getElementById('next-spirits-btn');
      const optionsContainer = document.querySelector('.options-container');

      const selectedSpirits = [];
      let rollCount = 0;

      rollBtn.addEventListener('click', () => {
        if (rollCount >= (state.recipe.numSpirits || 0)) return;
        const alreadyIds = new Set(selectedSpirits.map(s => s.id));
        const allowed = allSpirits
          .filter(s => !alreadyIds.has(s.id))
          .filter(s => !violatesHardBan(s, state.selectedItems || [], (currData?.rules?.hard_bans) || []));
        if (allowed.length === 0) { showNoSolutionMessage('No compatible spirits available given prior selections.'); return; }
        const joker = cryptoRoll(20) === 20;
        if (joker) {
          displayDealersChoiceForBatch('spirit', allowed, (pick) => {
            const el = optionsContainer.querySelector(`[data-id="${pick.id}"]`);
            if (el && !el.classList.contains('highlighted')) {
              el.classList.add('highlighted');
              selectedSpirits.push(pick);
              rollCount++;
              if (rollCount >= state.recipe.numSpirits) { rollBtn.style.display = 'none'; nextBtn.style.display = 'inline-block'; }
            }
          });
        } else {
          const pick = softWeightedPick(allowed, state.selectedItems || [], (currData || {}).rules || {});
          const pickedEl = optionsContainer.querySelector(`[data-id="${pick.id}"]`);
          if (pickedEl && !pickedEl.classList.contains('highlighted')) {
            pickedEl.classList.add('highlighted');
            selectedSpirits.push(pick);
            rollCount++;
          }
        }
        if (rollCount >= state.recipe.numSpirits) { rollBtn.style.display = 'none'; nextBtn.style.display = 'inline-block'; }
      });

      nextBtn.addEventListener('click', () => {
        const selectedOptions = document.querySelectorAll('.option.highlighted');
        selectedOptions.forEach(option => highlightAndSlideUp(option, () => {}));
        setTimeout(() => {
          state.recipe.spirits = selectedSpirits;
          state.selectedItems.push(...selectedSpirits);
          addProgressStep(`${selectedSpirits.length} Spirits`);
          transitionTo('ROLL_MIXERS');
        }, 500);
      });
    }
  };
}

/* ROLL_MIXERS (snapshot) */
function createRollMixersState_Backup() {
  return {
    enter: async () => {
      console.log('Entering ROLL_MIXERS state');
      const appContainer = document.getElementById('app-container');
      const panel = document.getElementById('dev-validations-panel');
      if (panel) panel.style.display = 'none';
      const currData = window.getData ? await window.getData() : null;
      const allMixers = ((currData && currData.inventory?.mixers) || []).filter(m => m.in_rotation);
      let mixerList = '';
      allMixers.forEach((mixer, index) => {
        mixerList += `<div class=\"option\" data-id=\"${mixer.id}\">${index + 1}. ${mixer.name}</div>`;
      });
      appContainer.innerHTML = `
        <h2>Select ${state.recipe.numMixers} Mixer${state.recipe.numMixers !== 1 ? 's' : ''}</h2>
        <div class=\"options-container\">
          <div class=\"option-list\">${mixerList}</div>
        </div>
        <div class=\"roll-actions\">
          <button id=\"roll-mixers-btn\" class=\"primary-roll-btn\" aria-label=\"Roll mixers\">Roll</button>
          <button id=\"next-mixers-btn\" class=\"primary-roll-btn\" style=\"display:none;\" aria-label=\"Next: confirm mixers\">Next</button>
        </div>
      `;
      const rollBtn = document.getElementById('roll-mixers-btn');
      const nextBtn = document.getElementById('next-mixers-btn');
      const optionsContainer = document.querySelector('.options-container');
      const selectedMixers = [];
      let rollCount = 0;
      rollBtn.addEventListener('click', () => {
        if (rollCount >= (state.recipe.numMixers || 0)) return;
        const alreadyIds = new Set(selectedMixers.map(s => s.id));
        const allowed = allMixers
          .filter(s => !alreadyIds.has(s.id))
          .filter(s => !violatesHardBan(s, state.selectedItems || [], (currData?.rules?.hard_bans) || []));
        if (allowed.length === 0) { showNoSolutionMessage('No compatible mixers available given prior selections.'); return; }
        const joker = cryptoRoll(20) === 20;
        if (joker) {
          displayDealersChoiceForBatch('mixer', allowed, (pick) => {
            const el = optionsContainer.querySelector(`[data-id="${pick.id}"]`);
            if (el && !el.classList.contains('highlighted')) {
              el.classList.add('highlighted');
              selectedMixers.push(pick);
              rollCount++;
              if (rollCount >= state.recipe.numMixers) { rollBtn.style.display = 'none'; nextBtn.style.display = 'inline-block'; }
            }
          });
        } else {
          const pick = softWeightedPick(allowed, state.selectedItems || [], (currData || {}).rules || {});
          const pickedEl = optionsContainer.querySelector(`[data-id="${pick.id}"]`);
          if (pickedEl && !pickedEl.classList.contains('highlighted')) {
            pickedEl.classList.add('highlighted');
            selectedMixers.push(pick);
            rollCount++;
          }
        }
        if (rollCount >= state.recipe.numMixers) { rollBtn.style.display = 'none'; nextBtn.style.display = 'inline-block'; }
      });
      nextBtn.addEventListener('click', () => {
        const selectedOptions = document.querySelectorAll('.option.highlighted');
        selectedOptions.forEach(option => highlightAndSlideUp(option, () => {}));
        setTimeout(() => {
          state.recipe.mixers = selectedMixers;
          state.selectedItems.push(...selectedMixers);
          addProgressStep(`${selectedMixers.length} Mixers`);
          transitionTo('ROLL_ADDITIVES');
        }, 500);
      });
    }
  };
}

/* ROLL_ADDITIVES (snapshot) */
function createRollAdditivesState_Backup() {
  return {
    enter: async () => {
      console.log('Entering ROLL_ADDITIVES state');
      const appContainer = document.getElementById('app-container');
      const panel = document.getElementById('dev-validations-panel');
      if (panel) panel.style.display = 'none';
      const currData = window.getData ? await window.getData() : null;
      const allAdditives = ((currData && currData.inventory?.additives) || []).filter(a => a.in_rotation);
      let additiveList = '';
      allAdditives.forEach((a, index) => {
        additiveList += `<div class=\"option\" data-id=\"${a.id}\">${index + 1}. ${a.name}</div>`;
      });
      appContainer.innerHTML = `
        <h2>Select ${state.recipe.numAdditives} Additive${state.recipe.numAdditives !== 1 ? 's' : ''}</h2>
        <div class=\"options-container\">
          <div class=\"option-list\">${additiveList}</div>
        </div>
        <div class=\"roll-actions\">
          <button id=\"roll-additives-btn\" class=\"primary-roll-btn\" aria-label=\"Roll additives\">Roll</button>
          <button id=\"next-additives-btn\" class=\"primary-roll-btn\" style=\"display:none;\" aria-label=\"Next: confirm additives\">Next</button>
        </div>
      `;
      const rollBtn = document.getElementById('roll-additives-btn');
      const nextBtn = document.getElementById('next-additives-btn');
      const optionsContainer = document.querySelector('.options-container');
      const selectedAdditives = [];
      let rollCount = 0;
      rollBtn.addEventListener('click', () => {
        if (rollCount >= (state.recipe.numAdditives || 0)) return;
        const alreadyIds = new Set(selectedAdditives.map(a => a.id));
        const allowed = allAdditives
          .filter(a => !alreadyIds.has(a.id))
          .filter(a => !violatesHardBan(a, state.selectedItems || [], (currData?.rules?.hard_bans) || []));
        if (allowed.length === 0) { showNoSolutionMessage('No compatible additives available given prior selections.'); return; }
        const joker = cryptoRoll(20) === 20;
        if (joker) {
          displayDealersChoiceForBatch('additive', allowed, (pick) => {
            const el = optionsContainer.querySelector(`[data-id="${pick.id}"]`);
            if (el && !el.classList.contains('highlighted')) {
              el.classList.add('highlighted');
              selectedAdditives.push(pick);
              rollCount++;
              if (rollCount >= state.recipe.numAdditives) { rollBtn.style.display = 'none'; nextBtn.style.display = 'inline-block'; }
            }
          });
        } else {
          const pick = softWeightedPick(allowed, state.selectedItems || [], (currData || {}).rules || {});
          const pickedEl = optionsContainer.querySelector(`[data-id="${pick.id}"]`);
          if (pickedEl && !pickedEl.classList.contains('highlighted')) {
            pickedEl.classList.add('highlighted');
            selectedAdditives.push(pick);
            rollCount++;
          }
        }
        if (rollCount >= state.recipe.numAdditives) { rollBtn.style.display = 'none'; nextBtn.style.display = 'inline-block'; }
      });
      nextBtn.addEventListener('click', () => {
        const selectedOptions = document.querySelectorAll('.option.highlighted');
        selectedOptions.forEach(option => highlightAndSlideUp(option, () => {}));
        setTimeout(() => {
          state.recipe.additives = selectedAdditives;
          state.selectedItems.push(...selectedAdditives);
          addProgressStep(`${selectedAdditives.length} Additives`);
          const mixersReq = (state.recipe.mixers || []).filter(m => m.requires_secondary);
          const mixersSec = (state.recipe.secondaries || []).filter(s => s.parentType === 'mixer');
          const addsReq = (state.recipe.additives || []).filter(a => a.requires_secondary);
          const addsSec = (state.recipe.secondaries || []).filter(s => s.parentType === 'additive');
          if (mixersReq.length > mixersSec.length || addsReq.length > addsSec.length) {
            transitionTo('PICK_SECONDARY');
          } else {
            transitionTo('RECIPE');
          }
        }, 500);
      });
    }
  };
}

