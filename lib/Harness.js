const Testable = require('./Testable');

class Harness extends Testable {

  constructor(runnable, options = {}) {
    super();
    this._runnable = runnable;
    this._options = options;
  }

  get _underlying() {
    return this._finalised || this._runnable;
  }

  get numberOfTests() {
    return this._underlying.numberOfTests;
  }

  get numberOfPasses() {
    return this._underlying.numberOfPasses;
  }

  get numberOfFailures() {
    return this._underlying.numberOfFailures;
  }

  get numberOfSkipped() {
    return this._underlying.numberOfSkipped;
  }

  get result() {
    return this._underlying.result;
  }

  hasExclusiveTests() {
    return this._underlying.hasExclusiveTests();
  }

  async run(reporter, runtimeOptions = {}) {
    const harnessReporter = reporter.withHarness(this);

    this._start();

    const inheritableOptions = Object.assign({}, this._options);

    this._finalised = this._runnable._finalise();
    await this._finalised.run(harnessReporter, runtimeOptions, inheritableOptions, !this._finalised.hasExclusiveTests());

    this._finish();
  }
}

module.exports = Harness;
