const EventEmitter = require('events');
const timeout = require('./timeout');

class Test extends EventEmitter {

  static PASSED = 'passed';
  static FAILED = 'failed';
  static SKIPPED = 'skipped';
  static STARTED = 'started';
  static FINISHED = 'finished';

  constructor(name, fn, options = {}) {
    super();
    this._name = name;
    this._fn = fn;
    this._options = this._applyDefaults(options);
    this._befores = [];
    this._afters = [];
  }

  get name() {
    return this._name;
  }

  get passed() {
    return this.result === Test.PASSED;
  }

  get failed() {
    return this.result === Test.FAILED;
  }

  get skipped() {
    return this.result === Test.SKIPPED;
  }

  get duration() {
    return this.finished - this.started;
  }

  get stats() {
    return {
      passed: this.passed ? 1 : 0,
      failed: this.failed ? 1 : 0,
      skipped: this.skipped ? 1 : 0,
    }
  }

  before(fn) {
    this._befores.push(fn);
  }

  after(fn) {
    this._afters.push(fn);
  }

  async run(reporter, options = {}) {
    const config = Object.assign({}, this._options, options);
    reporter.withTest(this);

    this._start();

    try {
      if (config.skip || this._pending || this._programmaticallySkipped) return this._skip();
      await timeout(() => this._work(), config.timeout);
      if (this._programmaticallySkipped) return this._skip();
      this._pass();
    } catch (error) {
      this.error = error;
      this._fail();
    } finally {
      this._finish();
    }

    return this;
  }

  skip() {
    this._programmaticallySkipped = true;
  }

  _applyDefaults(options) {
    return Object.assign({ timeout: 5000, skip: false }, options);
  }

  async _work() {
    const fns = [].concat(this._befores, this._fn, this._afters);
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      await fn(this);
    }
  }

  _start() {
    this.started = Date.now();
    this.emit(Test.STARTED);
  }

  _finish() {
    this.finished = Date.now();
    this.emit(Test.FINISHED);
  }

  _pass() {
    this.result = Test.PASSED;
    this.emit(Test.PASSED);
  }

  _fail() {
    this.result = Test.FAILED;
    this.emit(Test.FAILED);
  }

  _skip() {
    this.result = Test.SKIPPED;
    this.emit(Test.SKIPPED);
  }

  _pending() {
    this._fn === undefined;
  }
}

module.exports = Test;
