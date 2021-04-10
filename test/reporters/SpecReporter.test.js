const assert = require('assert');
const TestOutputStream = require('../support/TestOutputStream');
const { passingTest, failingTest, skippedTest } = require('../support/helpers');
const { SpecReporter, Harness, Suite, Test, Hook } = require('../..');

describe('Spec Reporter', () => {

  it('should report an empty test suite', async () => {
    const suite = new Suite('Suite');
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SpecReporter({ stream, colours: false });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^Suite/);
    assert.match(lines[3], /^Summary/);
    assert.match(lines[4], /^ {2}Tests: 0, Passed: 0, Failed: 0, Skipped: 0, Duration: \d+ms/);
  });

  it('should report in colour by default', async () => {
    const suite = new Suite('Suite');
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SpecReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.strictEqual(lines[1], '\x1B[4mSuite\x1B[0m');
  });

  it('should report a successful testsuite (suite)', async () => {
    const test = passingTest('Test 1');
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SpecReporter({ stream, colours: false });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^Suite/);
    assert.match(lines[2], /^ {2}Test 1/);
    assert.match(lines[3], /^ {3}- PASSED \(\d+ms\)/);
    assert.match(lines[5], /^Summary/);
    assert.match(lines[6], /^ {2}Tests: 1, Passed: 1, Failed: 0, Skipped: 0, Duration: \d+ms/);
  });

  it('should report a successful testsuite (test)', async () => {
    const test = passingTest('Test 1');
    const harness = new Harness(test);
    const stream = new TestOutputStream();

    const reporter = new SpecReporter({ stream, colours: false });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[0], /^Test 1/);
    assert.match(lines[1], /^ {1}- PASSED \(\d+ms\)/);
    assert.match(lines[3], /^Summary/);
    assert.match(lines[4], /^ {2}Tests: 1, Passed: 1, Failed: 0, Skipped: 0, Duration: \d+ms/);
  });

  it('should report a failing testsuite (suite)', async () => {
    const test = failingTest('Test 1');
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SpecReporter({ stream, colours: false });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^Suite/);
    assert.match(lines[2], /^ {2}Test 1/);
    assert.match(lines[3], /^ {3}- FAILED \(1 of 1\): Oh Noes! \(\d+ms\)/);
    assert.match(lines[5], /^Error: Oh Noes!/);
    assert.match(lines[6], /^ {4}at fail \(.*\)/);
    assert.match(lines[lines.length - 4], /^Summary/);
    assert.match(lines[lines.length - 3], /^ {2}Tests: 1, Passed: 0, Failed: 1, Skipped: 0, Duration: \d+ms/);
  });

  it('should report a failing testsuite (test)', async () => {
    const test = failingTest('Test 1');
    const harness = new Harness(test);
    const stream = new TestOutputStream();

    const reporter = new SpecReporter({ stream, colours: false });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[0], /^Test 1/);
    assert.match(lines[1], /^ {1}- FAILED \(1 of 1\): Oh Noes! \(\d+ms\)/);
    assert.match(lines[3], /^Error: Oh Noes!/);
    assert.match(lines[4], /^ {4}at fail \(.*\)/);
    assert.match(lines[lines.length - 4], /^Summary/);
    assert.match(lines[lines.length - 3], /^ {2}Tests: 1, Passed: 0, Failed: 1, Skipped: 0, Duration: \d+ms/);
  });

  it('should report a failing testsuite with multiple errors', async () => {
    const test = new Test('Test 1', () => {
      assert.ok(false);
    });
    const hook = new Hook('Hook', () => {
      throw new Error('Hook Error');
    });
    const suite = new Suite('Suite').afterEach(hook).add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SpecReporter({ stream, colours: false });
    await harness.run(reporter);

    const lines = stream.lines.filter(l => /FAILED/.test(l));
    assert.match(lines[0], /^ {3}- FAILED \(1 of 2\): The expression evaluated to a falsy value: assert.ok\(false\) \(\d+ms\)/);
    assert.match(lines[1], /^ {3}- FAILED \(2 of 2\): Hook Error \(\d+ms\)/);
  });

  it('should report a failing testsuite with non error', async () => {
    const test = new Test('Test 1', () => {
      throw 'Oh Noes!';
    });
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SpecReporter({ stream, colours: false });
    await harness.run(reporter);

    const lines = stream.lines.filter(l => /FAILED/.test(l));
    assert.match(lines[0], /^ {3}- FAILED \(1 of 1\): Oh Noes! \(\d+ms\)/);
  });

  it('should report a skipped testcase', async () => {
    const test = skippedTest('Test 1');
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SpecReporter({ stream, colours: false });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^Suite/);
    assert.match(lines[2], /^ {2}Test 1/);
    assert.match(lines[3], /^ {3}- SKIPPED: No reason given \(\d+ms\)/);
    assert.match(lines[5], /^Summary/);
    assert.match(lines[6], /^ {2}Tests: 1, Passed: 0, Failed: 0, Skipped: 1, Duration: \d+ms/);
  });

  it('should support a nested test suite', async () => {
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const test4 = passingTest('Test 4');
    const suite3 = new Suite('Suite 3').add(test3);
    const suite2 = new Suite('Suite 2').add(test1, test2);
    const suite1 = new Suite('Suite 1').add(suite2, suite3, test4);
    const harness = new Harness(suite1);
    const stream = new TestOutputStream();

    const reporter = new SpecReporter({ stream, colours: false });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^Suite 1/);
    assert.match(lines[3], /^ {2}Suite 2/);
    assert.match(lines[4], /^ {4}Test 1/);
    assert.match(lines[5], /^ {5}- PASSED \(\d+ms\)/);
    assert.match(lines[6], /^ {4}Test 2/);
    assert.match(lines[7], /^ {5}- PASSED \(\d+ms\)/);
    assert.match(lines[9], /^ {2}Suite 3/);
    assert.match(lines[10], /^ {4}Test 3/);
    assert.match(lines[11], /^ {5}- PASSED \(\d+ms\)/);
    assert.match(lines[12], /^ {2}Test 4/);
    assert.match(lines[13], /^ {3}- PASSED \(\d+ms\)/);
    assert.match(lines[15], /^Summary/);
    assert.match(lines[16], /^ {2}Tests: 4, Passed: 4, Failed: 0, Skipped: 0, Duration: \d+ms/);
  });
});
