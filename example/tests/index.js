const path = require('path');
const { EOL } = require('os');
const { Harness, MultiReporter, SpecReporter, syntax } = require('../..');

Object.entries(syntax).forEach(([keyword, fn]) => global[keyword] = fn);

const filename = path.resolve(__dirname, process.argv[2]);
const suite = require(filename);
const harness = new Harness(suite);

const interactive = String(process.env.CI).toLowerCase() !== 'true';

const reporter = new MultiReporter()
  .add(new SpecReporter({ colours: interactive }));

harness.run(reporter).then(() => {
  if (harness.failed) process.exit(1);
  if (harness.hasExclusiveTests()) {
    console.log(`Found one or more exclusive tests!${EOL}`);
    process.exit(2);
  }
});
