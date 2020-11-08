const { describe } = require('../..');
const TapReporterTests = require('./TapReporter.test');
const JUnitReporterTests = require('./JUnitReporter.test');

describe('Reporters', ({ include }) => {
  include(TapReporterTests, JUnitReporterTests);
});
