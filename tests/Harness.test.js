const assert = require('assert');
const { describe, NullReporter, Harness, Suite, Test } = require('..');

describe('Harnesses', ({ it }) => {

  const reporter = new NullReporter();

  it('should run a test suite', async () => {
    const test1 = new Test('should run test 1', pass);
    const test2 = new Test('should run test 2', pass);
    const suite = new Suite('Test Suite').add(test1, test2);
    const harness = new Harness().set(suite);

    await harness.run(reporter);

    assert.equal(harness.passed, true);
  });

  it('should run an individual test', async () => {
    const test = new Test('should run test', pass);
    const harness = new Harness().set(test);

    await harness.run(reporter);

    assert.equal(harness.passed, true);
  });
});

function pass() {
  return Promise.resolve();
}


