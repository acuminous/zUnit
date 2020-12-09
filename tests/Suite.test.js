const assert = require('assert');
const { fail, passingTest, failingTest, skippedTest, exclusiveTest } = require('./support/helpers');
const { GraphReporter, NullReporter, Suite, Test, Hook, TestableOutcomes } = require('..');

describe('Suites', () => {

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

  describe('Lifecycle Hooks', () => {

    describe('Before', () => {

      it('should inject hook api', async () => {
        let api;
        const hook = new Hook('Hook', (h) => {
          api = h;
        });

        const suite = new Suite('Suite').before(hook).add(passingTest())._finalise();

        await suite.run(reporter);

        assert.equal(api.name, 'Hook');
        assert.equal(api.description, 'Suite / Hook');
        assert.equal(api.suite.name, 'Suite');
        assert.ok(api.suite.skip);
      });

      it('should run before hooks before all tests', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', (h) => executed.push(h.name));
        const hook2 = new Hook('Hook 2', (h) => executed.push(h.name));
        const test1 = new Test('Test 1', (t) => executed.push(t.name));
        const test2 = new Test('Test 2', (t) => executed.push(t.name));
        const suite = new Suite('Suite').before(hook1, hook2).add(test1, test2)._finalise();

        await suite.run(reporter);

        assert.equal(executed.length, 4);
        assert.equal(executed[0], 'Hook 1');
        assert.equal(executed[1], 'Hook 2');
        assert.equal(executed[2], 'Test 1');
        assert.equal(executed[2], 'Test 1');
      });

      it('should skip before hooks before a skipped suite (runtime configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('Before'));
        const test = new Test('Test', () => executed.push('Test'));
        const suite = new Suite('Suite').before(hook).add(test)._finalise();

        await suite.run(reporter, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should skip before hooks before a skipped suite (inherited configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('Before'));
        const test = new Test('Test', () => executed.push('Test'));
        const suite = new Suite('Suite').before(hook).add(test)._finalise();

        await suite.run(reporter, {}, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should skip before hooks before a skipped suite (suite configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('Before'));
        const test = new Test('Test', () => executed.push('Test'));
        const suite = new Suite('Suite', { skip: true }).before(hook).add(test)._finalise();

        await suite.run(reporter);

        assert.equal(executed.length, 0);
      });

      it('should skip remaining before hooks and test following a skipped suite (programmatic)', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
        const hook2 = new Hook('Hook 2', (h) => { h.suite.skip('Whatever'); });
        const hook3 = new Hook('Hook 3', () => executed.push('Before 3'));
        const test = new Test('Test', () => executed.push('Test'));
        const suite = new Suite('Suite').before(hook1, hook2, hook3).add(test)._finalise();

        await suite.run(reporter);

        assert.equal(executed.length, 1);
        assert.equal(executed[0], 'Before 1');
      });

      it('should skip remaining before hooks following a failure', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
        const hook2 = new Hook('Hook 2', () => { throw new Error('Oh Noes!'); });
        const hook3 = new Hook('Hook 3', () => executed.push('Before 3'));
        const test = new Test('Test', () => executed.push('Test'));
        const suite = new Suite('Suite').before(hook1, hook2, hook3).add(test)._finalise();

        await suite.run(reporter);

        assert.equal(executed.length, 1);
      });

      it('should fail the suite if a before hook fails', async () => {
        const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
        const suite = new Suite('Suite').before(hook).add(passingTest())._finalise();

        await suite.run(reporter);

        assert.equal(suite.failed, true);
      });
    });

    describe('After', () => {

      it('should inject hook api', async () => {
        let api;
        const hook = new Hook('Hook', (h) => {
          api = h;
        });

        const suite = new Suite('Suite').after(hook).add(passingTest())._finalise();

        await suite.run(reporter);

        assert.equal(api.name, 'Hook');
        assert.equal(api.description, 'Suite / Hook');
        assert.equal(api.suite.name, 'Suite');
        assert.ok(!api.suite.skip);
      });

      it('should run after hooks after a successful test', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
        const hook2 = new Hook('Hook 2', () => executed.push('After 2'));
        const test = new Test('Test', () => executed.push('Test'));
        const suite = new Suite('Suite').after(hook1, hook2).add(test)._finalise();

        await suite.run(reporter);

        assert.equal(executed.length, 3);
        assert.equal(executed[0], 'Test');
        assert.equal(executed[1], 'After 1');
        assert.equal(executed[2], 'After 2');
      });

      it('should run after hooks after a failing test', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
        const hook2 = new Hook('Hook 2', () => executed.push('After 2'));
        const suite = new Suite('Suite').after(hook1, hook2).add(failingTest())._finalise();

        await suite.run(reporter);

        assert.equal(executed.length, 2);
        assert.equal(executed[0], 'After 1');
        assert.equal(executed[1], 'After 2');
      });

      it('should skip after hooks after a skipped suite (suite configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('After'));
        const suite = new Suite('Suite', { skip: true }).after(hook).add(passingTest())._finalise();

        await suite.run(reporter);

        assert.equal(executed.length, 0);
      });

      it('should skip after hooks after a skipped suite (runtime configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('After'));
        const suite = new Suite('Suite').after(hook).add(passingTest())._finalise();

        await suite.run(reporter, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should skip after hooks after a skipped suite (inherited configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('After'));
        const suite = new Suite('Suite').after(hook).add(passingTest())._finalise();

        await suite.run(reporter, {}, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should run after hooks after a skipped suite (programmatic)', async () => {
        const executed = [];
        const hook1 = new Hook('Before', (h) => h.suite.skip('whatever'));
        const hook2 = new Hook('After', () => executed.push('After'));
        const suite = new Suite('Suite').before(hook1).after(hook2).add(passingTest())._finalise();

        await suite.run(reporter);

        assert.equal(executed.length, 1);
        assert.equal(executed[0], 'After');
      });

      it('should fail the suite if an after hook fails', async () => {
        const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
        const suite = new Suite('Suite').after(hook).add(passingTest())._finalise();

        await suite.run(reporter);

        assert.equal(suite.failed, true);
      });

      it('should skip remaining after hooks following a failure', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
        const hook2 = new Hook('Hook 2', () => { throw new Error('Oh Noes!'); });
        const hook3 = new Hook('Hook 3', () => executed.push('After 3'));
        const suite = new Suite('Suite').after(hook1, hook2, hook3).add(passingTest())._finalise();

        await suite.run(reporter);

        assert.equal(executed.length, 1);
        assert.equal(executed[0], 'After 1');
      });

      it('should fail all non skipped tests following a failure', async () => {
        const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
        const test1 = passingTest();
        const test2 = skippedTest();
        const test3 = failingTest();
        const suite = new Suite('Suite').after(hook).add(test1, test2, test3)._finalise();

        await suite.run(reporter);

        assert.equal(suite.numberOfFailures, 2);
        assert.equal(suite.numberOfPasses, 0);
        assert.equal(suite.numberOfSkipped, 1);
      });

      it('should skip after hooks associated with skipped before hooks', async () => {
        const executedBefore = [];
        const before1 = new Hook('Before 1', () => executedBefore.push('Before 1'));
        const before2 = new Hook('Before 2', () => { throw new Error('Oh Noes!'); });
        const before3 = new Hook('Before 3', () => executedBefore.push('Before 3'));

        const executedAfter = [];
        const after1 = new Hook('After 1', () => executedAfter.push('After 1'));
        const after2 = new Hook('After 2', () => executedAfter.push('After 2'));
        const after3 = new Hook('After 3', () => executedAfter.push('After 3'));

        const suite3 = new Suite('Suite 3').before(before3).after(after3).add(passingTest());
        const suite2 = new Suite('Suite 2').before(before2).after(after2).add(suite3);
        const suite1 = new Suite('Suite 1').before(before1).after(after1).add(suite2)._finalise();

        await suite1.run(reporter);

        assert.equal(executedBefore.length, 1);
        assert.equal(executedBefore[0], 'Before 1');

        assert.equal(executedAfter.length, 2);
        assert.equal(executedAfter[0], 'After 2');
        assert.equal(executedAfter[1], 'After 1');
      });
    });
  });
});


