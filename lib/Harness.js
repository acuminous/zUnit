const { MultiReporter, AggregateReporter } = require('./reporters');
const Runnable = require('./Runnable');
const RunnableOptions = require('./RunnableOptions');

class Harness extends Runnable {

  constructor(name = 'zUnit Test Harness', options) {
    super(name);
    this._options = new RunnableOptions(options);
    this._aggregateReporter = new AggregateReporter();
  }

  set(runnable) {
    this._runnable = runnable;
    return this;
  }

  load(path) {
    return this.set(require(path));
  }

  get numberOfTests() {
    return this._runnable.numberOfTests;
  }

  hasExclusiveTests() {
    return this._runnable.hasExclusiveTests();
  }

  async run(reporter, options = {}) {
    const harnessReporter = new MultiReporter()
      .add(reporter, this._aggregateReporter)
      .withHarness(this);

    this._start();

    const runtimeOptions = this._options._combine(options);
    const clone = this._runnable.clone();
    clone._finalise(this);
    await clone.run(harnessReporter, runtimeOptions, !this._runnable.hasExclusiveTests());

    this._finish();
  }

  _finish() {
    this.stats = this._aggregateReporter.stats;
    this.result = this._aggregateReporter.result;
    super._finish();
  }
}

module.exports = Harness;
