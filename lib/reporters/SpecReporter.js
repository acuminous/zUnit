const effects = require('./effects');
const StreamReporter = require('./StreamReporter');
const Events = require('../Events');
const Outcomes = require('../Outcomes');

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
      [Outcomes.PASSED]: (test) => this._testPassed(test),
      [Outcomes.FAILED]: (test) => this._testFailed(test),
      [Outcomes.SKIPPED]: (test) => this._testSkipped(test),
    };
  }

  withHarness(harness) {
    harness.once(Events.FINISHED, () => {
      this._writeln();
      this._writeln(this._effects('Summary', ['underscore']));
      const { tests, passed, failed, skipped, duration } = harness.report.stats;
      const summary = [
        `Tests: ${tests.toLocaleString()}`,
        this._effects(`Passed: ${passed.toLocaleString()}`, 'green'),
        this._effects(`Failed: ${failed.toLocaleString()}`, 'red'),
        this._effects(`Skipped: ${skipped.toLocaleString()}`, 'cyan'),
        this._effects(`Duration: ${duration.toLocaleString()}ms`, 'white'),
      ].join(', ');
      this._writeln(`${this._padding(1)}${summary}`);
      this._writeln();
      this.end();
    });
  }

  withSuite(suite) {
    suite.once(Events.STARTED, () => {
      this._writeln();
      this._writeln(`${this._padding()}${this._effects(suite.name, ['underscore'])}`);
    });
    suite.once(Events.FAILED, () => {
      this._writeln(`${this._padding()} ${this._effects(`- SUITE FAILED: ${suite.error.message}`, 'red')}`);
      this._writeln(suite.error.stack);
    });
    return new SpecReporter(this._options, this._level + 1);
  }

  withTest(test) {
    test.once(Events.STARTED, () => {
      this._writeln(this._effects(`${this._padding()}${test.name} `, 'white'));
    }).once(Events.FINISHED, (result) => {
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
    return this._effects(`(${test.stats.duration.toLocaleString()}ms)`, 'dim');
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
