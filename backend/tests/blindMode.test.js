const { test } = require('node:test');
const assert = require('node:assert/strict');
const { applyBlindMode } = require('../src/services/blindMode');

test('blind mode removes direct and embedded candidate identifiers', () => {
  const output = applyBlindMode(
    'Ada Lovelace | ada@example.com | +44 20 7946 0958 | https://linkedin.com/in/ada | Node.js',
    { name: 'Ada Lovelace', email: 'ada@example.com', phone: '+44 20 7946 0958' },
  );
  assert.doesNotMatch(output, /Ada Lovelace|ada@example\.com|7946|linkedin\.com/i);
  assert.match(output, /Node\.js/);
});
