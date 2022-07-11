const assert = require('assert');
const path = require('path');
const { Harness, Suite } = require('..');

describe('Example', () => {
  it('should run the example project', async () => {
    const directory = path.join(process.cwd(), 'example', 'test');
    const suite = new Suite('Example').discover({ directory });
    const harness = new Harness(suite);

    const report = await harness.run();

    assert.stats(report.stats, { tests: 28, passed: 11, failed: 1, skipped: 16 });
  });
});
