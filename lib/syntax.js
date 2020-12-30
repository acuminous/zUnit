const Suite = require('./Suite');
const Test = require('./Test');
const Hook = require('./Hook');
const { getCaller } = require('./utils');
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
  const hook = createHook('before', ...args);
  currentSuite().before(hook);
}

function beforeEach(...args) {
  const hook = createHook('beforeEach', ...args);
  currentSuite().beforeEach(hook);
}

function afterEach(...args) {
  const hook = createHook('afterEach', ...args);
  currentSuite().afterEach(hook);
}

function after(...args) {
  const hook = createHook('after', ...args);
  currentSuite().after(hook);
}

function createHook(defaultName, ...args) {
  const [name, fn] = args.length === 1 ? [defaultName, ...args] : args;
  return new Hook(name, fn);
}

function include(...testables) {
  currentSuite().add(testables);
}

function currentSuite() {
  return context[context.length - 1];
}

function publish(testable) {
  if (context.length > 0) {
    currentSuite().add(testable);
  } else {
    const caller = getCaller(4);
    caller.exports = testable;
  }
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
