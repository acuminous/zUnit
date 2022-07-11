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
    assert.strictEqual(lines[0], 'TAP version 13');
  });

  it('should report test plan when there are no tests', async () => {
    const suite = new Suite('Suite');
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.strictEqual(lines[1], '1..0');
  });

  it('should report test plan when there are some tests', async () => {
    const test = passingTest();
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.strictEqual(lines[1], '1..1');
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
    assert.strictEqual(lines[2], 'ok 1 - Suite 3 / Suite 1 / Test 1');
    assert.strictEqual(lines[3], 'ok 2 - Suite 3 / Suite 1 / Test 2');
    assert.strictEqual(lines[4], 'ok 3 - Suite 3 / Suite 2 / Test 3');
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
    assert.strictEqual(lines[2], 'ok 1 - Suite / Test 1');
    assert.strictEqual(lines[3], 'ok 2 - Suite / Test 2');
    assert.strictEqual(lines[4], 'ok 3 - Suite / Test 3');
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

    assert.strictEqual(lines[lines.length - 2], 'not ok 3 - Suite / Test 3');
  });

  it('should report failing tests (non errors)', async () => {
    const test = new Test('Test', () => {
      throw 'Oh Noes!';
    });
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;

    assert.strictEqual(lines[lines.length - 3], '# Oh Noes!');
    assert.strictEqual(lines[lines.length - 2], 'not ok 1 - Suite / Test');
  });

  it('should prefix each error messages line with a # ', async () => {
    const test = new Test('Test', fail({ error: new Error(`Oh${EOL}Noes!`) }));
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.strictEqual(lines[2], '# Error: Oh');
    assert.strictEqual(lines[3], '# Noes!');
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
    assert.strictEqual(lines[2], 'ok 1 - Suite / Test 1 # skip No reason given');
    assert.strictEqual(lines[3], 'ok 2 - Suite / Test 2 # skip A good reason');
    assert.strictEqual(lines[4], 'ok 3 - Suite / Test 3 # skip Meh');
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
    assert.strictEqual(lines[2], 'ok 1 - Suite / Test 1 # skip Whatever');
    assert.strictEqual(lines[3], 'ok 2 - Suite / Test 2 # skip Whatever');
    assert.strictEqual(lines[4], 'ok 3 - Suite / Test 3 # skip Whatever');
  });

  it('should output before hook errors', async () => {
    const hook = new Hook('Hook', () => {
      throw new Error('Oh Noes!');
    });
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const suite = new Suite('Suite').before(hook).add(test1, test2, test3);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.strictEqual(lines[2], '# Error: Oh Noes!');
  });

  it('should output after hook errors', async () => {
    const hook = new Hook('Hook', () => {
      throw new Error('Oh Noes!');
    });
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const suite = new Suite('Suite').after(hook).add(test1, test2, test3);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.strictEqual(lines[5], '# Error: Oh Noes!');
  });

  it('should output multiple suite errors', async () => {
    const hook1 = new Hook('Hook', () => {
      throw new Error('Before!');
    });
    const hook2 = new Hook('Hook', () => {
      throw new Error('After!');
    });
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const suite = new Suite('Suite').before(hook1).after(hook2).add(test1, test2, test3);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines.filter((l) => /# Error:/.test(l));
    assert.strictEqual(lines[0], '# Error: Before!');
    assert.strictEqual(lines[1], '# Error: After!');
  });

  it('should output multiple test errors', async () => {
    const hook1 = new Hook('Hook', () => {
      throw new Error('Before!');
    });
    const hook2 = new Hook('Hook', () => {
      throw new Error('After!');
    });
    const test = passingTest();
    const suite = new Suite('Suite').beforeEach(hook1).afterEach(hook2).add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new TapReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;

    assert.strictEqual(lines[2], '# Error: Before!');
    assert.strictEqual(lines[13], '# Error: After!');
  });
});
