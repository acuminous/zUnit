const StreamReporter = require('./StreamReporter');
const Events = require('../Events');

// See https://llg.cubic.org/docs/junit/
class JUnitReporter extends StreamReporter {

  constructor(options = {}) {
    super(options);
  }

  withHarness(harness) {
    harness.on(Events.FINISHED, () => {
      this._writeXmlVersion();
      this._writeTestSuites(harness.report);
      this.end();
    });
    return this;
  }

  withSuite() {
    return this;
  }

  withTest() {
    return this;
  }

  _writeXmlVersion() {
    this._writeln('<?xml version="1.0" encoding="UTF-8" ?>');
  }

  _writeTestSuites(node) {
    this._writeln(`<testsuites name="${node.name}" tests="${node.stats.tests}" failures="${node.stats.failed}" time="${node.stats.duration / 1000}">`);
    node.children.forEach((child) => {
      child.isTest() ? this._writeTestSuite(node, [ child ]) : this._writeTestSuite(child, child.children);
    });
    this._writeln('</testsuites>');
  }

  _writeTestSuite(node, children) {
    this._writeln(`  <testsuite name="${node.name}" tests="${node.stats.tests}" failures="${node.stats.failed}" skipped="${node.stats.skipped}" time="${node.stats.duration / 1000}">`);
    this._recurseTestSuites(children);
    this._writeln('  </testsuite>');
  }

  _writeTestCase(node, name) {
    this._writeln(`    <testcase name="${name}" time="${node.stats.duration / 1000}">`);
    if (node.failed) {
      this._writeln(`      <failure message="${node.error.message}">`);
      this._writeln(node.error.stack);
      this._writeln('      </failure>');
    } else if (node.skipped) {
      this._writeln(`      <skipped message="${node.reason || 'No reason given'}">`);
      this._writeln('      </skipped>');
    }
    this._writeln('    </testcase>');
  }

  _recurseTestSuites(nodes) {
    nodes.forEach((node) => {
      node.isTest() ? this._writeTestCase(node, node.description) : this._recurseTestSuites(node.children);
    });
  }
}

module.exports = JUnitReporter;
