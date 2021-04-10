const assert = require('assert');
const { run, fail, pass, passingTest, failingTest, skippedTest, exclusiveTest } = require('./support/helpers');
const { Suite, Test, describe, it } = require('..');

describe('Suite', () => {

  describe('Discover', () => {

    it('should report missing directory', async() => {
      const suite = new Suite('Suite', { directory: '' });
      assert.throws(() => suite.discover(), /Error: directory is a required option/);
    });
  });

  describe('Normal', () => {

    it('should report successful tests', async () => {
      const test1 = passingTest();
      const test2 = passingTest();
      const suite = new Suite('Suite').add(test1, test2);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 2, passed: 2 });
    });

    it('should report failing tests', async () => {
      const test1 = passingTest();
      const test2 = failingTest();
      const suite = new Suite('Suite').add(test1, test2);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 2, passed: 1, failed: 1 });
    });

    it('should report failing tests in nested suites', async () => {
      const test1 = passingTest();
      const test2 = failingTest();
      const test3 = passingTest();
      const suite1 = new Suite('Suite 1').add(test1, test2);
      const suite2 = new Suite('Suite 2').add(test3);
      const suite3 = new Suite('Suite 3').add(suite1, suite2);

      const report = await run(suite3);

      assert.stats(report.stats, { tests: 3, passed: 2, failed: 1 });
    });
  });

  describe('Timeout', () => {

    it('should timeout slow tests (suite configuration)', async () => {
      const test = new Test('Test', pass({ delay: 200 }));
      const suite = new Suite('Suite', { timeout: 100 }).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.strictEqual(report.resolve(0).errors[0].message, 'Timed out after 100ms');
    });
  });

  describe('Skip', () => {

    it('should skip tests (run configuration)', async () => {
      const test1 = passingTest();
      const test2 = failingTest();
      const test3 = passingTest();
      const suite = new Suite('Suite').add(test1, test2, test3);

      const report = await run(suite, { skip: true });

      assert.stats(report.stats, { tests: 3, skipped: 3 });
    });

    it('should skip tests (suite configuration)', async () => {
      const test1 = passingTest();
      const test2 = failingTest();
      const test3 = passingTest();
      const suite = new Suite('Suite', { skip: true }).add(test1, test2, test3);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 3, skipped: 3 });
    });

    it('should run subsequent tests after skip (test configuration)', async () => {
      const test1 = passingTest();
      const test2 = skippedTest();
      const test3 = passingTest();
      const suite = new Suite('Suite').add(test1, test2, test3);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 3, passed: 2, skipped: 1 });
    });

    it('should run subsequent tests after skip (suite configuration)', async () => {
      const test1 = passingTest();
      const test2 = passingTest();
      const test3 = passingTest();
      const suite1 = new Suite('Suite 1', { skip: true }).add(test1, test2);
      const suite2 = new Suite('Suite 2').add(test3);
      const suite3 = new Suite('Suite 3').add(suite1, suite2);

      const report = await run(suite3);

      assert.stats(report.stats, { tests: 3, passed: 1, skipped: 2 });
    });

    it('should skip parent suites', async () => {
      const test1 = passingTest();
      const test2 = skippedTest();
      const test3 = passingTest();
      const suite1 = new Suite('Suite 1').add(test1, test2);
      const suite2 = new Suite('Suite 2').add(test3);
      const suite3 = new Suite('Suite 3', { skip: true }).add(suite1, suite2);

      const report = await run(suite3);

      assert.stats(report.stats, { tests: 3, skipped: 3 });
    });

    it('should skip nested suites', async () => {
      const test1 = passingTest();
      const test2 = skippedTest();
      const test3 = passingTest();
      const suite1 = new Suite('Suite 1', { skip: true }).add(test1, test2);
      const suite2 = new Suite('Suite 2').add(test3);
      const suite3 = new Suite('Suite 3').add(suite1, suite2);

      const report = await run(suite3);

      assert.stats(report.stats, { tests: 3, passed: 1, skipped: 2 });
    });

    it('should skip nested tests', async () => {
      const test1 = passingTest();
      const test2 = skippedTest();
      const test3 = passingTest();
      const suite1 = new Suite('Suite 1').add(test1, test2);
      const suite2 = new Suite('Suite 2').add(test3);
      const suite3 = new Suite('Suite 3').add(suite1, suite2);

      const report = await run(suite3);

      assert.stats(report.stats, { tests: 3, passed: 2, skipped: 1 });
    });
  });

  describe('Abort', () => {

    it('should abort early (run configuration)', async () => {
      const test1 = failingTest();
      const test2 = passingTest();
      const suite = new Suite('Suite').add(test1, test2);

      const report = await run(suite, { abort: true });

      assert.stats(report.stats, { tests: 2, skipped: 1, failed: 1 });
    });

    it('should aborting early (suite configuration)', async () => {
      const test1 = failingTest();
      const test2 = passingTest();
      const suite = new Suite('Suite', { abort: true }).add(test1, test2);

      const report = await run(suite, { abort: true });

      assert.stats(report.stats, { tests: 2, skipped: 1, failed: 1 });
    });
  });

  describe('Exclusive', () => {

    it('should only run exclusive tests (test configuration)', async () => {
      const test1 = passingTest();
      const test2 = exclusiveTest();
      const suite = new Suite('Suite').add(test1, test2);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 2, passed: 1 });
    });

    it('should only run exclusive tests (suite configuration)', async () => {
      const test1 = passingTest();
      const test2 = passingTest();
      const test3 = passingTest();
      const suite1 = new Suite('Suite 1', { exclusive: true }).add(test1, test2);
      const suite2 = new Suite('Suite 2').add(test3);
      const suite3 = new Suite('Suite 3').add(suite1, suite2);

      const report = await run(suite3);

      assert.stats(report.stats, { tests: 3, passed: 2 });
    });

    it('should only run exclusive tests (suite and test configuration)', async () => {
      const test1 = passingTest();
      const test2 = exclusiveTest();
      const test3 = passingTest();
      const suite1 = new Suite('Suite 1', { exclusive: true }).add(test1, test2);
      const suite2 = new Suite('Suite 2').add(test3);
      const suite3 = new Suite('Suite 3').add(suite1, suite2);

      const report = await run(suite3);

      assert.stats(report.stats, { tests: 3, passed: 1 });
    });

    it('should only run exclusive tests (separate suite and test configuration)', async () => {
      const test1 = passingTest();
      const test2 = passingTest();
      const test3 = exclusiveTest();
      const suite1 = new Suite('Suite 1', { exclusive: true }).add(test1);
      const suite2 = new Suite('Suite 2').add(test2, test3);
      const suite3 = new Suite('Suite 3').add(suite1, suite2);

      const report = await run(suite3);

      assert.stats(report.stats, { tests: 3, passed: 2 });
    });

    it('should bypass skipped, exclusive tests (suite configuration)', async () => {
      const test = passingTest();
      const suite = new Suite('Suite', { skip: true, exclusive: true }).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, skipped: 1 });
    });

    it('should bypass skipped, exclusive tests (test configuration)', async () => {
      const test = new Test('Test', fail(), { skip: true, exclusive: true });
      const suite = new Suite('Suite').add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, skipped: 1 });
    });

    it('should skip the exclusive test with a skipped suite', async () => {
      const test = exclusiveTest();
      const suite = new Suite('Suite', { skip: true }).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, skipped: 1 });
    });

    it('should bypass a skipped test within an exclusive suite', async () => {
      const test = skippedTest();
      const suite = new Suite('Suite', { exclusive: true }).add(test);

      const report = await run(suite);

      assert.stats(report.stats, { tests: 1, skipped: 1 });
    });

  });

  describe('Nesting', () => {

    it('should support nesting', async () => {
      const test1 = passingTest('Test 1');
      const test2 = failingTest('Test 2');
      const test3 = passingTest('Test 3');
      const suite1 = new Suite('Suite 1').add(test1, test2);
      const suite2 = new Suite('Suite 2').add(test3);
      const suite3 = new Suite('Suite 3').add(suite1, suite2);

      const report = await run(suite3);

      assert.strictEqual(report.passed, false);
      assert.strictEqual(report.name, 'Suite 3');
      assert.strictEqual(report.stats.passed, 2);
      assert.strictEqual(report.stats.failed, 1);
      assert.strictEqual(report.stats.skipped, 0);

      assert.strictEqual(report.resolve(0).name, 'Suite 1');
      assert.strictEqual(report.resolve(0).passed, false);
      assert.strictEqual(report.resolve(0).stats.passed, 1);
      assert.strictEqual(report.resolve(0).stats.failed, 1);
      assert.strictEqual(report.resolve(0).stats.skipped, 0);

      assert.strictEqual(report.resolve(1).name, 'Suite 2');
      assert.strictEqual(report.resolve(1).passed, true);
      assert.strictEqual(report.resolve(1).stats.passed, 1);
      assert.strictEqual(report.resolve(1).stats.failed, 0);
      assert.strictEqual(report.resolve(1).stats.skipped, 0);

      assert.strictEqual(report.resolve(0, 0).name, 'Test 1');
      assert.strictEqual(report.resolve(0, 0).passed, true);
      assert.strictEqual(report.resolve(0, 1).name, 'Test 2');
      assert.strictEqual(report.resolve(0, 1).failed, true);
      assert.strictEqual(report.resolve(1, 0).name, 'Test 3');
      assert.strictEqual(report.resolve(1, 0).passed, true);
    });
  });

  describe('Points', () => {

    it('should assign test points to tests in a suite', async () => {
      const test1 = new Test('Test 1', pass());
      const test2 = new Test('Test 2', pass());
      const suite = new Suite('Suite').add(test1, test2);

      const report = await run(suite);

      assert.strictEqual(report.resolve(0).name, 'Test 1');
      assert.strictEqual(report.resolve(0).point, 1);

      assert.strictEqual(report.children[1].name, 'Test 2');
      assert.strictEqual(report.children[1].point, 2);
    });

    it('should assign test points in the order tests are added to a suite', async () => {
      const test1 = new Test('Test 1', pass());
      const test2 = new Test('Test 2', pass());
      const suite = new Suite('Suite').add(test2, test1);

      const report = await run(suite);

      assert.strictEqual(report.resolve(0).name, 'Test 2');
      assert.strictEqual(report.resolve(0).point, 1);

      assert.strictEqual(report.children[1].name, 'Test 1');
      assert.strictEqual(report.children[1].point, 2);
    });

    it('should assign test points to tests in a nested suite', async () => {
      const test1 = new Test('Test 1', pass());
      const test2 = new Test('Test 2', pass());
      const test3 = new Test('Test 3', pass());
      const suite1 = new Suite('Suite 1').add(test1, test2);
      const suite2 = new Suite('Suite 2').add(test3);
      const suite3 = new Suite('Suite 3').add(suite1, suite2);

      const report = await run(suite3);

      assert.strictEqual(report.resolve(0, 0).name, 'Test 1');
      assert.strictEqual(report.resolve(0, 0).point, 1);

      assert.strictEqual(report.resolve(0, 1).name, 'Test 2');
      assert.strictEqual(report.resolve(0, 1).point, 2);

      assert.strictEqual(report.resolve(1, 0).name, 'Test 3');
      assert.strictEqual(report.resolve(1, 0).point, 3);
    });

    it('should assign different test points to the same test', async () => {
      const test = new Test('Test', pass());
      const suite = new Suite('Suite').add(test, test);

      const report = await run(suite);

      assert.strictEqual(report.resolve(0).name, 'Test');
      assert.strictEqual(report.resolve(0).point, 1);

      assert.strictEqual(report.children[1].name, 'Test');
      assert.strictEqual(report.children[1].point, 2);
    });
  });

});
