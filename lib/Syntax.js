const Suite = require('./Suite');
const Test = require('./Test');
const { Before, After } = require('./Hooks');

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

function _describe(suite, fn)  {

  const include = function(...runnables) {
    suite.add(runnables);
  };

  const before = function (...args) {
    const [name, fn] = args.length === 1 ? ['before', ...args] : args;
    const hook = new Before(name, fn);
    suite.before(hook);
  };

  const beforeEach = function (...args) {
    const [name, fn] = args.length === 1 ? ['beforeEach', ...args] : args;
    const hook = new Before(name, fn);
    suite.beforeEach(hook);
  };

  const afterEach = function(...args) {
    const [name, fn] = args.length === 1 ? ['afterEach', ...args] : args;
    const hook = new After(name, fn);
    suite.afterEach(hook);
  };

  const after = function (...args) {
    const [name, fn] = args.length === 1 ? ['after', ...args] : args;
    const hook = new After(name, fn);
    suite.after(hook);
  };

  const describe = function(name, fn, options) {
    const child = new Suite(name, options);
    suite.add(child);
    _describe(child, fn);
  };

  const xdescribe = function(name, fn, options) {
    describe(name, fn, { ...options, skip: true });
  };

  const it = function(name, fn, options) {
    const test = new Test(name, fn, options);
    suite.add(test);
  };

  const xit = function(name, fn, options) {
    it(name, fn, { ...options, skip: true });
  };

  fn({ include, before, beforeEach, after, afterEach, describe, xdescribe, it, xit });
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
};
