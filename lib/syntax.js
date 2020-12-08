const Suite = require('./Suite');
const Test = require('./Test');
const { Before, After } = require('./Hooks');
const context = new Array();

function describe(name, fn, options) {
  _describe(name, fn, { ...options });
}

function xdescribe(name, fn, options) {
  _describe(name, fn, { ...options, skip: true });
}

function _describe(name, fn, options) {
  const suite = new Suite(name, options);
  context.push(suite);
  fn();
  context.pop();
  publish(suite);
}

function it(name, fn, options) {
  _it(name, fn, { ...options });
}

function xit(name, fn, options) {
  _it(name, fn, { ...options, skip: true });
}

function _it(name, fn, options) {
  const test = new Test(name, fn, options);
  publish(test);
}

function before(...args) {
  const [name, fn] = parseHookArguments('before', ...args);
  const hook = new Before(name, fn);
  currentSuite().before(hook);
}

function beforeEach(...args) {
  const [name, fn] = parseHookArguments('beforeEach', ...args);
  const hook = new Before(name, fn);
  currentSuite().beforeEach(hook);
}

function afterEach(...args) {
  const [name, fn] = parseHookArguments('afterEach', ...args);
  const hook = new After(name, fn);
  currentSuite().afterEach(hook);
}

function after(...args) {
  const [name, fn] = parseHookArguments('after', ...args);
  const hook = new After(name, fn);
  currentSuite().after(hook);
}

function parseHookArguments(defaultName, ...args) {
  return args.length === 1 ? [defaultName, ...args] : args;
}

function include(...testables) {
  currentSuite().add(...testables);
}

function currentSuite() {
  return context[context.length - 1];
}

function publish(testable) {
  if (context.length > 0) {
    currentSuite().add(testable);
  } else {
    const caller = getCaller();
    caller.exports = testable;
  }
}

function getCaller() {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  const originalStackTraceLimit = Error.stackTraceLimit;

  Error.prepareStackTrace = function(_, stack) {
    return stack;
  };

  Error.stackTraceLimit = 4;

  const err = new Error();

  Error.captureStackTrace(err, getCaller);

  const stack = err.stack;

  Error.prepareStackTrace = originalPrepareStackTrace;
  Error.stackTraceLimit = originalStackTraceLimit;

  const fileName = stack[stack.length - 1].getFileName();
  return require.cache[fileName];
}

module.exports = {
  describe,
  xdescribe,
  it,
  xit,
  before,
  beforeEach,
  after,
  afterEach,
  include,
};
