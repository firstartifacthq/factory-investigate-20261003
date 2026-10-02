import test from 'node:test';
import assert from 'node:assert/strict';
import { inventory, selectInventory } from './inventory.mjs';
test('complete inventory has three items and fourteen units', () => {
  assert.equal(inventory.length, 3);
  assert.equal(inventory.reduce((total, item) => total + item.units, 0), 14);
});
test('search ignores case and surrounding whitespace', () => assert.deepEqual(selectInventory('  BOOK  '), [{name:'Notebook', units:10}]));
test('low stock contains the unavailable item', () => assert.deepEqual(selectInventory('', true), [{name:'Pencil', units:0}]));
test('unknown search is empty', () => assert.deepEqual(selectInventory('missing'), []));
test('filters compose without changing the source', () => { assert.deepEqual(selectInventory('eraser', true), []); assert.equal(inventory.length, 3); });
