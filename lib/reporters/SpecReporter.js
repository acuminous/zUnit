const effects = require('./effects');
const StreamReporter = require('./StreamReporter');
const TestableEvents = require('../TestableEvents');
const TestableOutcomes = require('../TestableOutcomes');

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
      [TestableOutcomes.PASSED]: (test) => this._testPassed(test),
      [TestableOutcomes.FAILED]: (test) => this._testFailed(test),
      [TestableOutcomes.SKIPPED]: (test) => this._testSkipped(test),
    };
  }

  withHarness(harness) {
    harness.once(TestableEvents.FINISHED, () => {
      this._writeln();
      this._writeln(this._effects('Summary', ['white', 'underscore']));
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
    suite.once(TestableEvents.STARTED, () => {
      this._writeln();
      this._writeln(`${this._padding()}${this._effects(suite.name, ['white', 'underscore'])}`);
    });
    return new SpecReporter(this._options, this._level + 1);
  }

  withTest(test) {
    test.once(TestableEvents.STARTED, () => {
      this._writeln(this._effects(`${this._padding()}${test.name} `, 'white'));
    }).once(TestableEvents.FINISHED, (result) => {
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
