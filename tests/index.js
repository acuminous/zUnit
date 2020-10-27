const path = require('path');
const { EOL } = require('os');
const { MultiReporter, SpecReporter, TapReporter } = require('..');

const filename = path.resolve(__dirname, process.argv[2]);
const runnable = require(filename);

const interactive = String(process.env.CI).toLowerCase() !== 'true';

const reporter = new MultiReporter()
  .add(new SpecReporter({ colours: interactive }))
  .add(new TapReporter());

runnable.run(reporter).then(() => {
  if (runnable.failed) process.exit(1);
  if (runnable.hasExclusiveTests()) {
    console.log(`${runnable.name} has one or more exclusive tests!${EOL}`);
    process.exit(2);
  }
});
