const EventEmitter = require('events');
const GraphReporter = require('./reporters/GraphReporter');
const MultiReporter = require('./reporters/MultiReporter');
const NullReporter = require('./reporters/NullReporter');
const Events = require('./Events');
const Options = require('./Options');

class Harness extends EventEmitter {
  constructor(testable, initial = {}) {
    super();
    this._testable = testable;
    this._options = new Options({ initial });
  }

  get _underlying() {
    return this._finalised || this._testable;
  }

  get numberOfTests() {
    return this._underlying.numberOfTests;
  }

  get report() {
    return this._report;
  }

  async run(reporter = new NullReporter(), runtime = {}) {
    this._checkInitialised();
    const graphReporter = new GraphReporter();
    const harnessReporter = this._createHarnessReporter(reporter, graphReporter);
    const options = this._applyOptions(runtime);
    await this._runTestable(harnessReporter, graphReporter, options);
    return this.report;
  }

  _checkInitialised() {
    if (!this._testable?.initialised) throw new Error('The harness must be initialised with a suite or test');
  }

  _createHarnessReporter(reporter, graphReporter) {
    const multiReporter = new MultiReporter().add(graphReporter, reporter);
    return multiReporter.withHarness(this);
  }

  _applyOptions(runtime) {
    const runtimeOptions = new Options({ runtime });
    return this._options.apply(runtimeOptions);
  }

  async _runTestable(harnessReporter, graphReporter, options) {
    this._start();
    this._finalised = this._testable._finalise();
    await this._finalised.run(harnessReporter, options, !this._finalised.hasExclusiveTests());
    this._report = graphReporter.toGraph();
    this._finish();
  }

  _start() {
    this.emit(Events.STARTED);
  }

  _finish() {
    this.emit(Events.FINISHED);
  }
}

module.exports = Harness;
