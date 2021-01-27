const assert = require('assert');
const { Harness, Suite, Test, syntax } = require('..');

module.exports = new Suite('Syntax')

  .add(new Test('should configure before hooks with a timeout', async () => {
    const suite = syntax.describe('h1', () => {
      syntax.before(async () => {
        return new Promise((resolve) => {
          setTimeout(resolve, 200);
        });
      }, { timeout: 100 });

      syntax.it('t1', () => {
        assert.fail('Should not have run');
      });
    });

    const harness = new Harness(suite);

    const report = await harness.run();
    assert.ok(report.failed);
    assert.ok(report.incomplete);
    assert.stats(report.stats, { tests: 1 });
    assert.match(report.errors[0].message, /Timed out after 100ms/);    
  }))

  .add(new Test('should configure beforeEach hooks with a timeout', async () => {
    const suite = syntax.describe('h1', () => {
      syntax.beforeEach(async () => {
        return new Promise((resolve) => {
          setTimeout(resolve, 200);
        });
      }, { timeout: 100 });

      syntax.it('t1', () => {
        assert.fail('Should not have run');
      });
    });

    const harness = new Harness(suite);

    const report = await harness.run();
    assert.ok(report.failed);
    assert.ok(!report.incomplete);
    assert.stats(report.stats, { tests: 1, failed: 1 });
    assert.match(report.resolve(0).errors[0].message, /Timed out after 100ms/);    
  }));
