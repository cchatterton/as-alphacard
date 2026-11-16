(function () {
    'use strict';

    const blockSelector = '.acf-block-fields[data-block-id]';
    const rowSelector = '.acf-field[data-key="field_alphacard_cards"] .acf-row:not(.acf-clone)';
    const mountedBlocks = new WeakSet();
    const mountedRows = new WeakSet();
    const adoptedBlocks = new WeakSet();
    const tokenCache = new WeakMap();
    const requests = new WeakMap();
    let inputNumber = 0;

    function field(container, key) {
        return container.querySelector('.acf-field[data-key="' + key + '"]');
    }

    function rows(block) {
        return Array.from(block.querySelectorAll(rowSelector));
    }

    function asId(value) {
        if (Array.isArray(value)) value = value[0];
        if (value && typeof value === 'object') value = value.ID || value.id;
        return /^\d+$/.test(String(value)) ? Number(value) : 0;
    }

    function selectedCardId(cardField) {
        if (!cardField) return 0;
        if (window.acf && window.acf.getField && window.jQuery) {
            const model = window.acf.getField(window.jQuery(cardField));
            if (model && typeof model.val === 'function') {
                const id = asId(model.val());
                if (id) return id;
            }
        }
        for (const input of cardField.querySelectorAll('.acf-input select[name], .acf-input input[type="hidden"][name]')) {
            const id = asId(input.value);
            if (id) return id;
        }
        return 0;
    }

    function cardId(block) {
        return selectedCardId(field(block, 'field_alphacard_card'));
    }

    function storage(row) {
        const valueField = field(row, 'field_alphacard_item_token_values');
        return valueField && valueField.querySelector('textarea');
    }

    function readState(row) {
        try {
            const state = JSON.parse(storage(row).value || '{}');
            return state && typeof state === 'object' && !Array.isArray(state) ? state : {};
        } catch (_) {
            return {};
        }
    }

    function saveState(row, state) {
        const input = storage(row);
        input.value = JSON.stringify(state);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function feedback(container, message) {
        const status = container.querySelector('.alphacard-status');
        if (status) status.textContent = message;
    }

    function addValueRow(container, token, value, editable) {
        const wrapper = document.createElement('div');
        wrapper.className = editable ? 'alphacard-token-row' : 'alphacard-nonmatching-row';
        const label = document.createElement('label');
        const input = document.createElement('textarea');
        input.id = 'alphacard-value-' + (++inputNumber);
        input.rows = 2;
        input.value = value;
        label.htmlFor = input.id;
        label.textContent = '%%' + token + '%%';
        if (editable) {
            input.className = 'alphacard-token-value';
            input.dataset.token = token;
        } else {
            input.readOnly = true;
        }
        wrapper.append(label, input);
        container.append(wrapper);
    }

    function renderState(row, state) {
        const active = row.querySelector('.alphacard-tokens');
        const unmatched = row.querySelector('.alphacard-nonmatching');
        active.replaceChildren();
        unmatched.replaceChildren();
        const tokens = Array.isArray(state.tokens) ? state.tokens : [];
        const values = state.values && typeof state.values === 'object' ? state.values : {};
        tokens.forEach(function (token) {
            addValueRow(active, token, typeof values[token] === 'string' ? values[token] : '', true);
        });
        const leftovers = state.unmatched && typeof state.unmatched === 'object' ? state.unmatched : {};
        const names = Object.keys(leftovers).filter(function (token) { return leftovers[token] !== ''; });
        unmatched.hidden = names.length === 0;
        if (names.length) {
            const heading = document.createElement('h4');
            heading.textContent = 'Non-matching content';
            const instructions = document.createElement('p');
            instructions.textContent = 'These values are kept for copying into the selected Card.';
            unmatched.append(heading, instructions);
            names.forEach(function (token) { addValueRow(unmatched, token, String(leftovers[token]), false); });
        }
        feedback(row, tokens.length
            ? tokens.length + ' merge token' + (tokens.length === 1 ? '' : 's') + ' ready.'
            : 'The selected Card has no merge tokens.');
    }

    function reconcileRow(row, id, tokens) {
        const previous = readState(row);
        if (Number(previous.card) === id && Array.isArray(previous.tokens)
            && JSON.stringify(previous.tokens) === JSON.stringify(tokens) && previous.values) {
            renderState(row, previous);
            return;
        }
        const pool = Object.assign(Object.create(null), previous.unmatched || {}, previous.values || {});
        const values = Object.create(null);
        const unmatched = Object.create(null);
        tokens.forEach(function (token) {
            values[token] = Object.prototype.hasOwnProperty.call(pool, token) ? String(pool[token]) : '';
        });
        Object.keys(pool).forEach(function (token) {
            if (!tokens.includes(token) && pool[token] !== '') unmatched[token] = String(pool[token]);
        });
        const state = { card: id, tokens: tokens, values: values, unmatched: unmatched };
        saveState(row, state);
        renderState(row, state);
    }

    function mountRow(row) {
        if (mountedRows.has(row)) return false;
        const content = field(row, 'field_alphacard_item_merge_tokens');
        const input = storage(row);
        if (!content || !input) return false;
        mountedRows.add(row);
        input.closest('.acf-field').style.display = 'none';
        const status = document.createElement('p');
        status.className = 'alphacard-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        const active = document.createElement('div');
        active.className = 'alphacard-tokens';
        const unmatched = document.createElement('div');
        unmatched.className = 'alphacard-nonmatching';
        unmatched.hidden = true;
        content.querySelector('.acf-input').append(status, active, unmatched);
        const state = readState(row);
        if (Array.isArray(state.tokens)) {
            renderState(row, state);
        } else {
            feedback(row, 'Select a Card above to load its merge tokens.');
        }
        return true;
    }

    function refreshBlock(block, force) {
        const id = cardId(block);
        if (!id) {
            feedback(field(block, 'field_alphacard_merge_tokens'), 'Select a Card first.');
            return;
        }
        const cached = tokenCache.get(block);
        if (!force && cached && cached.card === id) {
            rows(block).forEach(function (row) { reconcileRow(row, id, cached.tokens); });
            return;
        }
        const previousRequest = requests.get(block);
        if (!force && previousRequest && previousRequest.pending && previousRequest.card === id) return;
        const sequence = previousRequest ? previousRequest.sequence + 1 : 1;
        requests.set(block, { card: id, sequence: sequence, pending: true });
        const action = field(block, 'field_alphacard_merge_tokens');
        const link = action.querySelector('.alphacard-fetch');
        link.setAttribute('aria-disabled', 'true');
        feedback(action, 'Finding merge tokens…');
        const body = new URLSearchParams({
            action: 'alphacard_get_merge_tokens',
            nonce: alphaCardEditor.nonce,
            card_id: String(id)
        });
        fetch(alphaCardEditor.ajaxUrl, { method: 'POST', credentials: 'same-origin', body: body })
            .then(function (response) { return response.json(); })
            .then(function (result) {
                if (requests.get(block).sequence !== sequence || cardId(block) !== id) return;
                if (!result.success) throw new Error(result.data && result.data.message || 'Unable to read the Card.');
                if (!result.data || !Array.isArray(result.data.tokens)) {
                    throw new Error('The Card returned an invalid token list. Try again.');
                }
                const tokens = result.data.tokens;
                tokenCache.set(block, { card: id, tokens: tokens });
                rows(block).forEach(function (row) { reconcileRow(row, id, tokens); });
                feedback(action, tokens.length + ' merge token' + (tokens.length === 1 ? '' : 's') + ' loaded for all Cards.');
            })
            .catch(function (error) {
                if (requests.get(block).sequence === sequence) feedback(action, error.message);
            })
            .finally(function () {
                const current = requests.get(block);
                if (current.sequence === sequence) {
                    current.pending = false;
                    link.removeAttribute('aria-disabled');
                }
            });
    }

    function adoptSavedCard(block) {
        if (cardId(block) || adoptedBlocks.has(block)) return;
        adoptedBlocks.add(block);
        const prior = rows(block).find(function (row) {
            return selectedCardId(field(row, 'field_alphacard_item_card'));
        });
        if (!prior) return;
        const oldField = field(prior, 'field_alphacard_item_card');
        const oldId = selectedCardId(oldField);
        const oldSelect = oldField.querySelector('select');
        const oldOption = oldSelect && Array.from(oldSelect.querySelectorAll('option'))
            .find(function (option) { return option.selected; });
        const sharedField = field(block, 'field_alphacard_card');
        const sharedInput = sharedField.querySelector('select, input[type="hidden"]');
        if (!sharedInput) return;
        if (sharedInput.tagName === 'SELECT') {
            Array.from(sharedInput.options).forEach(function (option) { option.selected = false; });
            const option = document.createElement('option');
            option.value = String(oldId);
            option.textContent = oldOption ? oldOption.textContent : 'Card ' + oldId;
            option.selected = true;
            sharedInput.append(option);
        } else {
            sharedInput.value = String(oldId);
        }
        window.jQuery(sharedInput).trigger('change');
    }

    function mountLegacyNotice(block) {
        const repeater = field(block, 'field_alphacard_cards');
        const oldValueField = field(block, 'field_alphacard_token_values');
        const oldValue = oldValueField && oldValueField.querySelector('textarea');
        const migratedField = field(block, 'field_alphacard_legacy_migrated');
        const migratedInput = migratedField && migratedField.querySelector('input[type="checkbox"]');
        if (migratedInput && migratedInput.checked) return;
        if (!repeater || rows(block).length || !cardId(block) || !oldValue || !oldValue.value) return;
        if (repeater.querySelector('.alphacard-migration')) return;
        const notice = document.createElement('div');
        notice.className = 'alphacard-migration notice notice-info inline';
        const description = document.createElement('p');
        description.textContent = 'This block has a saved single Card. Move its content into a row to add more Cards.';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'button alphacard-migrate';
        button.textContent = 'Move existing Card into list';
        notice.append(description, button);
        repeater.querySelector('.acf-input').prepend(notice);
    }

    function mountAll() {
        document.querySelectorAll(blockSelector).forEach(function (block) {
            const firstMount = !mountedBlocks.has(block);
            if (firstMount) {
                mountedBlocks.add(block);
                const action = field(block, 'field_alphacard_merge_tokens');
                if (action) {
                    const status = document.createElement('p');
                    status.className = 'alphacard-status';
                    status.setAttribute('role', 'status');
                    status.setAttribute('aria-live', 'polite');
                    action.querySelector('.acf-input').append(status);
                }
            }
            const added = rows(block).filter(mountRow);
            adoptSavedCard(block);
            mountLegacyNotice(block);
            if (firstMount || added.length) refreshBlock(block, false);
        });
    }

    function waitForNewRow(block, existing) {
        return new Promise(function (resolve, reject) {
            const repeater = field(block, 'field_alphacard_cards');
            const observer = new MutationObserver(function () {
                const added = rows(block).find(function (row) { return !existing.has(row); });
                if (added) {
                    observer.disconnect();
                    clearTimeout(timeout);
                    resolve(added);
                }
            });
            const timeout = setTimeout(function () {
                observer.disconnect();
                reject(new Error('The new Card row did not appear. Try Add Card manually.'));
            }, 3000);
            observer.observe(repeater, { childList: true, subtree: true });
        });
    }

    function migrateLegacy(block, button) {
        const oldValueField = field(block, 'field_alphacard_token_values');
        const oldValue = oldValueField && oldValueField.querySelector('textarea');
        const repeater = field(block, 'field_alphacard_cards');
        const addButton = repeater && repeater.querySelector('.acf-actions [data-event="add-row"]');
        if (!cardId(block) || !oldValue || !addButton) return;
        const existing = new Set(rows(block));
        button.disabled = true;
        const pending = waitForNewRow(block, existing);
        addButton.click();
        pending.then(function (row) {
            mountRow(row);
            storage(row).value = oldValue.value;
            const migratedField = field(block, 'field_alphacard_legacy_migrated');
            const migratedInput = migratedField && migratedField.querySelector('input[type="checkbox"]');
            if (migratedInput) migratedInput.checked = true;
            storage(row).dispatchEvent(new Event('change', { bubbles: true }));
            if (migratedInput) migratedInput.dispatchEvent(new Event('change', { bubbles: true }));
            const cached = tokenCache.get(block);
            if (cached && cached.card === cardId(block)) reconcileRow(row, cached.card, cached.tokens);
            const notice = button.closest('.alphacard-migration');
            if (notice) notice.remove();
        }).catch(function (error) {
            button.disabled = false;
            button.closest('.alphacard-migration').querySelector('p').textContent = error.message;
        });
    }

    document.addEventListener('click', function (event) {
        const link = event.target.closest('.alphacard-fetch');
        if (link) {
            event.preventDefault();
            const block = link.closest(blockSelector);
            if (block) refreshBlock(block, true);
            return;
        }
        const migrate = event.target.closest('.alphacard-migrate');
        if (migrate) {
            event.preventDefault();
            migrateLegacy(migrate.closest(blockSelector), migrate);
        }
    });

    document.addEventListener('input', function (event) {
        if (!event.target.matches('.alphacard-token-value')) return;
        const row = event.target.closest('.acf-row');
        if (!row) return;
        const state = readState(row);
        if (!state.values || typeof state.values !== 'object') state.values = {};
        state.values[event.target.dataset.token] = event.target.value;
        saveState(row, state);
    });

    if (window.jQuery) {
        window.jQuery(document).on('change.alphacard', '.acf-field[data-key="field_alphacard_card"] select, .acf-field[data-key="field_alphacard_card"] input[type="hidden"]', function () {
            const block = this.closest(blockSelector);
            if (block) refreshBlock(block, true);
        });
    }
    if (window.acf && window.acf.addAction) {
        window.acf.addAction('ready', mountAll);
        window.acf.addAction('append', mountAll);
    }
    document.addEventListener('DOMContentLoaded', mountAll);
    new MutationObserver(mountAll).observe(document.documentElement, { childList: true, subtree: true });
}());
