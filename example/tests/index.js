const path = require('path');
const { MultiReporter, SpecReporter, TapReporter } = require('../..');

const filename = path.resolve(__dirname, process.argv[2]);
const runnable = require(filename);

const interactive = String(process.env.CI).toLowerCase() !== 'true';

const reporter = new MultiReporter()
  .add(new SpecReporter({ colours: interactive }))
  .add(new TapReporter());

runnable.run(reporter).then(() => {
  if (runnable.failed) process.exit(1);
});
