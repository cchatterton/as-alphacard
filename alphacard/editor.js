(function () {
    'use strict';

    const blockSelector = '.acf-block-fields[data-block-id]';
    const repeaterSelector = '.acf-field[data-key="field_alphacard_cards"]';
    const rowSelector = repeaterSelector + ' .acf-row:not(.acf-clone)';
    const mountedRows = new WeakSet();
    const requestNumbers = new WeakMap();
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

    function cardId(row) {
        return selectedCardId(field(row, 'field_alphacard_item_card'));
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

    function feedback(row, message) {
        const status = row.querySelector('.alphacard-status');
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
            instructions.textContent = 'These values are kept for copying into the new Card.';
            unmatched.append(heading, instructions);
            names.forEach(function (token) { addValueRow(unmatched, token, String(leftovers[token]), false); });
        }
        feedback(row, tokens.length
            ? tokens.length + ' merge token' + (tokens.length === 1 ? '' : 's') + ' ready. Save the page when finished.'
            : 'This Card has no merge tokens.');
    }

    function mountRow(row) {
        if (mountedRows.has(row)) return;
        const action = field(row, 'field_alphacard_item_merge_tokens');
        const input = storage(row);
        const cardField = field(row, 'field_alphacard_item_card');
        const link = action && action.querySelector('.alphacard-fetch');
        if (!link || !input || !cardField) return;
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
        link.after(status, active, unmatched);
        const state = readState(row);
        if (Number(state.card) === cardId(row) && Array.isArray(state.tokens)) {
            renderState(row, state);
        } else if (cardId(row)) {
            refreshTokens(row);
        } else {
            feedback(row, 'Select a Card to load its merge tokens.');
        }
    }

    function refreshTokens(row) {
        const id = cardId(row);
        if (!id) {
            feedback(row, 'Select a Card first.');
            return;
        }
        const requestNumber = (requestNumbers.get(row) || 0) + 1;
        requestNumbers.set(row, requestNumber);
        const link = row.querySelector('.alphacard-fetch');
        link.setAttribute('aria-disabled', 'true');
        feedback(row, 'Finding merge tokens…');
        const body = new URLSearchParams({
            action: 'alphacard_get_merge_tokens',
            nonce: alphaCardEditor.nonce,
            card_id: String(id)
        });
        fetch(alphaCardEditor.ajaxUrl, { method: 'POST', credentials: 'same-origin', body: body })
            .then(function (response) { return response.json(); })
            .then(function (result) {
                if (requestNumbers.get(row) !== requestNumber || cardId(row) !== id) return;
                if (!result.success) throw new Error(result.data && result.data.message || 'Unable to read the Card.');
                const previous = readState(row);
                if (!result.data || !Array.isArray(result.data.tokens)) {
                    throw new Error('The Card returned an invalid token list. Try again.');
                }
                const pool = Object.assign(Object.create(null), previous.unmatched || {}, previous.values || {});
                const tokens = result.data.tokens;
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
            })
            .catch(function (error) {
                if (requestNumbers.get(row) === requestNumber) feedback(row, error.message);
            })
            .finally(function () {
                if (requestNumbers.get(row) === requestNumber) link.removeAttribute('aria-disabled');
            });
    }

    function legacyCard(block) {
        return selectedCardId(field(block, 'field_alphacard_card'));
    }

    function mountLegacyNotice(block) {
        const repeater = field(block, 'field_alphacard_cards');
        if (!repeater || rows(block).length || !legacyCard(block)) return;
        if (repeater.querySelector('.alphacard-migration')) return;
        const notice = document.createElement('div');
        notice.className = 'alphacard-migration notice notice-info inline';
        const description = document.createElement('p');
        description.textContent = 'This block has a saved single Card. Move it into the list to add more Cards.';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'button alphacard-migrate';
        button.textContent = 'Move existing Card into list';
        notice.append(description, button);
        repeater.querySelector('.acf-input').prepend(notice);
    }

    function mountAll() {
        document.querySelectorAll(blockSelector).forEach(function (block) {
            rows(block).forEach(mountRow);
            mountLegacyNotice(block);
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
            observer.takeRecords();
            const added = rows(block).find(function (row) { return !existing.has(row); });
            if (added) {
                observer.disconnect();
                clearTimeout(timeout);
                resolve(added);
            }
        });
    }

    function migrateLegacy(block, button) {
        const id = legacyCard(block);
        const oldValueField = field(block, 'field_alphacard_token_values');
        const oldCardField = field(block, 'field_alphacard_card');
        const oldSelect = oldCardField && oldCardField.querySelector('select');
        const oldValue = oldValueField && oldValueField.querySelector('textarea');
        const repeater = field(block, 'field_alphacard_cards');
        const addButton = repeater && repeater.querySelector('.acf-actions [data-event="add-row"]');
        if (!id || !oldValue || !addButton) return;
        const existing = new Set(rows(block));
        button.disabled = true;
        const pending = waitForNewRow(block, existing);
        addButton.click();
        pending.then(function (row) {
            mountRow(row);
            const targetInput = storage(row);
            const targetCard = field(row, 'field_alphacard_item_card');
            const targetSelect = targetCard.querySelector('select, input[type="hidden"]');
            const oldOption = oldSelect && Array.from(oldSelect.querySelectorAll('option'))
                .find(function (option) { return option.selected; });
            const label = oldOption ? oldOption.textContent : 'Card ' + id;
            targetInput.value = oldValue.value;
            if (targetSelect.tagName === 'SELECT') {
                const option = document.createElement('option');
                option.value = String(id);
                option.textContent = label;
                option.selected = true;
                targetSelect.append(option);
            } else {
                targetSelect.value = String(id);
            }
            window.jQuery(targetSelect).trigger('change');
            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
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
            const row = link.closest('.acf-row');
            if (row) refreshTokens(row);
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
        if (Number(state.card) !== cardId(row)) return;
        state.values[event.target.dataset.token] = event.target.value;
        saveState(row, state);
    });

    if (window.jQuery) {
        window.jQuery(document).on('change.alphacard', '.acf-field[data-key="field_alphacard_item_card"] select, .acf-field[data-key="field_alphacard_item_card"] input[type="hidden"]', function () {
            const row = this.closest('.acf-row');
            if (row) refreshTokens(row);
        });
    }

    if (window.acf && window.acf.addAction) {
        window.acf.addAction('ready', mountAll);
        window.acf.addAction('append', mountAll);
    }
    document.addEventListener('DOMContentLoaded', mountAll);
    new MutationObserver(mountAll).observe(document.documentElement, { childList: true, subtree: true });
}());
