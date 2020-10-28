const path = require('path');
const { EOL } = require('os');
const { Harness, MultiReporter, SpecReporter, TapReporter } = require('..');

const filename = path.resolve(__dirname, process.argv[2]);
const harness = new Harness().load(filename);

const interactive = String(process.env.CI).toLowerCase() !== 'true';

const reporter = new MultiReporter()
  .add(new SpecReporter({ colours: interactive }))
  .add(new TapReporter());

harness.run(reporter).then(() => {
  if (harness.failed) process.exit(1);
  if (harness.hasExclusiveTests()) {
    console.log(`Found one or more exclusive tests!${EOL}`);
    process.exit(2);
  }
});
