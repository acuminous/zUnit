require('./support/assertions');
require('./support/polyfill');

const path = require('path');
const { EOL } = require('os');
const { Harness, SpecReporter, Outcomes, syntax } = require('..');

Object.entries(syntax).forEach(([keyword, fn]) => global[keyword] = fn);

const filename = path.resolve(__dirname, process.argv[2]);
const suite = require(filename);
const harness = new Harness(suite);

const interactive = String(process.env.CI).toLowerCase() !== 'true';
const reporter = new SpecReporter({ colours: interactive });

harness.run(reporter).then((report) => {
  if (report.result !== Outcomes.PASSED) process.exit(1);
  if (report.exclusive) {
    console.log(`There were one or more exclusive tests!${EOL}`);
    process.exit(2);
  }
});
