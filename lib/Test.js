const EventEmitter = require('events');
const timeout = require('./timeout');
const Events = require('./Events');

class Test extends EventEmitter {

  static TYPE = 'Test';

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
    return this.result === Events.TEST_PASSED;
  }

  get failed() {
    return this.result === Events.TEST_FAILED;
  }

  get skipped() {
    return this.result === Events.TEST_SKIPPED;
  }

  get pending() {
    return this._fn === undefined;
  }

  get duration() {
    return this.finished - this.started;
  }

  get type() {
    return Test.TYPE;
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
    return this._run(reporter, options);
  }

  async _run(reporter, options = {}) {
    const config = Object.assign({}, this._options, options);
    reporter.withTest(this);

    this._start();

    try {
      if (this.pending || config.skip || this._programmaticallySkipped) return this._skip();
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
    this.emit(Events.TEST_STARTED);
  }

  _finish() {
    this.finished = Date.now();
    this.emit(Events.TEST_FINISHED);
  }

  _pass() {
    this.result = Events.TEST_PASSED;
    this.emit(Events.TEST_PASSED);
  }

  _fail() {
    this.result = Events.TEST_FAILED;
    this.emit(Events.TEST_FAILED);
  }

  _skip() {
    this.result = Events.TEST_SKIPPED;
    this.emit(Events.TEST_SKIPPED);
  }
}

module.exports = Test;
