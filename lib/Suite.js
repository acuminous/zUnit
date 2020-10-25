const EventEmitter = require('events');
const { MultiReporter, AggregateReporter } = require('./reporters');
const Events = require('./Events');

class Suite extends EventEmitter {

  static TYPE = 'Suite';

  constructor(name, options = {}) {
    super();
    this._name = name;
    this._runnables = [];
    this._options = this._applyDefaults(options);
    this._aggregateReporter = new AggregateReporter();
  }

  get name() {
    return this._name;
  }

  get passed() {
    return this.result === Events.SUITE_PASSED;
  }

  get failed() {
    return this.result === Events.SUITE_FAILED;
  }

  get skipped() {
    return this.result === Events.SUITE_SKIPPED;
  }

  get duration() {
    return this.finished - this.started;
  }

  get type() {
    return Suite.TYPE;
  }

  add(...additions) {
    this._runnables = additions.reduce((runnables, runnable) => {
      return runnables.concat(runnable);
    }, this._runnables);
    return this;
  }

  async run(reporter, options = {}) {
    await this._run(reporter, options);
    return this;
  }

  async _run(reporter, options) {
    const config = Object.assign({}, this._options, options);
    const suiteReporter = new MultiReporter()
      .add(reporter, this._aggregateReporter)
      .withSuite(this);

    this._start();

    try {
      let aborting = false;
      for (let i = 0; i < this._runnables.length; i++) {
        const runnable = this._runnables[i];
        if (config.skip || this._programmaticallySkipped || aborting) runnable.skip();
        await runnable._run(suiteReporter, options);
        aborting = aborting || runnable.failed && config.abort;
      }
    } finally {
      this._finish(config);
    }
  }

  skip() {
    this._programmaticallySkipped = true;
  }

  _applyDefaults(options) {
    return Object.assign({ skip: false }, options);
  }

  _start() {
    this.started = Date.now();
    this.emit(Events.SUITE_STARTED);
  }

  _finish(config) {
    this.stats = this._aggregateReporter.stats;
    this.result = config.skip ? Events.SUITE_SKIPPED : this._aggregateResult();
    this.finished = Date.now();
    this.emit(this.result);
    this.emit(Events.SUITE_FINISHED);
  }

  _aggregateResult() {
    return this._runnables.find(r => r.failed) ? Events.SUITE_FAILED : Events.SUITE_PASSED
  }

  get _suites() {
    return this._runnables.filter(runnable => {
      return runnable.type === Suite.TYPE
    });
  }

}

module.exports = Suite;
