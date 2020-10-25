const Suite = require('../Suite');
const Test = require('../Test');
const { EOL } = require('os');
const effects = {
  reset: "\x1b[0m",
  bright:  "\x1b[1m",
  dim: "\x1b[2m",
  underscore:  "\x1b[4m",
  red:  "\x1b[31m",
  green:  "\x1b[32m",
  yellow:  "\x1b[33m",
  blue:  "\x1b[34m",
  magenta:  "\x1b[35m",
  cyan:  "\x1b[36m",
  white:  "\x1b[37m",
};

class ConsoleReporter {

  constructor(level = 0, options = {}) {
    this._level = level;
    this._options = this._applyDefaults(options);
  }

  withSuite(suite) {
    suite.once(Suite.STARTED, () => {
      this._writeln(`${this._padding()}${this._effects(suite.name, ['yellow', 'underscore'])}`);
    });
    suite.once(Suite.FINISHED, () => {
      if (this._level === 0) {
        this._writeln(this._effects('Summary', ['underscore']));
        const summary = [
          this._effects(`Passed: ${suite.stats.passed.toLocaleString()}`, 'green'),
          this._effects(`Failed: ${suite.stats.failed.toLocaleString()}`, 'red'),
          this._effects(`Skipped: ${suite.stats.skipped.toLocaleString()}`, 'cyan'),
          this._effects(`Duration: ${suite.duration.toLocaleString()}ms`, 'white'),
        ].join(', ');
        this._writeln(`${this._padding(1)}${summary}`);
      };
      this._writeln();
    });
    return new ConsoleReporter(this._level + 1, this.options)
  }

  withTest(test) {
    test.once(Test.STARTED, () => {
      this._write(this._effects(`${this._padding()}${test.name} `, 'white'));
    }).once(Test.FINISHED, () => {
      this._write('- ');
      switch (test.result) {
        case Test.PASSED: {
          this._write(this._effects('PASSED', 'green'));
          break;
        }
        case Test.FAILED: {
          this._write(this._effects('FAILED', 'red'));
          break;
        }
        case Test.SKIPPED: {
          this._write(this._effects('SKIPPED', 'cyan'));
          break;
        }
      }
      this._writeln(this._effects(` (${test.duration.toLocaleString()}ms)`, 'dim'));
      if (test.error) this._writeln(test.error.stack);
    })
    return this;
  }

  _applyDefaults(options) {
    return Object.assign({ indentation: 2, colours: true, colors: true }, options);
  }

  _write(text) {
    process.stdout.write(text);
  }

  _writeln(text = '') {
    this._write(text);
    this._write(EOL);
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

module.exports = ConsoleReporter;
