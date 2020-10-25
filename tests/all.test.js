const { describe } = require('..');
const suiteTests = require('./Suite.test');
const testTests = require('./Test.test');

describe('ZUnit', ({ include }) => {
  include(suiteTests, testTests);
})
