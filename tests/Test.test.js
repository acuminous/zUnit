const assert = require('assert');
const { pass, fail, skip } = require('./support/helpers');
const { NullReporter, Test, Hook, HookSet } = require('..');

describe('Tests', () => {

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

  it('should abort slow tests (inherited configuration)', async () => {
    const test = new Test('Test', pass({ delay: 200 }));

    await test.run(reporter, {}, { timeout: 100 });

    assert.equal(test.failed, true);
    assert.equal(test.error.message, 'Timed out after 100ms');
  });

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

  it('should bypass skipped tests (inherited configuration)', async () => {
    const test = new Test('Test', fail());

    await test.run(reporter, {}, { skip: true });

    assert.equal(test.skipped, true);
  });

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
    const test = new Test('Test', pass());
    const finalised = test._finalise(null, 99);
    await finalised.run(reporter);

    assert.equal(finalised.name, 'Test');
    assert.equal(finalised.point, 99);
    assert.equal(finalised.passed, true);
  });

  describe('Lifecycle Hooks', () => {

    describe('Before', () => {

      it('should inject hook api', async () => {
        let api;
        const hook = new Hook('Hook', (h) => {
          api = h;
        });

        const hooks = new HookSet().addBefores(hook);
        const test = new Test('Test', pass())._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(api.name, 'Hook');
        assert.equal(api.description, 'Test / Hook');
        assert.equal(api.test.name, 'Test');
        assert.ok(api.test.skip);
      });

      it('should run before hooks before the test', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
        const hook2 = new Hook('Hook 2', () => executed.push('Before 2'));
        const hooks = new HookSet().addBefores(hook1, hook2);
        const test = new Test('Test', () => executed.push('Test'))._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(executed.length, 3);
        assert.equal(executed[0], 'Before 1');
        assert.equal(executed[1], 'Before 2');
        assert.equal(executed[2], 'Test');
      });

      it('should skip before hooks before a skipped test (runtime configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('Before'));
        const hooks = new HookSet().addBefores(hook);
        const test = new Test('Test', pass())._finalise(null, 1, [ hooks ]);

        await test.run(reporter, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should skip before hooks before a skipped test (inherited configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('Before'));
        const hooks = new HookSet().addBefores(hook);
        const test = new Test('Test', pass())._finalise(null, 1, [ hooks ]);

        await test.run(reporter, {}, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should skip before hooks before a skipped test (test configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('Before'));
        const hooks = new HookSet().addBefores(hook);
        const test = new Test('Test', pass(), { skip: true })._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(executed.length, 0);
      });

      it('should skip before hooks before a skipped test (pending)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('Before'));
        const hooks = new HookSet().addBefores(hook);
        const test = new Test('Test')._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(executed.length, 0);
      });

      it('should skip remaining before hooks following a skipped test (programmatic)', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
        const hook2 = new Hook('Hook 2', (h) => { h.test.skip('Whatever'); });
        const hook3 = new Hook('Hook 3', () => executed.push('Before 3'));
        const hooks = new HookSet().addBefores(hook1, hook2, hook3);
        const test = new Test('Test', pass())._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(executed.length, 1);
        assert.equal(test.skipped, true);
        assert.equal(test.reason, 'Whatever');
      });

      it('should skip remaining before hooks following a failure', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('Before 1'));
        const hook2 = new Hook('Hook 2', () => { throw new Error('Oh Noes!'); });
        const hook3 = new Hook('Hook 3', () => executed.push('Before 3'));
        const hooks = new HookSet().addBefores(hook1, hook2, hook3);
        const test = new Test('Test', pass())._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(executed.length, 1);
      });

      it('should fail the test if a before hook fails', async () => {
        const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
        const hooks = new HookSet().addBefores(hook);
        const test = new Test('Test', pass())._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(test.failed, true);
      });
    });

    describe('After', () => {

      it('should inject hook api', async () => {
        let api;
        const hook = new Hook('Hook', (h) => {
          api = h;
        });

        const hooks = new HookSet().addAfters(hook);
        const test = new Test('Test', pass())._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(api.name, 'Hook');
        assert.equal(api.description, 'Test / Hook');
        assert.equal(api.test.name, 'Test');
        assert.ok(!api.test.skip);
      });

      it('should run after hooks after a successful test', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
        const hook2 = new Hook('Hook 2', () => executed.push('After 2'));
        const hooks = new HookSet().addAfters(hook1, hook2);
        const test = new Test('Test', () => executed.push('Test'))._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(executed.length, 3);
        assert.equal(executed[0], 'Test');
        assert.equal(executed[1], 'After 1');
        assert.equal(executed[2], 'After 2');
      });

      it('should run after hooks after a failing test', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
        const hook2 = new Hook('Hook 2', () => executed.push('After 2'));
        const hooks = new HookSet().addAfters(hook1, hook2);
        const test = new Test('Test', fail())._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(executed.length, 2);
        assert.equal(executed[0], 'After 1');
        assert.equal(executed[1], 'After 2');
      });

      it('should skip after hooks after a skipped test (test configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('After'));
        const hooks = new HookSet().addAfters(hook);
        const test = new Test('Test', pass(), { skip: true })._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(executed.length, 0);
      });

      it('should skip after hooks after a skipped test (runtime configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('After'));
        const hooks = new HookSet().addAfters(hook);
        const test = new Test('Test', pass())._finalise(null, 1, [ hooks ]);

        await test.run(reporter, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should skip after hooks after a skipped test (inherited configuration)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('After'));
        const hooks = new HookSet().addAfters(hook);
        const test = new Test('Test', pass())._finalise(null, 1, [ hooks ]);

        await test.run(reporter, {}, { skip: true });

        assert.equal(executed.length, 0);
      });

      it('should run after hooks after a skipped test (programmatic)', async () => {
        const executed = [];
        const hook = new Hook('Hook', () => executed.push('After'));
        const hooks = new HookSet().addAfters(hook);
        const test = new Test('Test', skip())._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(executed.length, 1);
        assert.equal(executed[0], 'After');
      });

      it('should fail the test if an after hook fails', async () => {
        const hook = new Hook('Hook', () => { throw new Error('Oh Noes!'); });
        const hooks = new HookSet().addAfters(hook);
        const test = new Test('Test', pass())._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(test.failed, true);
      });

      it('should skip remaining after hooks following a failure', async () => {
        const executed = [];
        const hook1 = new Hook('Hook 1', () => executed.push('After 1'));
        const hook2 = new Hook('Hook 2', () => { throw new Error('Oh Noes!'); });
        const hook3 = new Hook('Hook 3', () => executed.push('After 3'));
        const hooks = new HookSet().addAfters(hook1, hook2, hook3);
        const test = new Test('Test', pass())._finalise(null, 1, [ hooks ]);

        await test.run(reporter);

        assert.equal(executed.length, 1);
        assert.equal(executed[0], 'After 1');
      });

      it('should skip after hooks associated with skipped before hooks', async () => {
        const executedBefore = [];
        const before1 = new Hook('Before 1', () => executedBefore.push('Before 1'));
        const before2 = new Hook('Before 2', () => { throw new Error('Oh Noes!'); });
        const before3 = new Hook('Before 3', () => executedBefore.push('Before 3'));

        const executedAfter = [];
        const after1 = new Hook('After 1', () => executedAfter.push('After 1'));
        const after2 = new Hook('After 2', () => executedAfter.push('After 2'));
        const after3 = new Hook('After 3', () => executedAfter.push('After 3'));

        const hooks1 = new HookSet().addBefores(before1).addAfters(after1);
        const hooks2 = new HookSet().addBefores(before2).addAfters(after2);
        const hooks3 = new HookSet().addBefores(before3).addAfters(after3);

        const test = new Test('Test', pass())._finalise(null, 1, [hooks1, hooks2, hooks3]);

        await test.run(reporter);

        assert.equal(executedBefore.length, 1);
        assert.equal(executedBefore[0], 'Before 1');

        assert.equal(executedAfter.length, 2);
        assert.equal(executedAfter[0], 'After 2');
        assert.equal(executedAfter[1], 'After 1');
      });
    });
  });

});

