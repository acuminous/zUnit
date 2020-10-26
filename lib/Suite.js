const { MultiReporter, AggregateReporter } = require('./reporters');
const Runnable = require('./Runnable');
const Events = require('./Events');
const SuiteOptions = require('./SuiteOptions');

class Suite extends Runnable {

  static TYPE = 'Suite';

  constructor(name, options) {
    super(name, Suite.TYPE);
    this._runnables = [];
    this._options = new SuiteOptions(options);
    this._aggregateReporter = new AggregateReporter();
  }

  add(...additions) {
    this._runnables = additions.reduce((runnables, runnable) => {
      return runnables.concat(runnable);
    }, this._runnables);
    return this;
  }

  run(reporter, options = {}) {
    const force = !this.exclusiveDescendents;
    return this._run(reporter, options, force)
  }

  async _run(reporter, options, force) {

    const suiteReporter = new MultiReporter()
      .add(reporter, this._aggregateReporter)
      .withSuite(this);

    this._start();

    const runtimeOptions = this._options._combine(options);
    const propagatedOptions = runtimeOptions._propagate();

    for (let i = 0; i < this._runnables.length; i++) {
      const runnable = this._runnables[i];
      if (runnable._shouldRun(force)) {
        await runnable._run(suiteReporter, propagatedOptions, runnable._shouldForce(force));
        if (runnable.failed && runtimeOptions.abort) propagatedOptions._abort();
      }
    }

    this._finish(runtimeOptions);
  }

  _shouldRun(force) {
    return force || this.exclusive || this.exclusiveDescendents;
  }

  _shouldForce(force) {
    return force || this.exclusive && !this.exclusiveDescendents
  }

  _start() {
    this.started = Date.now();
    this.emit(Events.SUITE_STARTED);
  }

  _finish(runtimeOptions) {
    this.stats = this._aggregateReporter.stats;
    this.result = runtimeOptions.skip ? Events.SUITE_SKIPPED : this._aggregateReporter.result;
    this.finished = Date.now();
    this.emit(this.result);
    this.emit(Events.SUITE_FINISHED);
  }

  get _suites() {
    return this._runnables.filter(runnable => {
      return runnable.type === Suite.TYPE
    });
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

  get exclusive() {
    return this._options.exclusive;
  }

  get exclusiveDescendents() {
    return this._runnables.some(runnable => {
      return runnable.exclusive || runnable.exclusiveDescendents;
    });
  }
}

module.exports = Suite;
