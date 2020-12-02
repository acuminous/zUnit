const Runnable = require('./Runnable');
const RunnableOutcomes = require('./RunnableOutcomes');
const HookSet = require('./HookSet');

const defaults = {
  reason: 'No reason given',
};

class Suite extends Runnable {

  constructor(name, options = {}) {
    super(name);
    this._runnables = [];
    this._options = options;
    this._hooks = new HookSet();
    this._testHooks = new HookSet();
  }

  get pending() {
    return this._runnables.length === 0;
  }

  get numberOfTests() {
    return this._runnables.reduce((numberOfTests, runnable) => {
      return numberOfTests + runnable.numberOfTests;
    }, 0);
  }

  get numberOfPasses() {
    return this._runnables.reduce((numberOfPasses, runnable) => {
      return numberOfPasses + runnable.numberOfPasses;
    }, 0);
  }

  get numberOfFailures() {
    return this._runnables.reduce((numberOfFailures, runnable) => {
      return numberOfFailures + runnable.numberOfFailures;
    }, 0);
  }

  get numberOfSkipped() {
    return this._runnables.reduce((numberOfSkipped, runnable) => {
      if (!runnable.skipped) return numberOfSkipped;
      return numberOfSkipped + runnable.numberOfSkipped;
    }, 0);
  }

  hasExclusiveTests() {
    return this._runnables.some(runnable => runnable._shouldRun(false));
  }

  before(...additions) {
    this._hooks.addBefores(additions);
    return this;
  }

  beforeEach(...additions) {
    this._testHooks.addBefores(additions);
    return this;
  }

  after(...additions) {
    this._hooks.addAfters(additions);
    return this;
  }

  afterEach(...additions) {
    this._testHooks.addAfters(additions);
    return this;
  }

  add(...additions) {
    this._runnables = additions.reduce((runnables, runnable) => {
      return runnables.concat(runnable);
    }, this._runnables);
    return this;
  }

  _finalise(parent, offset = 1, inheritedTestHooks = []) {
    return this._runnables.reduce((suite, runnable) => {
      const testHooks = inheritedTestHooks.concat(this._testHooks).map(hookSet => hookSet._finalise());
      const finalised = runnable._finalise(this, offset + suite.numberOfTests, testHooks);
      return suite.add(finalised);
    }, this._clone());
  }

  _clone() {
    const suite = new Suite(this._name, this._options);
    suite._hooks = this._hooks;
    suite._testHooks = this._testHooks;
    return suite;
  }

  async run(reporter, runtimeOptions = {}, parentOptions = {}, force = true) {

    const suiteReporter = reporter.withSuite(this);

    this._start();

    // eslint-disable-next-line no-unused-vars
    const { exclusive, ...inheritableOptions } = Object.assign({}, defaults, parentOptions, this._options);
    const options = Object.assign({}, defaults, parentOptions, this._options, runtimeOptions);

    for (let i = 0; i < this._runnables.length; i++) {
      const runnable = this._runnables[i];
      if (runnable._shouldRun(force)) {
        try {
          await this._hooks.runBefores();
          await runnable.run(suiteReporter, runtimeOptions, inheritableOptions, runnable._shouldForce(force));
          if (runnable.failed && options.abort) inheritableOptions.skip = true;
        } finally {
          await this._hooks.runAfters();
        }
      }
    }
    this._finish(options);
  }

  _shouldRun(force) {
    return force || this.exclusive || this.hasExclusiveTests();
  }

  _shouldForce(force) {
    return force || this.exclusive && !this.hasExclusiveTests();
  }

  _finish(options) {
    if (options.skip) {
      this.result = RunnableOutcomes.SKIPPED;
    } else if (this.numberOfFailures > 0) {
      this.result = RunnableOutcomes.FAILED;
    } else {
      this.result = RunnableOutcomes.PASSED;
    }
    super._finish();
  }
}

module.exports = Suite;
