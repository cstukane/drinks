# Issues Review

## 1. Dealer's Choice method skips Rocks/Neat step
- **Location:** `js/state/flows/drinkFlow.js`
- **Problem:** When the method roll hits the Dealer's Choice joker, the flow transitions to the `METHOD_SELECTION` state. After the user manually picks a method there, the code always advances straight to the `HOW_MANY` state, even if the recipe type is a drink. Drinks are supposed to visit the `ROCKS_NEAT` step before `HOW_MANY`, so this path skips a required decision.
- **Impact:** Drink builds triggered via Joker miss the rocks vs. neat choice, breaking the defined flow and acceptance criteria.
- **Suggested Fix:** Update the `METHOD_SELECTION` state's `onNext` handler to branch like the main method state—send drinks to `ROCKS_NEAT` and shots directly to `HOW_MANY`.

## 2. Joker manual picks race the normal roll loop
- **Location:** `js/state/rollUtils.js`
- **Problem:** `rollForUniqueItemsWithJoker` invokes `onJokerPick` but immediately continues the while-loop. If the callback opens a modal and calls `commit` later, the loop keeps running and may auto-roll additional items before the user responds. When the user finally confirms, their pick is appended on top of the already-completed batch, producing duplicate or excess selections.
- **Impact:** Dealer's Choice selections can yield extra items and break uniqueness/hard-ban guarantees.
- **Suggested Fix:** Pause iteration when a joker occurs—e.g., return a promise or restructure the helper so the loop waits for the `commit` callback to resolve before continuing.

## 3. `rollForUniqueItems` crashes when app data is unset
- **File:** `js/itemUtils.js`
- **Issue:** The function assumes `data.rules.soft_rules` is always defined. In the Node test harness (and any caller that forgets to invoke `setData` first), `data` remains `undefined`, so the call to `data.rules` throws `Cannot read properties of undefined`.
- **Evidence:** Running `npm test` fails the unique-items tests with `Error: Cannot read properties of undefined (reading 'rules')`, even though the harness provides default mocks.
- **Impact:** Automated tests for unique item rolling cannot pass, and any runtime path that tries to roll items before the data layer finishes loading will crash instead of defaulting to neutral weights.
- **Suggested fix:** Guard the soft-rule lookup with a fallback (e.g., `const softRules = (data && data.rules && data.rules.soft_rules) || [];`) or require the caller to provide rules explicitly, so the helper works when the data module has not been initialized yet.