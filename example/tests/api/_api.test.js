const { describe } = require('../../..');
const userApiTests = require('./user-api.test');
const productApiTests = require('./product-api.test');

describe('API Tests', ({ include }) => {
  include(userApiTests, productApiTests);
});
