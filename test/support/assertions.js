const assert = require('assert');

assert.stats = (actual, expected = {}) => {
  assert.equal(actual.tests, expected.tests || 0);
  assert.equal(actual.passed, expected.passed || 0);
  assert.equal(actual.failed, expected.failed || 0);
  assert.equal(actual.skipped, expected.skipped || 0);
  assert.ok(actual.duration >= (expected.duration || 0));
};
