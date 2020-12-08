const Testable = require('./Testable');
const timeout = require('./utils/timeout');

const defaults = {
  timeout: 5000,
};

class Test extends Testable {

  constructor(name, fn, options = {}) {
    super(name);
    this._fn = fn;
    this._options = options;
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
    const test = new Test(this.name, this._fn, this._options);
    test._parent = parent;
    test._point = point;
    test._hooks = hooks.map(hookSet => hookSet._finalise(test));
    return test;
  }

  async run(reporter, runtimeOptions = {}, inheritedOptions = {}) {
    reporter.withTest(this);

    this._start();

    const options = Object.assign({}, defaults, inheritedOptions, this._options, runtimeOptions);

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
      if (this.skipped) return;
      await this._fn(this._getApi(true));
    } finally {
      await this._runAfters();
    }
  }

  async _runBefores() {
    for (let i = 0; i < this._hooks.length; i++) {
      await this._hooks[i].runBefores();
      if (this.skipped) break;
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

  _getApi(skippable) {
    const api = { name: this.name, description: this.description };
    return skippable ? { ...api, skip: (reason) => this._skip(reason) } : api;
  }
}

module.exports = Test;
