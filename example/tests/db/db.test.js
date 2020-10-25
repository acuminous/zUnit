const { describe } = require('../../..');
const userDbTests = require('./user-db.test');
const productDbTests = require('./product-db.test');

describe('DB Tests', ({ include }) => {

  include(userDbTests, productDbTests);

});

