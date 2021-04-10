const assert = require('assert');
const { run, pass, fail, skip, timeout } = require('./support/helpers');
const { Harness, Test, GraphReporter } = require('..');

describe('Test', () => {

  describe('Async', () => {

    it('should execute a passing async function', async () => {
      const test = new Test('Test', pass());

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, passed: 1 });
    });

    it('should execute a failing async function', async () => {
      const test = new Test('Test', fail());

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.strictEqual(report.errors[0].message, 'Oh Noes!');
    });
  });

  describe('Sync', () => {

    it('should execute a passing sync function', async () => {
      const test = new Test('Test', () => {
        assert.ok(true);
      });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, passed: 1 });
    });

    it('should execute a failing sync function (throws)', async () => {
      const test = new Test('Test', () => {
        assert.ok(false);
      });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.match(report.errors[0].message, /The expression evaluated to a falsy value/);
    });
  });

  describe('Callbacks', () => {

    it('should execute passing sync function (done)', async () => {
      const test = new Test('Test', (t, done) => {
        done();
      });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, passed: 1 });
    });

    it('should execute failing sync function (done)', async () => {
      const test = new Test('Test', (t, done) => {
        done(new Error('Oh Noes!'));
      });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.match(report.errors[0].message, /Oh Noes!/);
    });

    it('should execute failing sync function (throws)', async () => {
      const test = new Test('Test', async (t, done) => {
        assert.ok(false);
        done();
      });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.match(report.errors[0].message, /The expression evaluated to a falsy value/);
    });

    it('should execute passing async function (done)', async () => {
      const test = new Test('Test', async (t, done) => {
        done();
      });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, passed: 1 });
    });

    it('should execute failing async function (done)', async () => {
      const test = new Test('Test', async (t, done) => {
        done(new Error('Oh Noes!'));
      });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.match(report.errors[0].message, /Oh Noes!/);
    });

    it('should execute failing async function (throws)', async () => {
      const test = new Test('Test', async (t, done) => {
        assert.ok(false);
        done();
      });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.match(report.errors[0].message, /The expression evaluated to a falsy value/);
    });

    it('should error if done is called twice', async () => {
      const test = new Test('Test', async (t, done) => {
        done();
        done();
      });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.match(report.errors[0].message, /done already called/);
    });
  });

  describe('Duration', () => {

    it('should calculate the duration for passing tests', async () => {
      const test = new Test('Test', pass({ delay: 100 }));

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, passed: 1, duration: 99 });
    });

    it('should calculate the duration for failing tests', async () => {
      const test = new Test('Test', fail({ delay: 100 }));

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, failed: 1, duration: 99 });
    });
  });

  describe('Timeout', () => {

    it('should timeout slow asynchronous tests (runtime configuration)', async () => {
      const test = new Test('Test', pass({ delay: 200 }));

      const report = await run(test, { timeout: 100 });

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.strictEqual(report.errors[0].message, 'Timed out after 100ms');
    });

    it('should timeout slow tests (harness configuration)', async () => {
      const test = new Test('Test', pass({ delay: 200 }));
      const harness = new Harness(test, { timeout: 100 });
      const reporter = new GraphReporter();

      await harness.run(reporter);

      const report = reporter.toGraph();
      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.strictEqual(report.errors[0].message, 'Timed out after 100ms');
    });

    it('should timeout slow tests (test configuration)', async () => {
      const test = new Test('Test', pass({ delay: 200 }), { timeout: 100 });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.strictEqual(report.errors[0].message, 'Timed out after 100ms');
    });
  });

  describe('Skip', () => {
    it('should bypass skipped tests (runtime configuration)', async () => {
      const test = new Test('Test', fail());

      const report = await run(test, { skip: true });

      assert.stats(report.stats, { tests: 1, skipped: 1 });
    });

    it('should bypass skipped tests (harness configuration)', async () => {
      const test = new Test('Test', fail());
      const harness = new Harness(test, { skip: true });
      const reporter = new GraphReporter();

      await harness.run(reporter);

      const report = reporter.toGraph();
      assert.stats(report.stats, { tests: 1, skipped: 1 });
    });

    it('should bypass skipped tests (test configuration)', async () => {
      const test = new Test('Test', fail(), { skip: true });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, skipped: 1 });
    });

    it('should bypass skipped tests (programmatic)', async () => {
      const test = new Test('Test', skip());

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, skipped: 1 });
      assert.strictEqual(report.reason, undefined);
    });

    it('should support skipped reason (programmatic)', async () => {
      const test = new Test('Test', skip({ reason: 'because' }));

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, skipped: 1 });
      assert.strictEqual(report.reason, 'because');
    });

    it('should bypass skipped tests (pending)', async () => {
      const test = new Test('Test');

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, skipped: 1 });
      assert.strictEqual(report.reason, 'Pending');
    });
  });

  describe('Incomplete Tests', () => {

    it('should timeout unresolved promises', async () => {
      const test = new Test('Test', timeout(), { timeout: 200 });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.strictEqual(report.errors[0].message, 'Timed out after 200ms');
    });

    it('should timeout unused done', async () => {
      // eslint-disable-next-line no-unused-vars
      const test = new Test('Test', async (t, done) => {
      }, { timeout: 100 });

      const report = await run(test);

      assert.stats(report.stats, { tests: 1, failed: 1 });
      assert.strictEqual(report.errors[0].message, 'Timed out after 100ms');
    });

  });

  describe('Points', () => {

    it('should assign a test point to an individual test', async () => {
      const test = new Test('Test', pass());

      const report = await run(test);

      assert.strictEqual(report.name, 'Test');
      assert.strictEqual(report.point, 1);
    });
  });

});
