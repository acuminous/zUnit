const assert = require('assert');
const { passingTest, skippedTest, exclusiveTest } = require('./support/fixtures');
const { describe, GraphReporter, NullReporter, Harness, Suite, RunnableOutcomes } = require('..');

describe('Harnesses', ({ it }) => {

  const reporter = new NullReporter();

  it('should run a test suite', async () => {
    const test1 = passingTest();
    const test2 = passingTest();
    const suite = new Suite('Test Suite').add(test1, test2);
    const harness = new Harness(suite);

    await harness.run(reporter);

    assert.equal(harness.passed, true);
    assert.equal(harness.summary.passed, 2);
  });

  it('should run an individual test', async () => {
    const test = passingTest();
    const harness = new Harness(test);

    await harness.run(reporter);

    assert.equal(harness.passed, true);
    assert.equal(harness.summary.passed, 1);
  });

  it('should skip a single test in a nested suite', async () => {
    const test1 = passingTest();
    const test2 = skippedTest();
    const test3 = passingTest();
    const child1 = new Suite('Child 1').add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);
    const harness = new Harness(parent);

    const reporter = new GraphReporter();
    await harness.run(reporter);

    const graph = reporter.toGraph();
    assert.equal(graph.result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(0).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(0, 0).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(0, 1).result, RunnableOutcomes.SKIPPED);
    assert.equal(graph.resolve(1).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(1, 0).result, RunnableOutcomes.PASSED);
  });

  it('should skip an entire suite in a nested suite', async () => {
    const test1 = passingTest();
    const test2 = passingTest();
    const test3 = passingTest();
    const child1 = new Suite('Child 1', { skip: true }).add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);
    const harness = new Harness(parent);

    const reporter = new GraphReporter();
    await harness.run(reporter);

    const graph = reporter.toGraph();
    assert.equal(graph.result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(0).result, RunnableOutcomes.SKIPPED);
    assert.equal(graph.resolve(0, 0).result, RunnableOutcomes.SKIPPED);
    assert.equal(graph.resolve(0, 1).result, RunnableOutcomes.SKIPPED);
    assert.equal(graph.resolve(1).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(1, 0).result, RunnableOutcomes.PASSED);
  });

  it('should only run exclusive tests in a nested suite', async () => {
    const test1 = passingTest();
    const test2 = exclusiveTest('Test 2');
    const test3 = exclusiveTest('Test 3');
    const test4 = exclusiveTest('Test 4');
    const child1 = new Suite('Child 1').add(test1, test2, test3);
    const child2 = new Suite('Child 2').add(test4);
    const parent = new Suite('Parent').add(child1, child2);
    const harness = new Harness(parent);

    const reporter = new GraphReporter();
    await harness.run(reporter);

    const graph = reporter.toGraph();
    assert.equal(graph.result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(0).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(0, 0).name, 'Test 2');
    assert.equal(graph.resolve(0, 0).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(0, 1).name, 'Test 3');
    assert.equal(graph.resolve(0, 1).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(1).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(1, 0).name, 'Test 4');
    assert.equal(graph.resolve(1, 0).result, RunnableOutcomes.PASSED);
  });

  it('should only run exclusive suites in a nested suite', async () => {
    const test1 = passingTest('Test 1');
    const test2 = passingTest('Test 2');
    const test3 = passingTest();
    const child1 = new Suite('Child 1', { exclusive: true }).add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);
    const harness = new Harness(parent);

    const reporter = new GraphReporter();
    await harness.run(reporter);

    const graph = reporter.toGraph();
    assert.equal(graph.result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(0).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(0, 0).name, 'Test 1');
    assert.equal(graph.resolve(0, 0).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(0, 1).name, 'Test 2');
    assert.equal(graph.resolve(0, 1).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(1), undefined);
  });

  it('should skip an entire suite in a nested suite, even when exclusive', async () => {
    const test1 = passingTest();
    const test2 = passingTest();
    const test3 = passingTest();
    const child1 = new Suite('Child 1', { skip: true, exclusive: true }).add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);
    const harness = new Harness(parent);

    const reporter = new GraphReporter();
    await harness.run(reporter);

    const graph = reporter.toGraph();
    assert.equal(graph.result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(0).result, RunnableOutcomes.SKIPPED);
    assert.equal(graph.resolve(0, 0).result, RunnableOutcomes.SKIPPED);
    assert.equal(graph.resolve(0, 1).result, RunnableOutcomes.SKIPPED);
    assert.equal(graph.resolve(1).result, RunnableOutcomes.PASSED);
    assert.equal(graph.resolve(1, 0).result, RunnableOutcomes.PASSED);
  });
});

