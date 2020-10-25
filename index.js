const Suite = require('./lib/Suite');
const Test = require('./lib/Test');
const Syntax = require('./lib/Syntax');
const reporters = require('./lib/reporters');

module.exports = {
  Suite,
  Test,
  ...Syntax,
  ...reporters,
}
