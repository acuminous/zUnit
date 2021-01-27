const assert = require('assert');
const { skip, passingTest, failingTest, skippedTest } = require('./support/helpers');
const { Harness, Suite, Test, Hook, NullReporter, GraphReporter } = require('..');

describe('Hook', () => {

  describe('Before', () => {

    it('should inject hook api', async () => {
      let api;
      const hook = new Hook('Hook', (h) => {
        api = h;
      });

      const test = passingTest();
      const suite = new Suite('Suite').before(hook).add(test);

      await run(suite);

      assert.equal(api.name, 'Hook');
      assert.equal(api.description, 'Suite / Hook');
      assert.equal(api.suite.name, 'Suite');
      assert.ok(api.suite.skip);
    });

    it('should programmatically skip test', async () => {
      const hook = new Hook('Hook', (h) => {
        h.suite.skip('Because');
      });

      const test = passingTest();
      const suite = new Suite('Suite').before(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, skipped: 1 });
      assert.equal(report.resolve(0).reason, 'Because');
    });

    it('should support callbacks', async () => {
      const hook = new Hook('Hook', (h, done) => {
        done();
      });

      const test = passingTest();
      const suite = new Suite('Suite').before(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, passed: 1 });
    });

    it('should timeout if callback is not invoked', async () => {
      // eslint-disable-next-line no-unused-vars
      const hook = new Hook('Hook', (h, done) => {
      }, { timeout: 100 });

      const test = passingTest();
      const suite = new Suite('Suite').before(hook).add(test);

      const report = await run(suite);

      assert.ok(report.failed);
      assert.ok(report.incomplete);
      assert.stats(report.stats, { tests: 1 });
      assert.match(report.errors[0].message, /Timed out after 100ms/);
    });

    it('should timeout if promise is unresolved', async () => {
      // eslint-disable-next-line no-unused-vars
      const hook = new Hook('Hook', (h) => {
        return new Promise(() => {});
      }, { timeout: 100 });

      const test = passingTest();
      const suite = new Suite('Suite').before(hook).add(test);

      const report = await run(suite);

      assert.ok(report.failed);
      assert.ok(report.incomplete);
      assert.stats(report.stats, { tests: 1 });
      assert.match(report.errors[0].message, /Timed out after 100ms/);
    });

    it('should run before hooks before all tests', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', (h) => executed.push(h.name));
      const hook2 = new Hook('Hook 2', (h) => executed.push(h.name));
      const test1 = new Test('Test 1', (t) => executed.push(t.name));
      const test2 = new Test('Test 2', (t) => executed.push(t.name));
      const suite = new Suite('Suite').before(hook1, hook2).add(test1, test2);

      await run(suite);

      assert.equal(executed.length, 4);
      assert.equal(executed[0], 'Hook 1');
      assert.equal(executed[1], 'Hook 2');
      assert.equal(executed[2], 'Test 1');
      assert.equal(executed[2], 'Test 1');
    });

    it('should bypass before hooks when there are no tests', async () => {
      const executed = [];
      const hook = new Hook('Hook', (h) => executed.push(h.name));
      const suite = new Suite('Suite').before(hook);

      await run(suite);

      assert.equal(executed.length, 0);
    });

    it('should bypass before hooks before a skipped suite (runtime configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('Before'));
      const test = new Test('Test', () => executed.push('Test'));
      const suite = new Suite('Suite').before(hook).add(test);

      await run(suite, { skip: true });

      assert.equal(executed.length, 0);
    });

    it('should bypass before hooks before a skipped suite (harness configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('Before'));
      const test = new Test('Test', () => executed.push('Test'));
      const suite = new Suite('Suite').before(hook).add(test);
      const harness = new Harness(suite, { skip: true });

      await harness.run(new NullReporter(), suite);

      assert.equal(executed.length, 0);
    });

    it('should bypass before hooks before a skipped suite (suite configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('Before'));
      const test = new Test('Test', () => executed.push('Test'));
      const suite = new Suite('Suite', { skip: true }).before(hook).add(test);

      await run(suite);

      assert.equal(executed.length, 0);
    });

    it('should bypass remaining before hooks and test following a skipped suite (programmatic)', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
      const hook2 = new Hook('Hook 2', (h) => { h.suite.skip(); });
      const hook3 = new Hook('Hook 3', () => executed.push('Before 3'));
      const test = new Test('Test', () => executed.push('Test'));
      const suite = new Suite('Suite').before(hook1, hook2, hook3).add(test);

      await run(suite);

      assert.equal(executed.length, 1);
      assert.equal(executed[0], 'Before 1');
    });

    it('should bypass remaining before hooks following a failure', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
      const hook2 = new Hook('Hook 2', () => { throw new Error('Oh Noes!'); });
      const hook3 = new Hook('Hook 3', () => executed.push('Before 3'));
      const test = new Test('Test', () => executed.push('Test'));
      const suite = new Suite('Suite').before(hook1, hook2, hook3).add(test);

      await run(suite);

      assert.equal(executed.length, 1);
    });

    it('should report a failure', async () => {
      const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
      const test1 = passingTest();
      const test2 = skippedTest();
      const test3 = failingTest();
      const suite = new Suite('Suite').before(hook).add(test1, test2, test3);

      const report = await run(suite);

      assert.ok(report.failed);
      assert.ok(report.incomplete);
      assert.match(report.errors[0].message, /Oh Noes!/);
      assert.stats(report.stats, { tests: 3, failed: 0 });
    });

    it('should a failure in a nested suite', async () => {
      const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
      const test1 = passingTest();
      const test2 = skippedTest();
      const test3 = failingTest();
      const suite1 = new Suite('Suite 1').before(hook).add(test1, test2, test3);
      const suite2 = new Suite('Suite 2').add(suite1);

      const report = await run(suite2);

      assert.ok(report.failed);
      assert.ok(report.incomplete);
      assert.match(report.resolve(0).errors[0].message, /Oh Noes!/);
      assert.stats(report.stats, { tests: 3, failed: 0 });
    });
  });

  describe('After', () => {

    it('should inject hook api', async () => {
      let api;
      const hook = new Hook('Hook', (h) => {
        api = h;
      });

      const suite = new Suite('Suite').after(hook).add(passingTest());

      await run(suite);

      assert.equal(api.name, 'Hook');
      assert.equal(api.description, 'Suite / Hook');
      assert.equal(api.suite.name, 'Suite');
      assert.ok(!api.suite.skip);
    });

    it('should support callbacks', async () => {
      const hook = new Hook('Hook', (h, done) => {
        done();
      });

      const test = passingTest();
      const suite = new Suite('Suite').after(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, passed: 1 });
    });

    it('should timeout if callback is not invoked', async () => {
      // eslint-disable-next-line no-unused-vars
      const hook = new Hook('Hook', (h, done) => {
      }, { timeout: 100 });

      const test = passingTest();
      const suite = new Suite('Suite', { timeout: 100 }).after(hook).add(test);

      const report = await run(suite);

      assert.ok(report.failed);
      assert.stats(report.stats, { tests: 1, passed: 1 });
      assert.match(report.errors[0].message, /Timed out after 100ms/);
    });

    it('should timeout if promise is unresolved', async () => {
      // eslint-disable-next-line no-unused-vars
      const hook = new Hook('Hook', (h) => {
        return new Promise(() => {});
      }, { timeout: 100 });

      const test = passingTest();
      const suite = new Suite('Suite').after(hook).add(test);

      const report = await run(suite);

      assert.ok(report.failed);
      assert.stats(report.stats, { tests: 1, passed: 1 });
      assert.match(report.errors[0].message, /Timed out after 100ms/);
    });

    it('should bypass after hooks when there are no tests', async () => {
      const executed = [];
      const hook = new Hook('Hook', (h) => executed.push(h.name));
      const suite = new Suite('Suite').after(hook);

      await run(suite);

      assert.equal(executed.length, 0);
    });

    it('should run after hooks after a successful test', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
      const hook2 = new Hook('Hook 2', () => executed.push('After 2'));
      const test = new Test('Test', () => executed.push('Test'));
      const suite = new Suite('Suite').after(hook1, hook2).add(test);

      await run(suite);

      assert.equal(executed.length, 3);
      assert.equal(executed[0], 'Test');
      assert.equal(executed[1], 'After 1');
      assert.equal(executed[2], 'After 2');
    });

    it('should run after hooks after a failing test', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
      const hook2 = new Hook('Hook 2', () => executed.push('After 2'));
      const test = failingTest();
      const suite = new Suite('Suite').after(hook1, hook2).add(test);

      await run(suite);

      assert.equal(executed.length, 2);
      assert.equal(executed[0], 'After 1');
      assert.equal(executed[1], 'After 2');
    });

    it('should bypass after hooks after a skipped suite (suite configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('After'));
      const test = passingTest();
      const suite = new Suite('Suite', { skip: true }).after(hook).add(test);

      await run(suite);

      assert.equal(executed.length, 0);
    });

    it('should bypass after hooks after a skipped suite (runtime configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('After'));
      const test = passingTest();
      const suite = new Suite('Suite').after(hook).add(test);

      await run(suite, { skip: true });

      assert.equal(executed.length, 0);
    });

    it('should bypass after hooks after a skipped suite (harness configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('After'));
      const test = passingTest();
      const suite = new Suite('Suite').after(hook).add(test);
      const harness = new Harness(suite, { skip: true });

      await harness.run(new NullReporter());

      assert.equal(executed.length, 0);
    });

    it('should bypass after hooks after a skipped suite (suite configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('After'));
      const test = passingTest();
      const suite = new Suite('Suite', { skip: true }).after(hook).add(test);

      await run(suite);

      assert.equal(executed.length, 0);
    });

    it('should run after hooks after a skipped suite (programmatic)', async () => {
      const executed = [];
      const hook1 = new Hook('Before', (h) => h.suite.skip());
      const hook2 = new Hook('After', () => executed.push('After'));
      const test = passingTest();
      const suite = new Suite('Suite').before(hook1).after(hook2).add(test);

      await run(suite);

      assert.equal(executed.length, 1);
      assert.equal(executed[0], 'After');
    });

    it('should fail the suite if an after hook fails', async () => {
      const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
      const test = passingTest();
      const suite = new Suite('Suite').after(hook).add(test);

      const report = await run(suite);

      assert.ok(report.failed);
      assert.stats(report.stats, { tests: 1, passed: 1 });
    });

    it('should report a failure', async () => {
      const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
      const test1 = passingTest();
      const test2 = skippedTest();
      const suite = new Suite('Suite').after(hook).add(test1, test2);

      const report = await run(suite);

      assert.ok(report.failed);
      assert.stats(report.stats, { tests: 2, passed: 1, skipped: 1 });
    });

    it('should report a failure in a nested suite', async () => {
      const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
      const test1 = passingTest();
      const test2 = skippedTest();
      const suite1 = new Suite('Suite 1').after(hook).add(test1, test2);
      const suite2 = new Suite('Suite 2').add(suite1);

      const report = await run(suite2);

      assert.ok(report.failed);
      assert.stats(report.stats, { tests: 2, passed: 1, skipped: 1 });
    });

    it('should bypass remaining after hooks following a failure', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
      const hook2 = new Hook('Hook 2', () => { throw new Error('Oh Noes!'); });
      const hook3 = new Hook('Hook 3', () => executed.push('After 3'));
      const test = passingTest();
      const suite = new Suite('Suite').after(hook1, hook2, hook3).add(test);

      await run(suite);

      assert.equal(executed.length, 1);
      assert.equal(executed[0], 'After 1');
    });

    it('should bypass after hooks associated with skipped before hooks', async () => {
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
      const suite1 = new Suite('Suite 1').before(before1).after(after1).add(suite2);

      await run(suite1);

      assert.equal(executedBefore.length, 1);
      assert.equal(executedBefore[0], 'Before 1');

      assert.equal(executedAfter.length, 2);
      assert.equal(executedAfter[0], 'After 2');
      assert.equal(executedAfter[1], 'After 1');
    });
  });

  describe('Before Each', () => {

    it('should inject hook api', async () => {
      let api;
      const hook = new Hook('Hook', (h) => {
        api = h;
      });

      const test = passingTest();
      const suite = new Suite('Suite').beforeEach(hook).add(test);

      await run(suite);

      assert.equal(api.name, 'Hook');
      assert.equal(api.description, 'Suite / Test / Hook');
      assert.equal(api.test.name, 'Test');
      assert.ok(api.test.skip);
    });

    it('should programmatically skip test', async () => {
      const hook = new Hook('Hook', (h) => {
        h.test.skip('Because');
      });

      const test = passingTest();
      const suite = new Suite('Suite').beforeEach(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, skipped: 1 });
      assert.equal(report.resolve(0).reason, 'Because');
    });

    it('should support callbacks', async () => {
      const hook = new Hook('Hook', (h, done) => {
        done();
      });

      const test = passingTest();
      const suite = new Suite('Suite').beforeEach(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, passed: 1 });
    });

    it('should timeout if callback is not invoked', async () => {
      // eslint-disable-next-line no-unused-vars
      const hook = new Hook('Hook', (h, done) => {
      }, { timeout: 100 });

      const test = passingTest();
      const suite = new Suite('Suite').beforeEach(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.match(report.resolve(0).errors[0].message, /Timed out after 100ms/);
    });

    it('should timeout if promise is unresolved', async () => {
      // eslint-disable-next-line no-unused-vars
      const hook = new Hook('Hook', (h) => {
        return new Promise(() => {});
      }, { timeout: 100 });

      const test = passingTest();
      const suite = new Suite('Suite').beforeEach(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.match(report.resolve(0).errors[0].message, /Timed out after 100ms/);
    });

    it('should run before hooks before the test', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
      const hook2 = new Hook('Hook 2', () => executed.push('Before 2'));
      const test = new Test('Test', () => executed.push('Test'));
      const suite = new Suite('Suite').beforeEach(hook1, hook2).add(test);

      await run(suite);

      assert.equal(executed.length, 3);
      assert.equal(executed[0], 'Before 1');
      assert.equal(executed[1], 'Before 2');
      assert.equal(executed[2], 'Test');
    });

    it('should bypass before hooks before a skipped test (runtime configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('Before'));
      const test = passingTest();
      const suite = new Suite('Suite').beforeEach(hook).add(test);

      await run(suite, { skip: true });

      assert.equal(executed.length, 0);
    });

    it('should bypass before hooks before a skipped test (harness configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('Before'));
      const test = passingTest();
      const suite = new Suite('Suite').beforeEach(hook).add(test);
      const harness = new Harness(suite, { skip: true });

      await harness.run(new NullReporter());

      assert.equal(executed.length, 0);
    });

    it('should bypass before hooks before a skipped test (suite configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('Before'));
      const test = passingTest();
      const suite = new Suite('Suite', { skip: true }).beforeEach(hook).add(test);

      await run(suite);

      assert.equal(executed.length, 0);
    });

    it('should bypass before hooks before a skipped test (test configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('Before'));
      const test = skippedTest();
      const suite = new Suite('Suite', { skip: true }).beforeEach(hook).add(test);

      await run(suite);

      assert.equal(executed.length, 0);
    });

    it('should bypass before hooks before a skipped test (pending)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('Before'));
      const test = new Test('Test');
      const suite = new Suite('Suite').beforeEach(hook).add(test);

      await run(suite);

      assert.equal(executed.length, 0);
    });

    it('should bypass remaining before hooks following a skipped test (programmatic)', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
      const hook2 = new Hook('Hook 2', (h) => { h.test.skip('Whatever'); });
      const hook3 = new Hook('Hook 3', () => executed.push('Before 3'));
      const test = passingTest();
      const suite = new Suite('Suite').beforeEach(hook1, hook2, hook3).add(test);

      await run(suite);

      assert.equal(executed.length, 1);
    });

    it('should bypass remaining before hooks following a failure', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
      const hook2 = new Hook('Hook 2', () => { throw new Error('Oh Noes!'); });
      const hook3 = new Hook('Hook 3', () => executed.push('Before 3'));
      const test = passingTest();
      const suite = new Suite('Suite').beforeEach(hook1, hook2, hook3).add(test);

      await run(suite);

      assert.equal(executed.length, 1);
    });

    it('should fail the test if a before hook fails', async () => {
      const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
      const test = passingTest();
      const suite = new Suite('Suite').beforeEach(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, failed: 1 });
    });
  });

  describe('After Each', () => {

    it('should inject hook api', async () => {
      let api;
      const hook = new Hook('Hook', (h) => {
        api = h;
      });

      const test = passingTest();
      const suite = new Suite('Suite').afterEach(hook).add(test);

      await run(suite);

      assert.equal(api.name, 'Hook');
      assert.equal(api.description, 'Suite / Test / Hook');
      assert.equal(api.test.name, 'Test');
      assert.ok(!api.test.skip);
    });

    it('should support callbacks', async () => {
      const hook = new Hook('Hook', (h, done) => {
        done();
      });

      const test = passingTest();
      const suite = new Suite('Suite').afterEach(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, passed: 1 });
    });

    it('should timeout if callback is not invoked', async () => {
      // eslint-disable-next-line no-unused-vars
      const hook = new Hook('Hook', (h, done) => {
      }, { timeout: 100 });

      const test = passingTest();
      const suite = new Suite('Suite').afterEach(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.match(report.resolve(0).errors[0].message, /Timed out after 100ms/);
    });

    it('should timeout if promise is unresolved', async () => {
      // eslint-disable-next-line no-unused-vars
      const hook = new Hook('Hook', (h) => {
        return new Promise(() => {});
      }, { timeout: 100 });

      const test = passingTest();
      const suite = new Suite('Suite').afterEach(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.match(report.resolve(0).errors[0].message, /Timed out after 100ms/);
    });

    it('should run after hooks after a successful test', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
      const hook2 = new Hook('Hook 2', () => executed.push('After 2'));
      const test = new Test('Test', () => executed.push('Test'));
      const suite = new Suite('Suite').afterEach(hook1, hook2).add(test);

      await run(suite);

      assert.equal(executed.length, 3);
      assert.equal(executed[0], 'Test');
      assert.equal(executed[1], 'After 1');
      assert.equal(executed[2], 'After 2');
    });

    it('should run after hooks after a failing test', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
      const hook2 = new Hook('Hook 2', () => executed.push('After 2'));
      const test = failingTest();
      const suite = new Suite('Suite').afterEach(hook1, hook2).add(test);

      await run(suite);

      assert.equal(executed.length, 2);
      assert.equal(executed[0], 'After 1');
      assert.equal(executed[1], 'After 2');
    });

    it('should bypass after hooks after a skipped test (test configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('After'));
      const test = skippedTest();
      const suite = new Suite('Suite').afterEach(hook).add(test);

      await run(suite);

      assert.equal(executed.length, 0);
    });

    it('should bypass after hooks after a skipped test (runtime configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('After'));
      const test = passingTest();
      const suite = new Suite('Suite').afterEach(hook).add(test);

      await run(suite, { skip: true });

      assert.equal(executed.length, 0);
    });

    it('should bypass after hooks after a skipped test (harness configuration)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('After'));
      const test = passingTest();
      const suite = new Suite('Suite').afterEach(hook).add(test);
      const harness = new Harness(suite, { skip: true });

      await harness.run(new NullReporter());

      assert.equal(executed.length, 0);
    });

    it('should run after hooks after a skipped test (programmatic)', async () => {
      const executed = [];
      const hook = new Hook('Hook', () => executed.push('After'));
      const test = new Test('Test', skip());
      const suite = new Suite('Suite').afterEach(hook).add(test);

      await run(suite);

      assert.equal(executed.length, 1);
      assert.equal(executed[0], 'After');
    });

    it('should fail the test if an after hook fails', async () => {
      const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
      const test = passingTest();
      const suite = new Suite('Suite').afterEach(hook).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, failed: 1 });
    });

    it('should bypass remaining after hooks following a failure', async () => {
      const executed = [];
      const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
      const hook2 = new Hook('Hook 2', () => { throw new Error('Oh Noes!'); });
      const hook3 = new Hook('Hook 3', () => executed.push('After 3'));
      const test = passingTest();
      const suite = new Suite('Suite').afterEach(hook1, hook2, hook3).add(test);

      await run(suite);

      assert.equal(executed.length, 1);
      assert.equal(executed[0], 'After 1');
    });

    it('should bypass after hooks associated with skipped before hooks', async () => {
      const executedBefore = [];
      const before1 = new Hook('Before 1', () => executedBefore.push('Before 1'));
      const before2 = new Hook('Before 2', () => { throw new Error('Oh Noes!'); });
      const before3 = new Hook('Before 3', () => executedBefore.push('Before 3'));

      const executedAfter = [];
      const after1 = new Hook('After 1', () => executedAfter.push('After 1'));
      const after2 = new Hook('After 2', () => executedAfter.push('After 2'));
      const after3 = new Hook('After 3', () => executedAfter.push('After 3'));

      const test = passingTest();
      const suite3 = new Suite('Suite 3').beforeEach(before3).afterEach(after3).add(test);
      const suite2 = new Suite('Suite 2').beforeEach(before2).afterEach(after2).add(suite3);
      const suite1 = new Suite('Suite 1').beforeEach(before1).afterEach(after1).add(suite2);

      await run(suite1);

      assert.equal(executedBefore.length, 1);
      assert.equal(executedBefore[0], 'Before 1');

      assert.equal(executedAfter.length, 2);
      assert.equal(executedAfter[0], 'After 2');
      assert.equal(executedAfter[1], 'After 1');
    });
  });

  async function run(testable, options) {
    const harness = new Harness(testable);
    const reporter = new GraphReporter();
    await harness.run(reporter, options);
    return reporter.toGraph();
  }

});
