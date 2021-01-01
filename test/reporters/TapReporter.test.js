const assert = require('assert');
const { EOL } = require('os');
const TestOutputStream = require('../support/TestOutputStream');
const { passingTest, failingTest, skippedTest, fail } = require('../support/helpers');
const { TapReporter, Harness, Suite, Test, Hook } = require('../..');

describe('Tap Reporter', () => {

  it('should report TAP version', async () => {
    const suite = new Suite('Suite');
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[0], 'TAP version 13');
  });

  it('should report test plan when there are no tests', async () => {
    const suite = new Suite('Suite');
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[1], '1..0');
  });

  it('should report test plan when there are some tests', async () => {
    const test = passingTest();
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[1], '1..1');
  });

  it('should report test plan when there is a nested suite', async () => {
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const suite1 = new Suite('Suite 1').add(test1, test2);
    const suite2 = new Suite('Suite 2').add(test3);
    const suite3 = new Suite('Suite 3').add(suite1, suite2);
    const harness = new Harness(suite3);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[2], 'ok 1 - Suite 3 / Suite 1 / Test 1');
    assert.equal(lines[3], 'ok 2 - Suite 3 / Suite 1 / Test 2');
    assert.equal(lines[4], 'ok 3 - Suite 3 / Suite 2 / Test 3');
  });

  it('should report passing tests', async () => {
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const suite = new Suite('Suite').add(test1, test2, test3);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[2], 'ok 1 - Suite / Test 1');
    assert.equal(lines[3], 'ok 2 - Suite / Test 2');
    assert.equal(lines[4], 'ok 3 - Suite / Test 3');
  });

  it('should report failing tests', async () => {
    const test1 = failingTest('Test 1');
    const test2 = failingTest('Test 2');
    const test3 = failingTest('Test 3');
    const suite = new Suite('Suite').add(test1, test2, test3);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[2], 'not ok 1 - Suite / Test 1');
    assert.equal(lines[3], '# Error: Oh Noes!');
    assert.match(lines[4], /^# {5}at fail \(.*\)/);
    assert.match(lines[5], /^# {5}at failingTest \(.*\)/);
  });

  it('should prefix each error messages line with a # ', async () => {
    const test = new Test('Test', fail({ error: new Error(`Oh${EOL}Noes!`) }));
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[2], 'not ok 1 - Suite / Test');
    assert.equal(lines[3], '# Error: Oh');
    assert.equal(lines[4], '# Noes!');
  });

  it('should output skipped tests', async () => {
    const test1 = skippedTest('Test 1');
    const test2 = skippedTest('Test 2', 'A good reason');
    const test3 = skippedTest('Test 3', 'Meh');
    const suite = new Suite('Suite').add(test1, test2, test3);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[2], 'ok 1 - Suite / Test 1 # skip No reason given');
    assert.equal(lines[3], 'ok 2 - Suite / Test 2 # skip A good reason');
    assert.equal(lines[4], 'ok 3 - Suite / Test 3 # skip Meh');
  });

  it('should output skipped suites', async () => {
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const suite = new Suite('Suite', { skip: true, reason: 'Whatever' }).add(test1, test2, test3);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[2], 'ok 1 - Suite / Test 1 # skip Whatever');
    assert.equal(lines[3], 'ok 2 - Suite / Test 2 # skip Whatever');
    assert.equal(lines[4], 'ok 3 - Suite / Test 3 # skip Whatever');
  });

  it('should output before hook errors', async () => {
    const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const suite = new Suite('Suite').before(hook).add(test1, test2, test3);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[2], '# Error: Oh Noes!');
  });

});

