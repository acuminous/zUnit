const assert = require('assert');
const TestOutputStream = require('../support/TestOutputStream');
const { passingTest, failingTest, skippedTest } = require('../support/fixtures');
const { describe, TapReporter, Harness, Suite } = require('../..');

describe('Tap Reporter', ({ it }) => {

  it('should report TAP version', async () => {
    const suite = new Suite('Test Suite');
    const harness = new Harness().set(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[0], 'TAP version 13');
  });

  it('should report test plan when there are no tests', async () => {
    const suite = new Suite('Test Suite');
    const harness = new Harness().set(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[1], '1..0');
  });

  it('should report test plan when there are some tests', async () => {
    const test = passingTest();
    const suite = new Suite('Test Suite').add(test);
    const harness = new Harness().set(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[1], '1..1');
  });

  it('should report passing tests', async () => {
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const suite = new Suite('Test Suite').add(test1, test2, test3);
    const harness = new Harness().set(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[2], 'ok 1 - Test Suite / Test 1');
    assert.equal(lines[3], 'ok 2 - Test Suite / Test 2');
    assert.equal(lines[4], 'ok 3 - Test Suite / Test 3');
  });

  it('should report failing tests', async () => {
    const test1 = failingTest('Test 1');
    const test2 = failingTest('Test 2');
    const test3 = failingTest('Test 3');
    const suite = new Suite('Test Suite').add(test1, test2, test3);
    const harness = new Harness().set(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[2], 'not ok 1 - Test Suite / Test 1');
    assert.equal(lines[3], 'not ok 2 - Test Suite / Test 2');
    assert.equal(lines[4], 'not ok 3 - Test Suite / Test 3');
  });

  it('should output skipped tests', async () => {
    const test1 = skippedTest('Test 1');
    const test2 = skippedTest('Test 2', 'Mercy');
    const test3 = skippedTest('Test 3', 'Meh');
    const suite = new Suite('Test Suite').add(test1, test2, test3);
    const harness = new Harness().set(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[2], 'ok 1 - Test Suite / Test 1 # skip No reason given');
    assert.equal(lines[3], 'ok 2 - Test Suite / Test 2 # skip Mercy');
    assert.equal(lines[4], 'ok 3 - Test Suite / Test 3 # skip Meh');
  });

  it('should output skipped suites', async () => {
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const suite = new Suite('Test Suite', { skip: true, reason: 'Mercy' }).add(test1, test2, test3);
    const harness = new Harness().set(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[2], 'ok 1 - Test Suite / Test 1 # skip Mercy');
    assert.equal(lines[3], 'ok 2 - Test Suite / Test 2 # skip Mercy');
    assert.equal(lines[4], 'ok 3 - Test Suite / Test 3 # skip Mercy');
  });

});

