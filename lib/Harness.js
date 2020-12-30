const EventEmitter = require('events');
const GraphReporter = require('./reporters/GraphReporter');
const MultiReporter = require('./reporters/MultiReporter');
const NullReporter = require('./reporters/NullReporter');
const Events = require('./Events');

class Harness extends EventEmitter {

  constructor(testable, options = {}) {
    super();
    this._testable = testable;
    this._options = options;
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

  async run(reporter = new NullReporter(), runtimeOptions = {}) {
    const graphReporter = new GraphReporter();
    const multiReporter = new MultiReporter().add(graphReporter, reporter);
    const harnessReporter = multiReporter.withHarness(this);

    this._start();

    const inheritableOptions = Object.assign({}, this._options);

    this._finalised = this._testable._finalise();
    await this._finalised.run(harnessReporter, runtimeOptions, inheritableOptions, !this._finalised.hasExclusiveTests());
    this._report = graphReporter.toGraph();

    this._finish();

    return this._report;
  }

  _start() {
    this.emit(Events.STARTED);
  }

  _finish() {
    this.emit(Events.FINISHED);
  }
}

module.exports = Harness;
