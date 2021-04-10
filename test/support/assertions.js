const assert = require('assert');

assert.stats = (actual, expected = {}) => {
  assert.strictEqual(actual.tests, expected.tests || 0);
  assert.strictEqual(actual.passed, expected.passed || 0);
  assert.strictEqual(actual.failed, expected.failed || 0);
  assert.strictEqual(actual.skipped, expected.skipped || 0);
  assert.ok(actual.duration >= (expected.duration || 0));
};
