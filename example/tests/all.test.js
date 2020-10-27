const { describe } = require('../..');
const apiTests = require('./api/api.test');
const dbTests = require('./db/db.test');

describe('All Tests', ({ include }) => {
  include(apiTests, dbTests);
});
