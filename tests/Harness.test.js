const assert = require('assert');
const { pass } = require('./support/fixtures');
const { describe, GraphReporter, NullReporter, Harness, Suite, Test, RunnableOutcomes } = require('..');

describe('Harnesses', ({ it }) => {

  const reporter = new NullReporter();

  it('should run a test suite', async () => {
    const test1 = new Test('Test 1', pass());
    const test2 = new Test('Test 2', pass());
    const suite = new Suite('Test Suite').add(test1, test2);
    const harness = new Harness().set(suite);

    await harness.run(reporter);

    assert.equal(harness.passed, true);
  });

  it('should run an individual test', async () => {
    const test = new Test('Test', pass());
    const harness = new Harness().set(test);

    await harness.run(reporter);

    assert.equal(harness.passed, true);
  });

  it('should skip a single test in a nested suite', async () => {
    const test1 = new Test('Test 1', pass());
    const test2 = new Test('should run test 2', pass, { skip: true });
    const test3 = new Test('should run test 3', pass());
    const child1 = new Suite('Child 1').add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);
    const harness = new Harness().set(parent);

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
    const test1 = new Test('Test 1', pass());
    const test2 = new Test('Test 2', pass());
    const test3 = new Test('Test 3', pass());
    const child1 = new Suite('Child 1', { skip: true }).add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);
    const harness = new Harness().set(parent);

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
    const test1 = new Test('Test 1', pass());
    const test2 = new Test('Test 2', pass, { exclusive: true });
    const test3 = new Test('Test 3', pass, { exclusive: true });
    const test4 = new Test('Test 4', pass, { exclusive: true });
    const child1 = new Suite('Child 1').add(test1, test2, test3);
    const child2 = new Suite('Child 2').add(test4);
    const parent = new Suite('Parent').add(child1, child2);
    const harness = new Harness().set(parent);

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
    const test1 = new Test('Test 1', pass());
    const test2 = new Test('Test 2', pass());
    const test3 = new Test('Test 3', pass());
    const child1 = new Suite('Child 1', { exclusive: true }).add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);
    const harness = new Harness().set(parent);

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
    const test1 = new Test('Test 1', pass());
    const test2 = new Test('Test 2', pass());
    const test3 = new Test('Test 3', pass());
    const child1 = new Suite('Child 1', { skip: true, exclusive: true }).add(test1, test2);
    const child2 = new Suite('Child 2').add(test3);
    const parent = new Suite('Parent').add(child1, child2);
    const harness = new Harness().set(parent);

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




