const Suite = require('./Suite');
const Test = require('./Test');

function describe(name, fn, options) {
  const suite = new Suite(name, options);
  _describe(suite, fn);

  const caller = getCaller();
  caller.exports = suite;
}

function xdescribe(name, fn, options) {
  const suite = new Suite(name, { ...options, skip: true });
  _describe(suite, fn);

  const caller = getCaller();
  caller.exports = suite;
}

function _describe(suite, fn, beforeTest = [], afterTest = [])  {

  const include = function(...runnables) {
    suite.add(runnables);
  };

  const beforeEach = function(fn) {
    beforeTest.push(fn);
  };

  const afterEach = function(fn) {
    afterTest.push(fn);
  };

  const describe = function(name, fn, options) {
    const child = new Suite(name, options)
    suite.add(child);
    _describe(child, fn, beforeTest, afterTest);
  };

  const xdescribe = function(name, fn, options) {
    describe(name, fn, { ...options, skip: true });
  };

  const it = function(name, fn, options) {
    const test = new Test(name, fn, options);
    beforeTest.forEach(fn => test.before(fn));
    afterTest.forEach(fn => test.after(fn));
    suite.add(test);
  };

  const xit = function(name, fn, options) {
    it(name, fn, { ...options, skip: true });
  };

  fn({ include, beforeEach, afterEach, describe, xdescribe, it, xit });
}

function it(name, fn, options) {
  return new Test(name, fn, options);
}

function xit(name, fn, options) {
  return it(name, fn, { ...options, skip: true });
}

function getCaller() {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  const originalStackTraceLimit = Error.stackTraceLimit;

  Error.prepareStackTrace = function(_, stack) {
    return stack;
  };

  Error.stackTraceLimit = 2;

  const err = new Error();

  Error.captureStackTrace(err, getCaller);

  const stack = err.stack;

  Error.prepareStackTrace = originalPrepareStackTrace;
  Error.stackTraceLimit = originalStackTraceLimit;

  const fileName = stack[1].getFileName();
  return require.cache[fileName];
}

module.exports = {
  describe,
  xdescribe,
  it,
  xit,
}
