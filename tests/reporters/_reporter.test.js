const { describe, include } = require('../..');
const TapReporterTests = require('./TapReporter.test');
const JUnitReporterTests = require('./JUnitReporter.test');

describe('Reporters', () => {
  include(TapReporterTests, JUnitReporterTests);
});
