import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { inventory } from './inventory.mjs';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];

// Run the page's own script against only the DOM surface it uses.
async function loadPage() {
  const handlers = {};
  const form = {
    elements: {
      search: { value: '' },
      low: { checked: false, addEventListener: (type, handler) => { handlers[type] = handler; } },
    },
    addEventListener: (type, handler) => { handlers[type] = handler; },
  };
  const tbody = { children: [], replaceChildren(...children) { this.children = children; } };
  const summary = { textContent: '' };
  const empty = { hidden: true };
  const nodes = { form, tbody, '#summary': summary, '#empty': empty };
  await runInNewContext(`(async () => { ${script} })()`, {
    fetch: async () => ({ ok: true, json: async () => inventory }),
    document: {
      querySelector: selector => nodes[selector],
      createElement: () => ({ children: [], append(child) { this.children.push(child); } }),
    },
  });
  return { form, handlers, tbody, summary, empty };
}

for (const [name, query, low, expectedRows, expectedSummary] of [
  ['default', '', false, [['Notebook', '10'], ['Pencil', '0'], ['Eraser', '4']], '3 items \u00b7 14 units'],
  ['single Notebook', '  nOtEbOoK  ', false, [['Notebook', '10']], '1 item \u00b7 10 units'],
  ['partial search', '  BOOK  ', false, [['Notebook', '10']], '1 item \u00b7 10 units'],
  ['no matches', 'missing', false, [], '0 items \u00b7 0 units'],
  ['low stock', '', true, [['Pencil', '0']], '1 item \u00b7 0 units'],
  ['composed filters', 'Notebook', true, [], '0 items \u00b7 0 units'],
  ['whitespace search', '   ', false, [['Notebook', '10'], ['Pencil', '0'], ['Eraser', '4']], '3 items \u00b7 14 units'],
]) {
  test(`page summary: ${name}`, async () => {
    const page = await loadPage();
    page.form.elements.search.value = query;
    page.form.elements.low.checked = low;
    if (low) page.handlers.change();
    else page.handlers.submit({ preventDefault() {} });
    assert.equal(page.summary.textContent, expectedSummary);
    const rows = Array.from(page.tbody.children, row => Array.from(row.children, cell => cell.textContent));
    assert.deepEqual(rows, expectedRows);
    assert.equal(page.empty.hidden, expectedRows.length !== 0);
  });
}
