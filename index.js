const Events = require('./lib/Events');
const Harness = require('./lib/Harness');
const Hook = require('./lib/Hook');
const HookSet = require('./lib/HookSet');
const Options = require('./lib/Options');
const Outcomes = require('./lib/Outcomes');
const reporters = require('./lib/reporters');
const Suite = require('./lib/Suite');
const syntax = require('./lib/syntax');
const Test = require('./lib/Test');
const Testable = require('./lib/Testable');

module.exports = {
  Events,
  Harness,
  Hook,
  HookSet,
  Options,
  Outcomes,
  Suite,
  Test,
  Testable,
  syntax,
  ...syntax,
  ...reporters,
};
