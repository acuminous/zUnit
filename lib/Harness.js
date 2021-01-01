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
    if (!this._testable || !this._testable._finalise) throw new Error('The harness must be initialised with a suite or test');

    const graphReporter = new GraphReporter();
    const multiReporter = new MultiReporter().add(graphReporter, reporter);
    const harnessReporter = multiReporter.withHarness(this);

    const runtimeOptions = new Options({ runtime });
    const options = this._options.apply(runtimeOptions);

    this._start();

    this._finalised = this._testable._finalise();
    await this._finalised.run(harnessReporter, options, !this._finalised.hasExclusiveTests());
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
