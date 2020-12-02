const Runnable = require('./Runnable');

class Harness extends Runnable {

  constructor(runnable, options = {}) {
    super();
    this._runnable = runnable;
    this._options = options;
  }

  get numberOfTests() {
    return this._runnable.numberOfTests;
  }

  get numberOfPasses() {
    return this._runnable.numberOfPasses;
  }

  get numberOfFailures() {
    return this._runnable.numberOfFailures;
  }

  get numberOfSkipped() {
    return this._runnable.numberOfSkipped;
  }

  hasExclusiveTests() {
    return this._runnable.hasExclusiveTests();
  }

  async run(reporter, runtimeOptions = {}) {
    const harnessReporter = reporter.withHarness(this);

    this._start();

    const inheritableOptions = Object.assign({}, this._options);

    const finalised = this._runnable._finalise();
    await finalised.run(harnessReporter, runtimeOptions, inheritableOptions, !this._runnable.hasExclusiveTests());

    this._finish(finalised);
  }

  _finish(finalised) {
    this.result = finalised.result;
    super._finish();
  }
}

module.exports = Harness;
