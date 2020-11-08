const Runnable = require('./Runnable');
const TestOptions = require('./TestOptions');
const timeout = require('./timeout');

class Test extends Runnable {

  constructor(name, fn, options) {
    super(name);
    this._fn = fn;
    this._options = new TestOptions(options);
    this._befores = [];
    this._afters = [];
  }

  get number() {
    return this._number;
  }

  get numberOfTests() {
    return 1;
  }

  get numberOfFailures() {
    return this.failed ? 1 : 0;
  }

  get numberOfSkipped() {
    return this.skipped ? 1 : 0;
  }

  get pending() {
    return this._fn === undefined;
  }

  hasExclusiveTests() {
    return false;
  }

  before(fn) {
    this._befores.push(fn);
  }

  after(fn) {
    this._afters.push(fn);
  }

  clone() {
    return new Test(this._name, this._fn, this._options);
  }

  _finalise(parent, number = 1) {
    this._parent = parent;
    this._number = number;
    return number + 1;
  }

  async run(reporter, options = {}) {
    reporter.withTest(this);

    this._start();
    const runtimeOptions = this._options._combine(options);

    try {
      if (this._shouldSkip(runtimeOptions)) return this._skip(runtimeOptions.reason);
      await timeout(() => this._work(), runtimeOptions.timeout);
      if (this._shouldSkip(runtimeOptions)) return this._skip(runtimeOptions.reason);
      this._pass();
    } catch (error) {
      this.error = error;
      this._fail();
    } finally {
      this._finish();
    }

    return this;
  }

  async _work() {
    const fns = [].concat(this._befores, this._fn, this._afters);
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      await fn({ name: this.name, skip: () => this._skipped = true });
    }
  }

  _shouldSkip(runtimeOptions) {
    return this.pending || runtimeOptions.skip || this._skipped;
  }

  _shouldRun(force) {
    return force || this.exclusive;
  }

  _shouldForce(force) {
    return force || this.exclusive;
  }
}

module.exports = Test;
