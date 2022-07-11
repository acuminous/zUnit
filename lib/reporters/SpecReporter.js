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
    super({ ...defaults, ...options });

    this._level = level;
    this._testOutcomeHandlers = {
      [Outcomes.PASSED]: (test) => this._testPassed(test),
      [Outcomes.FAILED]: (test) => this._testFailed(test),
      [Outcomes.SKIPPED]: (test) => this._testSkipped(test),
    };
  }

  withHarness(harness) {
    harness.on(Events.FINISHED, () => {
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
    suite.on(Events.STARTED, () => {
      this._writeln();
      this._writeln(`${this._padding()}${this._effects(suite.name, ['underscore'])}`);
    });
    suite.on(Events.FINISHED, () => {
      this._writeErrors('SUITE FAILED', suite);
    });
    return new SpecReporter(this._options, this._level + 1);
  }

  withTest(test) {
    test.on(Events.STARTED, () => {
      this._writeln(this._effects(`${this._padding()}${test.name} `, 'white'));
    });
    test.on(Events.FINISHED, (result) => {
      this._testOutcomeHandlers[result](test);
    });
    return this;
  }

  _testPassed(test) {
    this._writeln(`${this._padding()} ${this._effects('- PASSED', 'green')} ${this._duration(test)}`);
  }

  _testFailed(test) {
    this._writeErrors('FAILED', test);
  }

  _testSkipped(test) {
    this._writeln(`${this._padding()} ${this._effects(`- SKIPPED: ${test.reason}`, 'cyan')} ${this._duration(test)}`);
  }

  _writeErrors(text, testable) {
    testable.errors.forEach((error, index) => {
      const message = error.message || String(error);
      this._writeln(`${this._padding()} ${this._effects(`- ${text} (${index + 1} of ${testable.errors.length}): ${this._oneLiner(message)}`, 'red')} ${this._duration(testable)}`);
      if (error.stack) {
        this._writeln();
        this._writeln(error.stack);
        this._writeln();
      }
    });
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

  _oneLiner(text) {
    return text.replace(/\s*\n\s*/g, ' ').trim();
  }
}

module.exports = SpecReporter;
