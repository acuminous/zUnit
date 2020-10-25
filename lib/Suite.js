const EventEmitter = require('events');

class Suite extends EventEmitter {

  static PASSED = 'passed';
  static FAILED = 'failed';
  static SKIPPED = 'skipped';
  static STARTED = 'started';
  static FINISHED = 'finished';

  constructor(name, options = {}) {
    super();
    this._name = name;
    this._runnables = [];
    this._options = this._applyDefaults(options);
  }

  get passed() {
    return this.result === Suite.PASSED;
  }

  get failed() {
    return this.result === Suite.FAILED;
  }

  get skipped() {
    return this.result === Suite.SKIPPED;
  }

  get duration() {
    return this.finished - this.started;
  }

  add(...additions) {
    this._runnables = additions.reduce((runnables, runnable) => {
      return runnables.concat(runnable);
    }, this._runnables);
    return this;
  }

  async run(reporter, options = {}) {
    const config = Object.assign({}, this._options, options);
    const suiteReporter = reporter.withSuite(this);

    this._start();

    try {
      let aborting = false;
      for (let i = 0; i < this._runnables.length; i++) {
        const runnable = this._runnables[i];
        if (config.skip || aborting) runnable.skip();
        await runnable.run(suiteReporter, options);
        aborting = aborting || runnable.failed && config.abort;
      }
    } finally {
      this._finish(config);
    }

    return this;
  }

  skip() {
    this._options.skip = true;
  }

  get name() {
    return this._name;
  }

  _applyDefaults(options) {
    return Object.assign({ skip: false }, options);
  }

  _start() {
    this.started = Date.now();
    this.emit(Suite.STARTED);
  }

  _finish(config) {
    this.stats = this._aggregateStats();
    this.result = config.skip ? Suite.SKIPPED : this._aggregateResult();
    this.finished = Date.now();
    this.emit(this.result);
    this.emit(Suite.FINISHED);
  }

  _aggregateResult() {
    return this._runnables.find(r => r.failed) ? Suite.FAILED : Suite.PASSED
  }

  _aggregateStats() {
    return this._runnables.reduce(({ passed, failed, skipped }, runnable) => {
      return {
        passed: passed + runnable.stats.passed,
        failed: failed + runnable.stats.failed,
        skipped: skipped + runnable.stats.skipped,
      }
    }, { passed: 0, failed: 0, skipped: 0 });
  }

}

module.exports = Suite;
