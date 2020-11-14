const StreamReporter = require('./StreamReporter');
const GraphReporter = require('./GraphReporter');
const RunnableEvents = require('../RunnableEvents');

class JUnitReporter extends StreamReporter {

  constructor(options = {}) {
    super(options);
    this._graphReporter = new GraphReporter();
  }

  withHarness(harness) {
    this._graphReporter.withHarness(harness);
    harness.on(RunnableEvents.FINISHED, () => {
      const graph = this._graphReporter.toGraph();
      this._writeXmlVersion();
      this._writeTestSuites(graph);
    });
    return this;
  }

  withSuite(suite) {
    this._graphReporter.withSuite(suite);
    return this;
  }

  withTest(test) {
    this._graphReporter.withTest(test);
    return this;
  }

  _writeXmlVersion() {
    this._writeln('<?xml version="1.0" encoding="UTF-8" ?>');
  }

  _writeTestSuites(node) {
    this._writeln(`<testsuites name="${node.name}" tests="${node.stats.tests}" failures="${node.stats.failed}" time="${node.duration / 1000}">`);
    node.children.forEach((child) => {
      child.isTest() ? this._writeTestSuite(node, [ child ]) : this._writeTestSuite(child, child.children);
    });
    this._writeln('</testsuites>');
  }

  _writeTestSuite(node, children) {
    this._writeln(`  <testsuite name="${node.name}" tests="${node.stats.tests}" failures="${node.stats.failed}" skipped="${node.stats.skipped}" time="${node.duration / 1000}">`);
    children.forEach((child) => {
      child.isTest() ? this._writeTestCase(child, child.name) : this._descendIntoTestSuite(child);
    });
    this._writeln('  </testsuite>');
  }

  _writeTestCase(node, name) {
    this._writeln(`    <testcase name="${name}" time="${node.duration / 1000}">`);
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

  _descendIntoTestSuite(node) {
    node.children.forEach((child) => {
      child.isTest() ? this._writeTestCase(child, child.description) : this._descendIntoTestSuite(child);
    });
  }
}

module.exports = JUnitReporter;
