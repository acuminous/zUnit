const assert = require('assert');
const { Harness, Suite } = require('..');
const { skippedTest } = require('./support/helpers');

describe('Harness', () => {

  describe('Run', () => {

    it('should error if not initialised with a testable', async () => {
      const harness = new Harness();
      const messagePattern = /The harness must be initialised with a suite or test/;
      await assert.rejects(async () => harness.run(), messagePattern);
      await assert.rejects(async () => harness.run({}), messagePattern);
    });

    it('should report incomplete suites', async () => {
      const test = skippedTest();
      const suite = new Suite('Suite').add(test);
      const harness = new Harness(suite);

      const report = await harness.run();

      assert.equal(report.incomplete, true);
    });
  });

});
