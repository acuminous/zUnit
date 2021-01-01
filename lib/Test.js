const Testable = require('./Testable');
const Options = require('./Options');
const { timeout } = require('./utils');

const defaults = {
  timeout: 5000,
  reason: 'No reason given',
};

class Test extends Testable {

  constructor(name, fn, initial = {}) {
    super(name);
    this._fn = fn;
    this._options = new Options({ defaults, initial: fn ? initial : { reason: 'Pending', ...initial }});
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
    const test = new Test(this.name, this._fn, this._options.initial);
    test._parent = parent;
    test._point = point;
    test._hooks = hooks.map(hookSet => hookSet._finalise(test));
    return test;
  }

  async run(reporter, propagatedOptions) {
    reporter.withTest(this);

    const options = this._options.apply(propagatedOptions);

    this._start();

    try {
      if (this._shouldSkip(options)) return this._skip(options.get('reason'));
      await timeout(() => this._runAll(options), options.get('timeout'));
      if (!this.skipped) this._pass();
    } catch (error) {
      this.error = error;
      this._fail();
    } finally {
      this._finish();
    }
  }

  async _runAll(options) {
    try {
      await this._runBefores(options);
      if (this.skipped) return;
      const done = this._makeDone();
      const api = this._getApi();
      const fn = this._fn(api, done.callback);
      await Promise.all([fn, done.promise]);
    } finally {
      this._run = true;
      await this._runAfters(options);
    }
  }

  async _runBefores(options) {
    for (let i = 0; i < this._hooks.length; i++) {
      await this._hooks[i].runBefores(options);
      if (this.skipped) break;
    }
  }

  async _runAfters(options) {
    for (let i = this._hooks.length - 1; i >= 0; i--) {
      await this._hooks[i].runAfters(options);
    }
  }

  _shouldSkip(options) {
    return this.pending || options.get('skip') || this._skipped;
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
