const Runnable = require('./Runnable');
const Events = require('./Events');
const TestOptions = require('./TestOptions');
const timeout = require('./timeout');

class Test extends Runnable {

  static TYPE = 'Test';

  constructor(name, fn, options) {
    super(name, Test.TYPE);
    this._fn = fn;
    this._options = new TestOptions(options);
    this._befores = [];
    this._afters = [];
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

  async _work() {
    const fns = [].concat(this._befores, this._fn, this._afters);
    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      await fn(this);
    }
  }

  _shouldRun(force) {
    return force || this.exclusive;
  }

  _shouldForce(force) {
    return force || this.exclusive;
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

  get exclusive() {
    return this._options.exclusive;
  }
}

module.exports = Test;
