// rollBar.js
// Render helpers for roll/next controls

// Attach roll bar with roll and next buttons
export function attachRollBar({ onRoll, onNext, parent }) {
    const rollActions = document.createElement('div');
    rollActions.className = 'roll-actions';
    
    const rollBtn = document.createElement('button');
    rollBtn.id = 'roll-btn';
    rollBtn.className = 'primary-roll-btn';
    rollBtn.textContent = 'Roll';
    rollBtn.setAttribute('aria-label', 'Roll');
    rollBtn.addEventListener('click', onRoll);
    
    const nextBtn = document.createElement('button');
    nextBtn.id = 'next-btn';
    nextBtn.className = 'primary-roll-btn';
    nextBtn.textContent = 'Next';
    nextBtn.setAttribute('aria-label', 'Next');
    nextBtn.style.display = 'none';
    nextBtn.addEventListener('click', onNext);
    
    rollActions.appendChild(rollBtn);
    rollActions.appendChild(nextBtn);
    
    parent.appendChild(rollActions);
    
    return {
        rollBtn,
        nextBtn,
        showRoll: () => {
            rollBtn.style.display = 'inline-block';
            nextBtn.style.display = 'none';
        },
        showNext: () => {
            rollBtn.style.display = 'none';
            nextBtn.style.display = 'inline-block';
        }
    };
}