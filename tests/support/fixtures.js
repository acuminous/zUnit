const { Test } = require('../..');

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
  pass,
  fail,
  skip,
  passingTest,
  failingTest,
  skippedTest,
  exclusiveTest,
};
