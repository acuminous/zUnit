const assert = require('assert');
const { Harness, Suite, Test, before, beforeEach, describe, it } = require('..');

const hooksSuite = new Suite('Hooks')
  .add(new Test('should name a hooks', async () => {
    const names = [];
    const suite = describe('Suite', () => {
      before('one', (h) => {
        names.push(h.name);
      });
      beforeEach('two', (h) => {
        names.push(h.name);
      });
      beforeEach('three', (h) => {
        names.push(h.name);
      });
      afterEach('four', (h) => {
        names.push(h.name);
      });
      afterEach('five', (h) => {
        names.push(h.name);
      });
      after('six', (h) => {
        names.push(h.name);
      });

      it('Test', () => {});
    });

    const harness = new Harness(suite);

    await harness.run();
    assert.deepStrictEqual(names, ['one', 'two', 'three', 'four', 'five', 'six']);
  }))
  .add(new Test('should configure before hooks with a timeout', async () => {
    const suite = describe('Suite', () => {
      before(async () => {
        return new Promise((resolve) => {
          setTimeout(resolve, 200);
        });
      }, { timeout: 100 });

      it('Test', () => {});
    });

    const harness = new Harness(suite);

    const report = await harness.run();
    assert.ok(report.failed);
    assert.ok(report.incomplete);
    assert.stats(report.stats, { tests: 1 });
    assert.match(report.errors[0].message, /Timed out after 100ms/);
  }))
  .add(new Test('should configure beforeEach hooks with a timeout', async () => {
    const suite = describe('Suite', () => {
      beforeEach(async () => {
        return new Promise((resolve) => {
          setTimeout(resolve, 200);
        });
      }, { timeout: 100 });

      it('Test', () => {});
    });

    const harness = new Harness(suite);

    const report = await harness.run();
    assert.ok(report.failed);
    assert.ok(!report.incomplete);
    assert.stats(report.stats, { tests: 1, failed: 1 });
    assert.match(report.resolve(0).errors[0].message, /Timed out after 100ms/);
  }))
  .add(new Test('should configure after hooks with a timeout', async () => {
    const suite = describe('Suite', () => {
      after(async () => {
        return new Promise((resolve) => {
          setTimeout(resolve, 200);
        });
      }, { timeout: 100 });

      it('Test', () => {});
    });

    const harness = new Harness(suite);

    const report = await harness.run();
    assert.ok(report.failed);
    assert.ok(!report.incomplete);
    assert.stats(report.stats, { tests: 1, passed: 1 });
    assert.match(report.errors[0].message, /Timed out after 100ms/);
  }))
  .add(new Test('should configure afterEach hooks with a timeout', async () => {
    const suite = describe('Suite', () => {
      afterEach(async () => {
        return new Promise((resolve) => {
          setTimeout(resolve, 200);
        });
      }, { timeout: 100 });

      it('Test', () => {});
    });

    const harness = new Harness(suite);

    const report = await harness.run();
    assert.ok(report.failed);
    assert.ok(!report.incomplete);
    assert.stats(report.stats, { tests: 1, failed: 1 });
    assert.match(report.resolve(0).errors[0].message, /Timed out after 100ms/);
  }));

const exclusiveSuite = new Suite('Exclusive')
  .add(new Test('should configure exclusive suites', async () => {
    const suite = describe('Suite 1', () => {
      describe('Suite 2', () => {
        it('Test 1', () => {});
      }, { exclusive: true });

      describe('Suite 3', () => {
        it('Test 2', () => {});
      });
    });

    const harness = new Harness(suite);

    const report = await harness.run();
    assert.ok(report.incomplete);
    assert.stats(report.stats, { tests: 2, passed: 1 });
  }))
  .add(new Test('should configure exclusive tests', async () => {
    const suite = describe('Suite', () => {
      it('Test 1', () => {}, { exclusive: true });
      it('Test 2', () => {});
    });

    const harness = new Harness(suite);

    const report = await harness.run();
    assert.ok(report.incomplete);
    assert.stats(report.stats, { tests: 2, passed: 1 });
  }));

const skippedSuite = new Suite('Skipped')
  .add(new Test('should configure skipped suites', async () => {
    const suite = describe('Suite 1', () => {
      describe('Suite 2', () => {
        it('Test 1', () => {});
      }, { skip: true });

      describe('Suite 3', () => {
        it('Test 2', () => {});
      });
    });

    const harness = new Harness(suite);

    const report = await harness.run();
    assert.ok(report.incomplete);
    assert.stats(report.stats, { tests: 2, passed: 1, skipped: 1 });
  }))
  .add(new Test('should configure skipped tests', async () => {
    const suite = describe('Suite', () => {
      it('Test 1', () => {}, { skip: true });
      it('Test 2', () => {});
    });

    const harness = new Harness(suite);

    const report = await harness.run();
    assert.ok(report.incomplete);
    assert.stats(report.stats, { tests: 2, passed: 1, skipped: 1 });
  }));

module.exports = new Suite('Syntax').add(hooksSuite, exclusiveSuite, skippedSuite);