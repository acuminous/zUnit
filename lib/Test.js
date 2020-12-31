const Testable = require('./Testable');
const { timeout } = require('./utils');

const defaults = {
  timeout: 5000,
};

class Test extends Testable {

  constructor(name, fn, options = {}) {
    super(name);
    this._fn = fn;
    this._options = fn ? options : Object.assign({ reason: 'Pending' }, options);
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

    const inheritableOptions = this._getInheritableOptions(runtimeOptions, inheritedOptions);
    const runOptions = this._getRunOptions(runtimeOptions, inheritedOptions);

    try {
      if (this._shouldSkip(runOptions)) return this._skip(runOptions.reason);
      await timeout(() => this._runAll(runtimeOptions, inheritableOptions), runOptions.timeout);
      if (!this.skipped) this._pass();
    } catch (error) {
      this.error = error;
      this._fail();
    } finally {
      this._finish();
    }
  }

  async _runAll(runtimeOptions, inheritableOptions) {
    try {
      await this._runBefores(runtimeOptions, inheritableOptions);
      if (this.skipped) return;
      const done = this._makeDone();
      const api = this._getApi();
      await Promise.all([this._fn(api, done.callback), done.promise]);
    } finally {
      this._run = true;
      await this._runAfters(runtimeOptions, inheritableOptions);
    }
  }

  _makeDone() {
    let alreadyCalled = false;
    let callback;
    const promise = this._fn.length > 1
      ? new Promise((resolve, reject) => {
        callback = (err) => {
          if (alreadyCalled) throw new Error('done already called');
          alreadyCalled = true;
          return err ? reject(err) : resolve();
        };
      }) : Promise.resolve();
    return { callback, promise };
  }

  _getInheritableOptions(runtimeOptions, inheritedOptions) {
    // eslint-disable-next-line no-unused-vars
    const { exclusive, ...inheritableOptions } = Object.assign({}, defaults, inheritedOptions, this._options, runtimeOptions);
    return inheritableOptions;
  }

  _getRunOptions(runtimeOptions, inheritedOptions) {
    return Object.assign({}, defaults, inheritedOptions, this._options, runtimeOptions);
  }

  async _runBefores(runtimeOptions, inheritableOptions) {
    for (let i = 0; i < this._hooks.length; i++) {
      await this._hooks[i].runBefores(runtimeOptions, inheritableOptions);
      if (this.skipped) break;
    }
  }

  async _runAfters(runtimeOptions, inheritableOptions) {
    for (let i = this._hooks.length - 1; i >= 0; i--) {
      await this._hooks[i].runAfters(runtimeOptions, inheritableOptions);
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

  _decorateApi(api) {
    return { ...api, test: this._getApi() };
  }
}

module.exports = Test;
