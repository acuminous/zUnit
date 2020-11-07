const { EOL } = require('os');
const RunnableEvents = require('../RunnableEvents');
const RunnableOutcomes = require('../RunnableOutcomes');

class TapReporter {

  constructor(options = {}) {
    const { stream } = this._applyDefaults({ stream: process.stdout }, options);
    this._stream = stream;
    this._testOutcomeHandlers = {
      [RunnableOutcomes.PASSED]: (test) => this._testPassed(test),
      [RunnableOutcomes.FAILED]: (test) => this._testFailed(test),
      [RunnableOutcomes.SKIPPED]: (test) => this._testSkipped(test),
    };
  }

  withHarness(harness) {
    harness.on(RunnableEvents.STARTED, () => {
      this._writeln('TAP version 13');
      this._writeln(`1..${harness.numberOfTests}`);
    });
    return this;
  }

  withSuite() {
    return this;
  }

  withTest(test) {
    test.once(RunnableEvents.FINISHED, (result) => {
      this._testOutcomeHandlers[result](test);
    });
    return this;
  }

  _applyDefaults(defaults, options) {
    return Object.assign({}, defaults, options);
  }

  _testPassed(test) {
    this._writeln(`ok ${test.number} - ${test.description}`);
  }

  _testFailed(test) {
    this._writeln(`not ok ${test.number} - ${test.description}`);
  }

  _testSkipped(test) {
    this._writeln(`ok ${test.number} - ${test.description} # skip ${test.reason ? test.reason : 'No reason given'}`);
  }

  _write(text) {
    this._stream.write(text);
  }

  _writeln(text = '') {
    this._write(text);
    this._write(EOL);
  }

}

module.exports = TapReporter;
