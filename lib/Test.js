const Runnable = require('./Runnable');
const RunnableEvents = require('./RunnableEvents');
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

  get pending() {
    return this._fn === undefined;
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

  async _run(reporter, options) {
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
}

module.exports = Test;
