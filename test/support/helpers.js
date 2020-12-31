const { Harness, Test } = require('../..');

async function run(testable, options) {
  const harness = new Harness(testable);
  return harness.run(undefined, options);
}

function pass(params = {}) {
  const delay = params.delay || 1;
  return () => new Promise((resolve) => setTimeout(resolve, delay));
}

function fail(params = {}) {
  const delay = params.delay || 1;
  const error = params.error || new Error('Oh Noes!');
  return () => new Promise((resolve, reject) => setTimeout(() => reject(error), delay));
}

function skip(params = {}) {
  return (t) => t.skip(params.reason);
}

function timeout() {
  return () => new Promise(() => {});
}

function passingTest(name = 'Test', options) {
  return new Test(name, pass(), options);
}

function failingTest(name = 'Test', options) {
  return new Test(name, fail(), options);
}

function skippedTest(name, reason) {
  return failingTest(name, reason ? { skip: true, reason } : { skip: true });
}

function exclusiveTest(name) {
  return passingTest(name, { exclusive: true });
}

module.exports = {
  run,
  pass,
  fail,
  skip,
  timeout,
  passingTest,
  failingTest,
  skippedTest,
  exclusiveTest,
};
