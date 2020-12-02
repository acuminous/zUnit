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
    this._hooks = [];
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

  _finalise(parent, point = 1, hooks = []) {
    this._parent = parent;
    this._point = point;
    this._hooks = [].concat(hooks);
    return this;
  }

  async run(reporter, runtimeOptions = {}, inheritedOptions = {}) {
    reporter.withTest(this);

    this._start();

    const options = this._combine(inheritedOptions, this._options, runtimeOptions);

    try {
      if (this._shouldSkip(options)) return this._skip(options.reason);
      await timeout(() => this._runAll(), options.timeout);
      if (!this.skipped) this._pass();
    } catch (error) {
      this.error = error;
      this._fail();
    } finally {
      this._finish();
    }
  }

  async _runAll() {
    try {
      await this._runBefores();
      await this._fn({ name: this.name, skip: (reason) => this._skip(reason) });
    } finally {
      await this._runAfters();
    }
  }

  async _runBefores() {
    for (let i = 0; i < this._hooks.length; i++) {
      await this._hooks[i].runBefores();
    }
  }

  async _runAfters() {
    for (let i = 0; i < this._hooks.length; i++) {
      await this._hooks[i].runAfters();
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
