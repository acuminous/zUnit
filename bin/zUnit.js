#!/usr/bin/env node

const { EOL } = require('os');
const path = require('path');
const fs = require('fs');
const { Harness, Suite, SpecReporter, syntax } = require('..');
const pkg = require(path.join(process.cwd(), 'package.json'));

const config = Object.assign(
  { name: pkg.name, require: [] },
  loadConfigFromPackageJson(),
  loadConfigFromDefaultLocations(),
  loadConfigFromSpecifiedLocation(process.argv[2]),
);

if (config.pollute) Object.entries(syntax).forEach(([keyword, fn]) => global[keyword] = fn);
if (config.require) config.require.forEach((modulePath) => require(path.resolve(modulePath)));

const options = {};
if (config.directory) Object.assign(options, { directory: path.resolve(config.directory) });
if (config.pattern) Object.assign(options, { pattern: new RegExp(config.pattern) });

const suite = new Suite(config.name).discover(options);
const harness = new Harness(suite);

const interactive = String(process.env.CI).toLowerCase() !== 'true';
const reporter = new SpecReporter({ colours: interactive });

harness.run(reporter).then((report) => {
  if (report.failed) process.exit(1);
  if (report.incomplete) {
    console.log(`One or more tests were not run!${EOL}`);
    process.exit(2);
  }
  if (config.exit) process.exit();
});

function loadConfigFromSpecifiedLocation(configPath) {
  return configPath && require(path.resolve(configPath));
}

function loadConfigFromDefaultLocations() {
  return [
    '.zUnit.json',
    '.zUnit.js',
  ].map((candidate) => {
    const configPath = path.resolve(candidate);
    return fs.existsSync(configPath) && require(configPath);
  }).find(Boolean);
}

function loadConfigFromPackageJson() {
  return pkg.zUnit;
}
