const userDbTests = require('./user-db.test');
const productDbTests = require('./product-db.test');

describe('DB Tests', () => {
  include(userDbTests, productDbTests);

});

