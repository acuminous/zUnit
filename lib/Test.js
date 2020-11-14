const Runnable = require('./Runnable');
const timeout = require('./timeout');

const defaults = {
  timeout: 5000,
};

class Test extends Runnable {

  constructor(name, fn, options) {
    super(name);
    this._fn = fn;
    this._options = this._combine(defaults, options);
    this._befores = [];
    this._afters = [];
  }

  get point() {
    return this._point;
  }

  get numberOfTests() {
    return 1;
  }

  get numberOfPasses() {
    return this.passed ? 1 : 0;
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

  _finalise(parent, point = 1) {
    this._parent = parent;
    this._point = point;
    return this;
  }

  async run(reporter, runtimeOptions = {}, parentOptions = {}) {
    reporter.withTest(this);

    this._start();

    const options = this._combine(parentOptions, this._options, runtimeOptions);

    try {
      if (this._shouldSkip(options)) return this._skip(options.reason);
      await timeout(() => this._work(), options.timeout);
      if (this._shouldSkip(options)) return this._skip(options.reason);
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
