const Harness = require('./lib/Harness');
const Hook = require('./lib/Hook');
const HookSet = require('./lib/HookSet');
const reporters = require('./lib/reporters');
const Suite = require('./lib/Suite');
const syntax = require('./lib/syntax');
const Test = require('./lib/Test');
const Testable = require('./lib/Testable');
const Events = require('./lib/Events');
const Outcomes = require('./lib/Outcomes');

module.exports = {
  Harness,
  Hook,
  HookSet,
  Suite,
  Test,
  Testable,
  Events,
  Outcomes,
  syntax,
  ...syntax,
  ...reporters,
};
