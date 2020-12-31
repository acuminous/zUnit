const assert = require('assert');
const { Harness } = require('..');

describe('Harness', () => {

  describe('Run', () => {

    it('should error if not initialised with a testable', async () => {
      const harness = new Harness();
      const messagePattern = /The harness must be initialised with a suite or test/;
      await assert.rejects(async () => harness.run(), messagePattern);
      await assert.rejects(async () => harness.run({}), messagePattern);
    });
  });

});

