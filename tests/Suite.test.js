const assert = require('assert');
const { fail, passingTest, failingTest, skippedTest, exclusiveTest } = require('./support/helpers');
const { describe, GraphReporter, NullReporter, Suite, Test, TestableOutcomes } = require('..');

describe('Suites', ({ it }) => {

  const reporter = new NullReporter();

  it('should report successful tests', async () => {
    const test1 = passingTest();
    const test2 = passingTest();
    const suite = new Suite('Test Suite').add(test1, test2);

    await suite.run(reporter);

    assert.equal(suite.passed, true);
    assert.equal(test1.passed, true);
    assert.equal(test2.passed, true);
  });

  it('should report failing tests', async () => {
    const test1 = passingTest();
    const test2 = failingTest();
    const suite = new Suite('Test Suite').add(test1, test2);

    await suite.run(reporter);

    assert.equal(suite.failed, true);
    assert.equal(test1.passed, true);
    assert.equal(test2.failed, true);
  });

  it('should skip tests (run configuration)', async () => {
    const test1 = passingTest();
    const test2 = failingTest();
    const suite = new Suite('Test Suite').add(test1, test2);

    await suite.run(reporter, { skip: true });

    assert.equal(suite.skipped, true);
    assert.equal(test1.skipped, true);
    assert.equal(test2.skipped, true);
  });

  it('should skip tests (suite configuration)', async () => {
    const test1 = passingTest();
    const test2 = failingTest();
    const suite = new Suite('Test Suite', { skip: true }).add(test1, test2);

    await suite.run(reporter);

    assert.equal(suite.skipped, true);
    assert.equal(test1.skipped, true);
    assert.equal(test2.skipped, true);
  });

  it('should skip tests (test configuration)', async () => {
    const test1 = passingTest();
    const test2 = skippedTest();
    const suite = new Suite('Test Suite').add(test1, test2);

    await suite.run(reporter);

    assert.equal(suite.passed, true);
    assert.equal(test1.passed, true);
    assert.equal(test2.skipped, true);
  });

  it('should pass a suite with only skipped tests', async () => {
    const test1 = skippedTest();
    const test2 = skippedTest();
    const suite = new Suite('Test Suite').add(test1, test2);

    await suite.run(reporter);

    assert.equal(suite.passed, true);
    assert.equal(test1.skipped, true);
    assert.equal(test2.skipped, true);
  });

  it('should abort early (run configuration)', async () => {
    const test1 = failingTest();
    const test2 = passingTest();
    const suite = new Suite('Test Suite').add(test1, test2);

    await suite.run(reporter, { abort: true });

    assert.equal(suite.failed, true);
    assert.equal(test1.failed, true);
    assert.equal(test2.skipped, true);
  });

  it('should aborting early (suite configuration)', async () => {
    const test1 = failingTest();
    const test2 = passingTest();
    const suite = new Suite('Test Suite', { abort: true }).add(test1, test2);

    await suite.run(reporter);

    assert.equal(suite.failed, true);
    assert.equal(test1.failed, true);
    assert.equal(test2.skipped, true);
  });

  it('should only run exclusive tests (test configuration)', async () => {
    const test1 = passingTest();
    const test2 = exclusiveTest();
    const suite = new Suite('Test Suite').add(test1, test2);

    await suite.run(reporter, {}, {}, false);

    assert.equal(suite.stats.passed, 1);
    assert.equal(suite.stats.failed, 0);
    assert.equal(suite.stats.skipped, 0);
  });

  it('should only run exclusive tests (suite configuration)', async () => {
    const test1 = passingTest();
    const test2 = passingTest();
    const test3 = passingTest();
    const child1 = new Suite('Child 1', { exclusive: true }).add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);

    await parent.run(reporter, {}, {}, false);

    assert.equal(parent.stats.passed, 2);
    assert.equal(parent.stats.failed, 0);
    assert.equal(parent.stats.skipped, 0);
  });

  it('should only run exclusive tests (suite and test configuration)', async () => {
    const test1 = passingTest();
    const test2 = exclusiveTest();
    const test3 = passingTest();
    const child1 = new Suite('Child 1', { exclusive: true }).add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);

    await parent.run(reporter, {}, {}, false);

    assert.equal(parent.stats.passed, 1);
    assert.equal(parent.stats.failed, 0);
    assert.equal(parent.stats.skipped, 0);
  });

  it('should skip the exclusive test (suite configuration)', async () => {
    const test = failingTest();
    const suite = new Suite('Test Suite', { skip: true, exclusive: true }).add(test);

    await suite.run(reporter);

    assert.equal(suite.skipped, true);
    assert.equal(test.skipped, true);
  });

  it('should skip exclusive tests (test configuration)', async () => {
    const test = new Test('Test', fail(), { skip: true, exclusive: true });
    const suite = new Suite('Test Suite').add(test);

    await suite.run(reporter);
    assert.equal(suite.passed, true);
    assert.equal(test.skipped, true);
  });

  it('should support nesting', async () => {
    const test1 = passingTest('Test 1');
    const test2 = failingTest('Test 2');
    const test3 = passingTest('Test 3');
    const child1 = new Suite('Child 1').add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);

    await parent.run(reporter);

    assert.equal(parent.passed, false);
    assert.equal(parent.name, 'Parent');
    assert.equal(parent.stats.passed, 2);
    assert.equal(parent.stats.failed, 1);
    assert.equal(parent.stats.skipped, 0);

    assert.equal(child1.name, 'Child 1');
    assert.equal(child1.passed, false);
    assert.equal(child1.stats.passed, 1);
    assert.equal(child1.stats.failed, 1);
    assert.equal(child1.stats.skipped, 0);

    assert.equal(child2.name, 'Child 2');
    assert.equal(child2.passed, true);
    assert.equal(child2.stats.passed, 1);
    assert.equal(child2.stats.failed, 0);
    assert.equal(child2.stats.skipped, 0);

    assert.equal(test1.name, 'Test 1');
    assert.equal(test1.passed, true);
    assert.equal(test2.name, 'Test 2');
    assert.equal(test2.failed, true);
    assert.equal(test3.name, 'Test 3');
    assert.equal(test3.passed, true);
  });

  it('should finalise a suite of tests', async () => {
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest('Test 3');
    const child1 = new Suite('Child 1').add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);

    const reporter = new GraphReporter();
    const finalised = parent._finalise();
    await finalised.run(reporter);

    const graph = reporter.toGraph();
    assert.equal(graph.name, 'Parent');
    assert.equal(graph.result, TestableOutcomes.PASSED);
    assert.equal(graph.resolve(0, 0).name, 'Test 1');
    assert.equal(graph.resolve(0, 0).point, 1);
    assert.equal(graph.resolve(0, 1).result, TestableOutcomes.PASSED);
    assert.equal(graph.resolve(0, 1).name, 'Test 2');
    assert.equal(graph.resolve(0, 1).point, 2);
    assert.equal(graph.resolve(0, 0).result, TestableOutcomes.PASSED);
    assert.equal(graph.resolve(1, 0).name, 'Test 3');
    assert.equal(graph.resolve(1, 0).point, 3);
    assert.equal(graph.resolve(1, 0).result, TestableOutcomes.PASSED);
  });
});


