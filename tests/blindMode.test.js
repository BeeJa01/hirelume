const { test } = require('node:test');
const assert = require('node:assert/strict');
const { applyBlindMode } = require('../src/services/blindMode');

test('blind-mode processing is clearly marked as unfinished', () => {
  assert.throws(applyBlindMode, /not implemented yet/);
});

test.todo('Remove candidate identifiers before analysis');
