const assert = require('assert');
const TestOutputStream = require('../support/TestOutputStream');
const { passingTest, failingTest, skippedTest } = require('../support/helpers');
const { JUnitReporter, Harness, Suite } = require('../..');

describe('JUnit Reporter', () => {

  it('should report the xml version and encoding', async () => {
    const suite = new Suite('Test Suite');
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new JUnitReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.equal(lines[0], '<?xml version="1.0" encoding="UTF-8" ?>');
  });

  it('should report an empty test suite', async () => {
    const suite = new Suite('Test Suite');
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new JUnitReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuites name="Test Suite" tests="0" failures="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^<\/testsuites>/);
  });

  it('should report a successful test suite', async () => {
    const test = passingTest('Test 1');
    const suite = new Suite('Test Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new JUnitReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuites name="Test Suite" tests="1" failures="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^ {2}<testsuite name="Test Suite" tests="1" failures="0" skipped="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], /^ {4}<testcase name="Test 1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[4], /^ {4}<\/testcase>/);
    assert.match(lines[5], /^ {2}<\/testsuite>/);
    assert.match(lines[6], /^<\/testsuites>/);
  });

  it('should report a failing test suite', async () => {
    const test = failingTest('Test 1');
    const suite = new Suite('Test Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new JUnitReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuites name="Test Suite" tests="1" failures="1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^ {2}<testsuite name="Test Suite" tests="1" failures="1" skipped="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], /^ {4}<testcase name="Test 1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[4], /^ {6}<failure message="Oh Noes!">/);
    assert.match(lines[5], /^Error: Oh Noes!/);
    assert.match(lines[6], /^ {4}at fail \(.*\)/);
    assert.match(lines[lines.length - 5], / {6}<\/failure>/);
    assert.match(lines[lines.length - 4], / {4}<\/testcase>/);
    assert.match(lines[lines.length - 3], / {2}<\/testsuite>/);
    assert.match(lines[lines.length - 2], /<\/testsuites>/);
  });

  it('should report a skipped test suite', async () => {
    const test = skippedTest('Test 1', 'Mercy');
    const suite = new Suite('Test Suite').add(test);
    const harness = new Harness(suite);
    const stream = new TestOutputStream();

    const reporter = new JUnitReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuites name="Test Suite" tests="1" failures="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^ {2}<testsuite name="Test Suite" tests="1" failures="0" skipped="1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], /^ {4}<testcase name="Test 1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[4], /^ {6}<skipped message="Mercy">/);
    assert.match(lines[5], /^ {6}<\/skipped>/);
    assert.match(lines[6], /^ {4}<\/testcase>/);
    assert.match(lines[7], /^ {2}<\/testsuite>/);
    assert.match(lines[8], /^<\/testsuites>/);
  });

  it('should report a nested test suite', async () => {
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const child1 = new Suite('Child 1').add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);
    const harness = new Harness(parent);
    const stream = new TestOutputStream();

    const reporter = new JUnitReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;
    assert.match(lines[1], /^<testsuites name="Parent" tests="3" failures="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], /^ {2}<testsuite name="Child 1" tests="2" failures="0" skipped="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], /^ {4}<testcase name="Test 1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[4], /^ {4}<\/testcase>/);
    assert.match(lines[5], /^ {4}<testcase name="Test 2" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[6], /^ {4}<\/testcase>/);
    assert.match(lines[7], /^ {2}<\/testsuite>/);
    assert.match(lines[8], /^ {2}<testsuite name="Child 2" tests="1" failures="0" skipped="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[9], /^ {4}<testcase name="Test 3" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[10], /^ {4}<\/testcase>/);
    assert.match(lines[11], /^ {2}<\/testsuite>/);
    assert.match(lines[12], /^<\/testsuites>/);
  });

  it('should flatten a deeply nested test suite', async () => {
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const child2 = new Suite('Child 2').add(test3);
    const child1 = new Suite('Child 1').add(test1, test2).add(child2);
    const parent = new Suite('Parent').add(child1);
    const harness = new Harness(parent);
    const stream = new TestOutputStream();

    const reporter = new JUnitReporter({ stream });
    await harness.run(reporter);

    const lines = stream.lines;

    assert.match(lines[1], /<testsuites name="Parent" tests="3" failures="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[2], / {2}<testsuite name="Child 1" tests="3" failures="0" skipped="0" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[3], / {4}<testcase name="Test 1" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[4], / {4}<\/testcase>/);
    assert.match(lines[5], / {4}<testcase name="Test 2" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[6], / {4}<\/testcase>/);
    assert.match(lines[7], / {4}<testcase name="Child 2 \/ Test 3" time="(?:\d+|\d+\.\d+)">/);
    assert.match(lines[8], / {4}<\/testcase>/);
    assert.match(lines[9], / {2}<\/testsuite>/);
    assert.match(lines[10], /<\/testsuites>/);
  });

});

