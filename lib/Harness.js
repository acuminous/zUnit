const { MultiReporter, AggregateReporter } = require('./reporters');
const Runnable = require('./Runnable');

class Harness extends Runnable {

  constructor(runnable, options = {}) {
    super();
    this._runnable = runnable;
    this._options = { ...options };
    this._aggregateReporter = new AggregateReporter();
  }

  get numberOfTests() {
    return this._runnable.numberOfTests;
  }

  hasExclusiveTests() {
    return this._runnable.hasExclusiveTests();
  }

  async run(reporter, runtimeOptions = {}) {
    const harnessReporter = new MultiReporter()
      .add(reporter, this._aggregateReporter)
      .withHarness(this);

    this._start();

    const inheritableOptions = { ...this._options };

    const finalised = this._runnable._finalise();
    await finalised.run(harnessReporter, runtimeOptions, inheritableOptions, !this._runnable.hasExclusiveTests());

    this._finish();
  }

  _finish() {
    this.stats = this._aggregateReporter.stats;
    this.result = this._aggregateReporter.result;
    super._finish();
  }
}

module.exports = Harness;
