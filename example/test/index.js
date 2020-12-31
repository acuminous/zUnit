const { EOL } = require('os');
const { Harness, Suite, SpecReporter, syntax } = require('../..');

Object.entries(syntax).forEach(([keyword, fn]) => global[keyword] = fn);

const suite = new Suite('Example').discover();
const harness = new Harness(suite);

const interactive = String(process.env.CI).toLowerCase() !== 'true';
const reporter = new SpecReporter({ colours: interactive });

harness.run(reporter).then((report) => {
  if (report.stats.failed > 0) process.exit(1);
  if (report.stats.tested !== report.stats.passed) {
    console.log(`Found one or more exclusive tests!${EOL}`);
    process.exit(2);
  }
});
