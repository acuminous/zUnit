const Runnable = require('./Runnable');
const TestOptions = require('./TestOptions');
const timeout = require('./timeout');

class Test extends Runnable {

  constructor(name, fn, options, number, parent) {
    super(name, parent);
    this._fn = fn;
    this._options = new TestOptions(options);
    this._number = number;
    this._befores = [];
    this._afters = [];
  }

  get number() {
    return this._number;
  }

  get nextNumber() {
    return this._number + 1;
  }

  get numberOfTests() {
    return 1;
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

  finalise(parent, number = 1) {
    return new Test(this._name, this._fn, this._options, number, parent);
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
