const assert = require('assert');
const { pass, fail, skip } = require('./support/fixtures');
const { describe, NullReporter, Test, Hook } = require('..');

describe('Tests', ({ describe, it }) => {

  const reporter = new NullReporter();

  it('should run successful asynchronous tests', async () => {
    const test = new Test('Test', pass({ delay: 100 }));

    await test.run(reporter);

    assert.equal(test.passed, true);
    assert.ok(test.duration >= 100);
  });

  it('should run failing asynchronous tests', async () => {
    const test = new Test('Test', fail({ delay: 100 }));

    await test.run(reporter);

    assert.equal(test.failed, true);
    assert.equal(test.error.message, 'Oh Noes!');
    assert.ok(test.duration >= 100);
  });

  it('should abort slow asynchronous tests (runtime configuration)', async () => {
    const test = new Test('Test', pass({ delay: 200 }));

    await test.run(reporter, { timeout: 100 });

    assert.equal(test.failed, true);
    assert.equal(test.error.message, 'Timed out after 100ms');
  });

  it('should abort slow tests (inherited configuration)');

  it('should abort slow tests (test configuration)', async () => {
    const test = new Test('Test', pass({ delay: 200 }), { timeout: 100 });

    await test.run(reporter);

    assert.equal(test.failed, true);
    assert.equal(test.error.message, 'Timed out after 100ms');
  });

  it('should bypass skipped tests (runtime configuration)', async () => {
    const test = new Test('Test', fail());

    await test.run(reporter, { skip: true });

    assert.equal(test.skipped, true);
  });

  it('should bypass skipped tests (inherited configuration)');

  it('should bypass skipped tests (test configuration)', async () => {
    const test = new Test('Test', fail(), { skip: true });

    await test.run(reporter);

    assert.equal(test.skipped, true);
  });

  it('should bypass skipped tests (programmatic)', async () => {
    const test = new Test('Test', (t) => {
      return new Promise((resolve) => {
        t.skip();
        resolve();
      });
    });

    await test.run(reporter);

    assert.equal(test.skipped, true);
    assert.equal(test.reason, undefined);
  });

  it('should support skipped reason (programmatic)', async () => {
    const test = new Test('Test', (t) => {
      return new Promise((resolve) => {
        t.skip('because');
        resolve();
      });
    });

    await test.run(reporter);

    assert.equal(test.skipped, true);
    assert.equal(test.reason, 'because');
  });

  it('should bypass skipped tests (pending)', async () => {
    const test = new Test('Test');

    await test.run(reporter);

    assert.equal(test.skipped, true);
  });

  it('should timeout unresolved promises', async () => {
    const test = new Test('Test', () => {
      return new Promise(() => {});
    }, { timeout: 200 });

    await test.run(reporter);

    assert.equal(test.failed, true);
    assert.equal(test.error.message, 'Timed out after 200ms');
  });

  it('should finalise a test', async () => {
    const test = new Test('Test', pass(), { exclusive: true });
    test._finalise(null, 99);

    await test.run(reporter);

    assert.equal(test.name, 'Test');
    assert.equal(test.point, 99);
    assert.equal(test.passed, true);
  });

  describe('Lifecycle Hooks', ({ describe }) => {

    describe('Before', ({ it }) => {
      it('should run before hooks before the test', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
        const hook2 = new Hook('Hook 2', () => executed.push('Before 2'));
        const test = new Test('Test', pass()).before(hook1, hook2);

        await test.run(reporter);

        assert.equal(executed.length, 2);
        assert.equal(executed[0], 'Before 1');
        assert.equal(executed[1], 'Before 2');
      });

      it('should skip before hooks before a skipped test (runtime configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('Before'));
        const test = new Test('Test', pass()).before(hook);

        await test.run(reporter, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should skip before hooks before a skipped test (inherited configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('Before'));
        const test = new Test('Test', pass()).before(hook);

        await test.run(reporter, {}, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should skip before hooks before a skipped test (test configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('Before'));
        const test = new Test('Test', pass(), { skip: true }).before(hook);

        await test.run(reporter);

        assert.equal(executed.length, 0);
      });

      it('should skip before hooks before a skipped test (pending)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('Before'));
        const test = new Test('Test').before(hook);

        await test.run(reporter);

        assert.equal(executed.length, 0);
      });

      it('should skip remaining before hooks following a failure', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
        const hook2 = new Hook('Hook 2', () => { throw new Error('Oh Noes!'); });
        const hook3 = new Hook('Hook 3', () => executed.push('Before 3'));
        const test = new Test('Test', pass()).before(hook1, hook2, hook3);

        await test.run(reporter);

        assert.equal(executed.length, 1);
      });

      it('should fail the test if a before hook fails', async () => {
        const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
        const test = new Test('Test', pass()).before(hook);

        await test.run(reporter);

        assert.equal(test.failed, true);
      });
    });

    describe('After Each', ({ it }) => {

      it('should run after each hooks after a successful test', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
        const hook2 = new Hook('Hook 2', () => executed.push('After 2'));
        const test = new Test('Test', pass()).after(hook1, hook2);

        await test.run(reporter);

        assert.equal(executed.length, 2);
        assert.equal(executed[0], 'After 1');
        assert.equal(executed[1], 'After 2');
      });

      it('should run after each hooks after a failing test', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
        const hook2 = new Hook('Hook 2', () => executed.push('After 2'));
        const test = new Test('Test', fail()).after(hook1, hook2);

        await test.run(reporter);

        assert.equal(executed.length, 2);
        assert.equal(executed[0], 'After 1');
        assert.equal(executed[1], 'After 2');
      });

      it('should skip after each hooks after a skipped test (test configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('After'));
        const test = new Test('Test', pass()).after(hook);

        await test.run(reporter, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should skip after each hooks after a skipped test (inherited configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('After'));
        const test = new Test('Test', pass()).after(hook);

        await test.run(reporter, {}, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should run after each hooks after a skipped test (programmatic)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('After'));
        const test = new Test('Test', skip()).after(hook);

        await test.run(reporter, {});

        assert.equal(executed.length, 1);
        assert.equal(executed[0], 'After');
      });

      it('should fail the test if an after each hook fails', async () => {
        const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
        const test = new Test('Test', pass()).after(hook);

        await test.run(reporter);

        assert.equal(test.failed, true);
      });

      it('should skip remaining after each hooks following a failure', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
        const hook2 = new Hook('Hook 2', () => { throw new Error('Oh Noes!'); });
        const hook3 = new Hook('Hook 3', () => executed.push('After 3'));
        const test = new Test('Test', pass()).after(hook1, hook2, hook3);

        await test.run(reporter);

        assert.equal(executed.length, 1);
      });
    });
  });

});

