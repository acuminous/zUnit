const StreamReporter = require('./StreamReporter');
const Events = require('../Events');

const ESCAPES = {
  ' ': /\s*\n\s*/g,
  '&amp;': /&/g,
  '&lt;': /</g,
  '&gt;': />/g,
  '&quot;': /"/g,
};

// See https://maven.apache.org/surefire/maven-surefire-plugin/xsd/surefire-test-report-3.0.xsd
class SurefireReporter extends StreamReporter {
  constructor(options = {}) {
    super(options);
  }

  withHarness(harness) {
    harness.on(Events.FINISHED, () => {
      this._writeXmlVersion();
      this._writeTestSuite(harness.report);
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

  _writeTestSuite(node) {
    this._writeln(`<testsuite name="${this._escape(node.name)}" tests="${node.stats.tests}" errors="0" failures="${node.stats.failed}" skipped="${node.stats.skipped}" time="${this._time(node)}">`);
    this._writeTestCases(node, node.children);
    this._writeln('</testsuite>');
  }

  _writeTestCases(node, children) {
    if (node.isTest()) return this._writeTestCase(node);
    children.forEach((child) => {
      this._writeTestCases(child, child.children);
    });
  }

  _writeTestCase(node) {
    this._writeln(`  <testcase name="${this._escape(node.description)}" time="${this._time(node)}">`);
    if (node.failed) this._writeFailures(node);
    else if (node.skipped) this._writeSkipped(node);
    this._writeln('  </testcase>');
  }

  _writeFailures(node) {
    node.errors.forEach((error) => {
      const message = error.message || String(error);
      this._writeln(`    <failure message="${this._escape(message)}" type="${error.constructor.name}">`);
      this._writeCData(error.stack);
      this._writeln('    </failure>');
    });
  }

  _writeSkipped(node) {
    this._writeln(`    <skipped message="${this._escape(node.reason)}">`);
    this._writeln('    </skipped>');
  }

  _writeCData(text) {
    this._writeln('<![CDATA[');
    this._writeln(text);
    this._writeln(']]>');
  }

  _time(node) {
    return (node.stats.duration / 1000).toLocaleString();
  }

  _escape(text) {
    return Object.entries(ESCAPES)
      .reduce((escaped, [replacement, pattern]) => {
        return escaped.replace(pattern, replacement);
      }, text)
      .trim();
  }
}

module.exports = SurefireReporter;
