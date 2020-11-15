const effects = require('./effects');
const StreamReporter = require('./StreamReporter');
const RunnableEvents = require('../RunnableEvents');
const RunnableOutcomes = require('../RunnableOutcomes');

const defaults = {
  indentation: 2,
  colors: true,
  colours: true,
};

class SpecReporter extends StreamReporter {

  constructor(options = {}, level = 0) {
    super({ ...options, ...defaults });
    this._level = level;
    this._testOutcomeHandlers = {
      [RunnableOutcomes.PASSED]: (test) => this._testPassed(test),
      [RunnableOutcomes.FAILED]: (test) => this._testFailed(test),
      [RunnableOutcomes.SKIPPED]: (test) => this._testSkipped(test),
    };
  }

  withHarness(harness) {
    harness.once(RunnableEvents.FINISHED, () => {
      this._writeln();
      this._writeln(this._effects('Summary', ['underscore']));
      const summary = [
        this._effects(`Passed: ${harness.stats.passed.toLocaleString()}`, 'green'),
        this._effects(`Failed: ${harness.stats.failed.toLocaleString()}`, 'red'),
        this._effects(`Skipped: ${harness.stats.skipped.toLocaleString()}`, 'cyan'),
        this._effects(`Duration: ${harness.duration.toLocaleString()}ms`, 'white'),
      ].join(', ');
      this._writeln(`${this._padding(1)}${summary}`);
      this._writeln();
      this.end();
    });
  }

  withSuite(suite) {
    suite.once(RunnableEvents.STARTED, () => {
      this._writeln();
      this._writeln(`${this._padding()}${this._effects(suite.name, ['yellow', 'underscore'])}`);
    });
    return new SpecReporter(this._options, this._level + 1);
  }

  withTest(test) {
    test.once(RunnableEvents.STARTED, () => {
      this._writeln(this._effects(`${this._padding()}${test.name} `, 'white'));
    }).once(RunnableEvents.FINISHED, (result) => {
      this._testOutcomeHandlers[result](test);
    });
    return this;
  }

  _testPassed(test) {
    this._writeln(`${this._padding()} ${this._effects('- PASSED', 'green')} ${this._duration(test)}`);
  }

  _testFailed(test) {
    this._writeln(`${this._padding()} ${this._effects(`- FAILED: ${test.error.message}`, 'red')} ${this._duration(test)}`);
    this._writeln(test.error.stack);
  }

  _testSkipped(test) {
    this._writeln(`${this._padding()} ${this._effects(`- SKIPPED: ${test.reason}`, 'cyan')} ${this._duration(test)}`);
  }

  _duration(test) {
    return this._effects(`(${test.duration.toLocaleString()}ms)`, 'dim');
  }

  _effects(text, keys) {
    if (!(this._options.colours && this._options.colors)) return text;
    const prefix = [].concat(keys).reduce((prefix, key) => `${effects[key]}${prefix}`, '');
    const suffix = effects['reset'];
    return `${prefix}${text}${suffix}`;
  }

  _padding(level = this._level) {
    return ''.padStart(level * this._options.indentation, ' ');
  }
}

module.exports = SpecReporter;
