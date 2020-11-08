const { MultiReporter, AggregateReporter } = require('./reporters');
const Runnable = require('./Runnable');
const RunnableOutcomes = require('./RunnableOutcomes');

class Suite extends Runnable {

  constructor(name, options = {}) {
    super(name);
    this._runnables = [];
    this._options = { ...options };
    this._aggregateReporter = new AggregateReporter();
  }

  get pending() {
    return this._runnables.length === 0;
  }

  get numberOfTests() {
    return this._runnables.reduce((numberOfTests, runnable) => {
      return numberOfTests + runnable.numberOfTests;
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

    const suiteReporter = new MultiReporter()
      .add(reporter, this._aggregateReporter)
      .withSuite(this);

    this._start();

    const options = { ...parentOptions, ...this._options, ...runtimeOptions };
    // eslint-disable-next-line no-unused-vars
    const { exclusive, ...inheritableOptions } = { ...parentOptions, ...this._options };

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

  _finish(runtimeOptions) {
    this.stats = this._aggregateReporter.stats;
    this.result = runtimeOptions.skip ? RunnableOutcomes.SKIPPED : this._aggregateReporter.result;
    super._finish();
  }
}

module.exports = Suite;
