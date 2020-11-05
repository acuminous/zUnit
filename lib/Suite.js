const { MultiReporter, AggregateReporter } = require('./reporters');
const Runnable = require('./Runnable');
const RunnableOutcomes = require('./RunnableOutcomes');
const SuiteOptions = require('./SuiteOptions');

class Suite extends Runnable {

  constructor(name, options) {
    super(name);
    this._runnables = [];
    this._options = new SuiteOptions(options);
    this._aggregateReporter = new AggregateReporter();
  }

  get pending() {
    return this._runnables.length === 0;
  }

  get nextNumber() {
    return this._runnables.reduce((number, runnable) => {
      return runnable.nextNumber || number;
    }, undefined);
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

  finalise(startFrom = 1) {
    let testNumber = startFrom;
    return this._runnables.reduce((suite, runnable) => {
      suite.add(runnable.finalise(testNumber));
      testNumber = suite.nextNumber;
      return suite;
    }, new Suite(this.name, this.options));
  }

  async run(reporter, options = {}, force = true) {

    const suiteReporter = new MultiReporter()
      .add(reporter, this._aggregateReporter)
      .withSuite(this);

    this._start();

    const runtimeOptions = this._options._combine(options);
    const propagatedOptions = runtimeOptions._propagate();

    for (let i = 0; i < this._runnables.length; i++) {
      const runnable = this._runnables[i];
      if (runnable._shouldRun(force)) {
        await runnable.run(suiteReporter, propagatedOptions, runnable._shouldForce(force));
        if (runnable.failed && runtimeOptions.abort) propagatedOptions._abort();
      }
    }

    this._finish(runtimeOptions);
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
