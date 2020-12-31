require('./support/assertions');
require('./support/polyfill');

const { EOL } = require('os');
const { Harness, Suite, SpecReporter, syntax } = require('..');

Object.entries(syntax).forEach(([keyword, fn]) => global[keyword] = fn);

const suite = new Suite('zUnit').discover();
const harness = new Harness(suite);

const interactive = String(process.env.CI).toLowerCase() !== 'true';
const reporter = new SpecReporter({ colours: interactive });

harness.run(reporter).then((report) => {
  if (report.failed) process.exit(1);
  if (report.exclusive) {
    console.log(`There were one or more exclusive tests!${EOL}`);
    process.exit(2);
  }
});

