const Runnable = require('./Runnable');
const RunnableOutcomes = require('./RunnableOutcomes');

const defaults = {
  reason: 'No reason given',
};

class Suite extends Runnable {

  constructor(name, options = {}) {
    super(name);
    this._runnables = [];
    this._options = this._combine(defaults, options);
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
      if (!runnable.failed) return numberOfFailures;
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

  add(...additions) {
    this._runnables = additions.reduce((runnables, runnable) => {
      return runnables.concat(runnable);
    }, this._runnables);
    return this;
  }

  _finalise(parent, offset = 1) {
    return this._runnables.reduce((suite, runnable) => {
      const finalised = runnable._finalise(this, offset + suite.numberOfTests);
      return suite.add(finalised);
    }, new Suite(this._name, this._options));
  }

  async run(reporter, runtimeOptions = {}, parentOptions = {}, force = true) {

    const suiteReporter = reporter.withSuite(this);

    this._start();

    // eslint-disable-next-line no-unused-vars
    const { exclusive, ...inheritableOptions } = this._combine(parentOptions, this._options);
    const options = this._combine(parentOptions, this._options, runtimeOptions);

    for (let i = 0; i < this._runnables.length; i++) {
      const runnable = this._runnables[i];
      if (runnable._shouldRun(force)) {
        await runnable.run(suiteReporter, runtimeOptions, inheritableOptions, runnable._shouldForce(force));
        if (runnable.failed && options.abort) inheritableOptions.skip = true;
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
