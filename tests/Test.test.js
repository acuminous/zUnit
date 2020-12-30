const assert = require('assert');
const { run, pass, fail, skip, timeout } = require('./support/helpers');
const { Harness, Test, GraphReporter } = require('..');

describe('Test', () => {

  describe('Normal', () => {

    it('should executing passing function', async () => {
      const test = new Test('Test', pass({ delay: 100 }));

      const report = await run(test);

      assert.stats(report.stats, { tested: 1, passed: 1 });
      assert.ok(report.duration >= 100);
    });

    it('should execute failing function', async () => {
      const test = new Test('Test', fail({ delay: 100 }));

      const report = await run(test);

      assert.stats(report.stats, { tested: 1, failed: 1 });
      assert.equal(report.error.message, 'Oh Noes!');
      assert.ok(report.duration >= 100);
    });
  });

  describe('Timeout', () => {

    it('should timeout slow asynchronous tests (runtime configuration)', async () => {
      const test = new Test('Test', pass({ delay: 200 }));

      const report = await run(test, { timeout: 100 });

      assert.stats(report.stats, { tested: 1, failed: 1 });
      assert.equal(report.error.message, 'Timed out after 100ms');
    });

    it('should timeout slow tests (harness configuration)', async () => {
      const test = new Test('Test', pass({ delay: 200 }));
      const harness = new Harness(test, { timeout: 100 });
      const reporter = new GraphReporter();

      await harness.run(reporter);

      const report = reporter.toGraph();
      assert.stats(report.stats, { tested: 1, failed: 1 });
      assert.equal(report.error.message, 'Timed out after 100ms');
    });

    it('should timeout slow tests (test configuration)', async () => {
      const test = new Test('Test', pass({ delay: 200 }), { timeout: 100 });

      const report = await run(test);

      assert.stats(report.stats, { tested: 1, failed: 1 });
      assert.equal(report.error.message, 'Timed out after 100ms');
    });
  });

  describe('Skip', () => {
    it('should bypass skipped tests (runtime configuration)', async () => {
      const test = new Test('Test', fail());

      const report = await run(test, { skip: true });

      assert.stats(report.stats, { tested: 1, skipped: 1 });
    });

    it('should bypass skipped tests (harness configuration)', async () => {
      const test = new Test('Test', fail());
      const harness = new Harness(test, { skip: true });
      const reporter = new GraphReporter();

      await harness.run(reporter);

      const report = reporter.toGraph();
      assert.stats(report.stats, { tested: 1, skipped: 1 });
    });

    it('should bypass skipped tests (test configuration)', async () => {
      const test = new Test('Test', fail(), { skip: true });

      const report = await run(test);

      assert.stats(report.stats, { tested: 1, skipped: 1 });
    });

    it('should bypass skipped tests (programmatic)', async () => {
      const test = new Test('Test', skip());

      const report = await run(test);

      assert.stats(report.stats, { tested: 1, skipped: 1 });
      assert.equal(report.reason, undefined);
    });

    it('should support skipped reason (programmatic)', async () => {
      const test = new Test('Test', skip({ reason: 'because' }));

      const report = await run(test);

      assert.stats(report.stats, { tested: 1, skipped: 1 });
      assert.equal(report.reason, 'because');
    });

    it('should bypass skipped tests (pending)', async () => {
      const test = new Test('Test');

      const report = await run(test);

      assert.stats(report.stats, { tested: 1, skipped: 1 });
      assert.equal(report.reason, 'Pending');
    });
  });

  describe('Unresolved Promises', () => {

    it('should timeout unresolved promises', async () => {
      const test = new Test('Test', timeout(), { timeout: 200 });

      const report = await run(test);

      assert.stats(report.stats, { tested: 1, failed: 1 });
      assert.equal(report.error.message, 'Timed out after 200ms');
    });

  });

  describe('Points', () => {

    it('should assign a test point to an individual test', async () => {
      const test = new Test('Test', pass());

      const report = await run(test);

      assert.equal(report.name, 'Test');
      assert.equal(report.point, 1);
    });
  });

});

