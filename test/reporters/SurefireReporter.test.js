const assert = require('assert');
const TestOutputStream = require('../support/TestOutputStream');
const { passingTest, failingTest, skippedTest } = require('../support/helpers');
const { SurefireReporter, Harness, Suite, Test, Hook } = require('../..');

describe('Surefire Reporter', () => {

  it('should report the xml version and encoding', async () => {
    const suite = new Suite('Test Suite');
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SurefireReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[0], '<?xml version="1.0" encoding="UTF-8" ?>');
  });

  it('should report an empty test suite', async () => {
    const suite = new Suite('Suite');
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SurefireReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuite name="Suite" tests="0" errors="0" failures="0" skipped="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^<\/testsuite>/);
  });

  it('should report a successful testsuite (suite)', async () => {
    const test = passingTest('Test 1');
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SurefireReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuite name="Suite" tests="1" errors="0" failures="0" skipped="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^ {2}<testcase name="Suite \/ Test 1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], /^ {2}<\/testcase>/);
    assert.match(lines[4], /^<\/testsuite>/);
  });

  it('should report a successful testsuite (test)', async () => {
    const test = passingTest('Test 1');
    const harness = new Harness(test);
    const stream = new TestOutputStream();

    const reporter = new SurefireReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuite name="Test 1" tests="1" errors="0" failures="0" skipped="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^ {2}<testcase name="Test 1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], /^ {2}<\/testcase>/);
    assert.match(lines[4], /^<\/testsuite>/);
  });

  it('should report a failing testsuite (suite)', async () => {
    const test = failingTest('Test 1');
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SurefireReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuite name="Suite" tests="1" errors="0" failures="1" skipped="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^ {2}<testcase name="Suite \/ Test 1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], /^ {4}<failure message="Oh Noes!" type="Error">/);
    assert.match(lines[4], /^<!\[CDATA\[/);
    assert.match(lines[5], /^Error: Oh Noes!/);
    assert.match(lines[6], /^ {4}at fail \(.*\)/);
    assert.match(lines[lines.length - 5], /^]]>/);
    assert.match(lines[lines.length - 4], /^ {4}<\/failure>/);
    assert.match(lines[lines.length - 3], /^ {2}<\/testcase>/);
    assert.match(lines[lines.length - 2], /^<\/testsuite>/);
  });

  it('should report a failing testsuite (test)', async () => {
    const test = failingTest('Test 1');
    const harness = new Harness(test);
    const stream = new TestOutputStream();

    const reporter = new SurefireReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuite name="Test 1" tests="1" errors="0" failures="1" skipped="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^ {2}<testcase name="Test 1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], /^ {4}<failure message="Oh Noes!" type="Error">/);
    assert.match(lines[4], /^<!\[CDATA\[/);
    assert.match(lines[5], /^Error: Oh Noes!/);
    assert.match(lines[6], /^ {4}at fail \(.*\)/);
    assert.match(lines[lines.length - 5], /]]>/);
    assert.match(lines[lines.length - 4], / {4}<\/failure>/);
    assert.match(lines[lines.length - 3], / {2}<\/testcase>/);
    assert.match(lines[lines.length - 2], /<\/testsuite>/);
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

    const reporter = new SurefireReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines.filter(l => /<failure message/.test(l));

    assert.match(lines[0], /^ {4}<failure message="The expression evaluated to a falsy value: assert.ok\(false\)" type="AssertionError">/);
    assert.match(lines[1], /^ {4}<failure message="Hook Error" type="Error">/);
  });

  it('should report a skipped testcase', async () => {
    const test = skippedTest('Test 1');
    const suite = new Suite('Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SurefireReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuite name="Suite" tests="1" errors="0" failures="0" skipped="1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^ {2}<testcase name="Suite \/ Test 1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], /^ {4}<skipped message="No reason given">/);
    assert.match(lines[4], /^ {4}<\/skipped>/);
    assert.match(lines[5], /^ {2}<\/testcase>/);
    assert.match(lines[6], /^<\/testsuite>/);
  });

  it('should flatten a nested test suite', async () => {
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const test4 = passingTest('Test 4');
    const suite3 = new Suite('Suite 3').add(test3);
    const suite2 = new Suite('Suite 2').add(test1, test2);
    const suite1 = new Suite('Suite 1').add(suite2, suite3, test4);
    const harness = new Harness(suite1);
    const stream = new TestOutputStream();

    const reporter = new SurefireReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuite name="Suite 1" tests="4" errors="0" failures="0" skipped="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^ {2}<testcase name="Suite 1 \/ Suite 2 \/ Test 1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], /^ {2}<\/testcase>/);
    assert.match(lines[4], /^ {2}<testcase name="Suite 1 \/ Suite 2 \/ Test 2" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[5], /^ {2}<\/testcase>/);
    assert.match(lines[6], /^ {2}<testcase name="Suite 1 \/ Suite 3 \/ Test 3" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[7], /^ {2}<\/testcase>/);
    assert.match(lines[8], /^ {2}<testcase name="Suite 1 \/ Test 4" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[9], /^ {2}<\/testcase>/);
    assert.match(lines[10], /^<\/testsuite>/);
  });

  it('should escape attributes', async () => {
    const test1 = new Test('Test 1 <<""&&>>', () => {}, { skip: true, reason: 'Because <<""&&>>' });
    const test2 = new Test('Test 2 <<""&&>>', () => {
      throw new Error('Oh Noes! <<""&&>>');
    });
    const suite = new Suite('Suite <<""&&>>').add(test1, test2);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new SurefireReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuite name="Suite &lt;&lt;&quot;&quot;&amp;&amp;&gt;&gt;" tests="2" errors="0" failures="1" skipped="1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^ {2}<testcase name="Suite &lt;&lt;&quot;&quot;&amp;&amp;&gt;&gt; \/ Test 1 &lt;&lt;&quot;&quot;&amp;&amp;&gt;&gt;" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], /^ {4}<skipped message="Because &lt;&lt;&quot;&quot;&amp;&amp;&gt;&gt;">/);
    assert.match(lines[4], /^ {4}<\/skipped>/);
    assert.match(lines[5], /^ {2}<\/testcase>/);
    assert.match(lines[6], /^ {2}<testcase name="Suite &lt;&lt;&quot;&quot;&amp;&amp;&gt;&gt; \/ Test 2 &lt;&lt;&quot;&quot;&amp;&amp;&gt;&gt;" time="(?:\d+|\d+\.\d+)">/);
  });
});
