(function () {
    'use strict';

    const selector = '.acf-block-fields[data-block-id]';

    function field(block, name) {
        return block.querySelector('.acf-field[data-name="' + name + '"]');
    }

    function cardId(block) {
        const cardField = field(block, 'card');
        if (!cardField) return 0;

        function asId(value) {
            if (Array.isArray(value)) value = value[0];
            if (value && typeof value === 'object') value = value.ID || value.id;
            return /^\d+$/.test(String(value)) ? Number(value) : 0;
        }

        // ACF's Post Object is a Select2 field. Its field model owns the
        // selected value; the first DOM select/hidden input may be empty.
        if (window.acf && window.acf.getField && window.jQuery) {
            const acfField = window.acf.getField(window.jQuery(cardField));
            if (acfField && typeof acfField.val === 'function') {
                const id = asId(acfField.val());
                if (id) return id;
            }
        }

        const inputs = cardField.querySelectorAll('.acf-input select[name], .acf-input input[type="hidden"][name]');
        for (const input of inputs) {
            const id = asId(input.value);
            if (id) return id;
        }
        return 0;
    }

    function storage(block) {
        const storageField = field(block, 'token_values');
        return storageField && storageField.querySelector('textarea');
    }

    function readState(block) {
        try {
            const state = JSON.parse(storage(block).value || '{}');
            return state && typeof state === 'object' ? state : {};
        } catch (_) {
            return {};
        }
    }

    function saveState(block, state) {
        const input = storage(block);
        input.value = JSON.stringify(state);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function feedback(block, message) {
        const status = block.querySelector('.alphacard-status');
        if (status) status.textContent = message;
    }

    function renderRows(block, state) {
        const list = block.querySelector('.alphacard-tokens');
        if (!list) return;
        list.replaceChildren();
        if (!Array.isArray(state.tokens) || !state.tokens.length) {
            feedback(block, 'No merge tokens found for this Card.');
            return;
        }
        state.tokens.forEach(function (token, index) {
            const row = document.createElement('div');
            row.className = 'alphacard-token-row';
            const label = document.createElement('label');
            const input = document.createElement('textarea');
            input.rows = 2;
            input.className = 'alphacard-token-value';
            input.dataset.token = token;
            input.id = 'alphacard-' + block.dataset.blockId.replace(/[^a-zA-Z0-9_-]/g, '') + '-' + index;
            input.value = state.values && typeof state.values[token] === 'string' ? state.values[token] : '';
            label.htmlFor = input.id;
            label.textContent = '%%' + token + '%%';
            row.append(label, input);
            list.append(row);
        });
        feedback(block, state.tokens.length + ' merge token' + (state.tokens.length === 1 ? '' : 's') + ' ready. Enter values, then save the page.');
    }

    function mount(block) {
        if (block.dataset.alphacardMounted) return;
        const action = field(block, 'merge_tokens');
        const input = storage(block);
        if (!action || !input || !field(block, 'card')) return;
        block.dataset.alphacardMounted = '1';
        input.closest('.acf-field').style.display = 'none';
        const link = action.querySelector('.alphacard-fetch');
        if (!link) return;
        const status = document.createElement('p');
        status.className = 'alphacard-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        const list = document.createElement('div');
        list.className = 'alphacard-tokens';
        link.after(status, list);
        const state = readState(block);
        if (Number(state.card) === cardId(block) && Array.isArray(state.tokens)) {
            renderRows(block, state);
        } else {
            feedback(block, 'Select a Card, then choose Get merge tokens.');
        }
    }

    function mountAll() {
        document.querySelectorAll(selector).forEach(mount);
    }

    document.addEventListener('click', function (event) {
        const link = event.target.closest('.alphacard-fetch');
        if (!link) return;
        event.preventDefault();
        const block = link.closest(selector);
        const id = cardId(block);
        if (!id) {
            feedback(block, 'Select a Card first.');
            return;
        }
        link.setAttribute('aria-disabled', 'true');
        feedback(block, 'Finding merge tokens…');
        const body = new URLSearchParams({
            action: 'alphacard_get_merge_tokens',
            nonce: alphaCardEditor.nonce,
            card_id: String(id)
        });
        fetch(alphaCardEditor.ajaxUrl, { method: 'POST', credentials: 'same-origin', body: body })
            .then(function (response) { return response.json(); })
            .then(function (result) {
                if (!result.success) throw new Error(result.data && result.data.message || 'Unable to read the Card.');
                const previous = readState(block);
                const values = {};
                result.data.tokens.forEach(function (token) {
                    values[token] = Number(previous.card) === id && previous.values && typeof previous.values[token] === 'string'
                        ? previous.values[token] : '';
                });
                const state = { card: id, tokens: result.data.tokens, values: values };
                saveState(block, state);
                renderRows(block, state);
            })
            .catch(function (error) { feedback(block, error.message); })
            .finally(function () { link.removeAttribute('aria-disabled'); });
    });

    document.addEventListener('input', function (event) {
        if (!event.target.matches('.alphacard-token-value')) return;
        const block = event.target.closest(selector);
        const state = readState(block);
        if (Number(state.card) !== cardId(block)) return;
        state.values[event.target.dataset.token] = event.target.value;
        saveState(block, state);
    });

    document.addEventListener('change', function (event) {
        if (!event.target.closest('.acf-field[data-name="card"]')) return;
        const block = event.target.closest(selector);
        if (!block) return;
        const list = block.querySelector('.alphacard-tokens');
        if (list) list.replaceChildren();
        feedback(block, 'Card changed. Choose Get merge tokens to load its fields.');
    });

    if (window.acf && window.acf.addAction) {
        window.acf.addAction('ready', mountAll);
        window.acf.addAction('append', mountAll);
    }
    document.addEventListener('DOMContentLoaded', mountAll);
    new MutationObserver(mountAll).observe(document.documentElement, { childList: true, subtree: true });
}());
