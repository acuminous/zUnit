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

  get exclusive() {
    return this._options.exclusive;
  }

  get hasExclusiveDescendents() {
    return this._runnables.some(runnable => {
      return runnable.exclusive || runnable.hasExclusiveDescendents;
    });
  }

  add(...additions) {
    this._runnables = additions.reduce((runnables, runnable) => {
      return runnables.concat(runnable);
    }, this._runnables);
    return this;
  }

  run(reporter, options = {}) {
    const force = !this.hasExclusiveDescendents;
    return this._run(reporter, options, force)
  }

  async _run(reporter, options, force) {

    const suiteReporter = new MultiReporter()
      .add(reporter, this._aggregateReporter)
      .withSuite(this);

    this._start();

    const runtimeOptions = Object.assign({}, this._options, options);
    const propagatedOptions = Object.assign({}, options);
    if (runtimeOptions.skip) propagatedOptions.skip = true;

    for (let i = 0; i < this._runnables.length; i++) {
      const runnable = this._runnables[i];
      if (runnable.exclusive || runnable.hasExclusiveDescendents || force) {
        await runnable._run(suiteReporter, propagatedOptions, force);
        if (runnable.failed && runtimeOptions.abort) propagatedOptions.skip = true;
      }
    }

    this._finish(runtimeOptions);
  }

  _applyDefaults(options) {
    return Object.assign({ skip: false, exclusive: false }, options);
  }

  _start() {
    this.started = Date.now();
    this.emit(Events.SUITE_STARTED);
  }

  _finish(options) {
    this.stats = this._aggregateReporter.stats;
    this.result = options.skip ? Events.SUITE_SKIPPED : this._aggregateReporter.result;
    this.finished = Date.now();
    this.emit(this.result);
    this.emit(Events.SUITE_FINISHED);
  }

  get _suites() {
    return this._runnables.filter(runnable => {
      return runnable.type === Suite.TYPE
    });
  }
}

module.exports = Suite;
