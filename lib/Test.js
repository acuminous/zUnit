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

  before(...hooks) {
    this._befores = hooks.reduce((befores, hook) => {
      return befores.concat(hook);
    }, this._befores);
    return this;
  }

  after(...hooks) {
    this._afters = hooks.reduce((afters, hook) => {
      return afters.concat(hook);
    }, this._afters);
    return this;
  }

  _finalise(parent, point = 1) {
    this._parent = parent;
    this._point = point;
    return this;
  }

  async run(reporter, runtimeOptions = {}, inheritedOptions = {}) {
    reporter.withTest(this);

    this._start();

    const options = this._combine(inheritedOptions, this._options, runtimeOptions);

    try {
      if (this._shouldSkip(options)) return this._skip(options.reason);
      await timeout(() => this._runAll(), options.timeout);
      if (this._shouldSkip(options)) return this._skip(options.reason);
      this._pass();
    } catch (error) {
      this.error = error;
      this._fail();
    } finally {
      this._finish();
    }
  }

  async _runAll() {
    try {
      await this._runHooks(this._befores);
      await this._fn({ name: this.name, skip: () => this._skipped = true });
    } finally {
      await this._runHooks(this._afters);
    }
  }

  async _runHooks(hooks) {
    for (let i = 0; i < hooks.length; i++) {
      await hooks[i].run();
    }
  }

  _shouldSkip(options) {
    return this.pending || options.skip || this._skipped;
  }

  _shouldRun(force) {
    return force || this.exclusive;
  }

  _shouldForce(force) {
    return force || this.exclusive;
  }
}

module.exports = Test;
