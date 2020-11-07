const { describe } = require('..');
const harnessTests = require('./Harness.test');
const suiteTests = require('./Suite.test');
const testTests = require('./Test.test');
const tapReporterTests = require('./reporters/TapReporter.test');

describe('ZUnit', ({ include }) => {
  include(harnessTests, suiteTests, testTests, tapReporterTests);
});
