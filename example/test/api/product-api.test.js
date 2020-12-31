const assert = require('assert');
const productApi = require('../../lib/api/product-api');
const productDb = require('../../lib/db/product-db');

describe('Product API Tests', () => {

  beforeEach(async () => {
    await productDb.flush();
  });

  describe('List Products', () => {

    it('should list all products', async () => {
      await productDb.create({ name: 'Broken Sword' });
      await productDb.create({ name: 'Flight of the Amazon Queen' });

      const response = await productApi.list();
      assert.equal(response.status, 200);
      assert.equal(response.body.length, 2);
      assert.equal(response.body[0].productId, 1);
      assert.equal(response.body[0].name, 'Broken Sword');
      assert.equal(response.body[1].productId, 2);
      assert.equal(response.body[1].name, 'Flight of the Amazon Queen');
    });

    xit('should list matching products', async () => {
    });

  });

  xdescribe('Get Product', () => {

    it('should find a product by product id', async () => {
      await productDb.create({ name: 'Broken Sword' });

      const response = await productApi.findById(1);
      assert.equal(response.status, 200);
      assert.equal(response.body.productId, 1);
      assert.equal(response.body.name, 'Broken Sword');
    });

    it('should 404 when a product is not found', async () => {
      const response = await productApi.findById('/api/products/999');
      assert.equal(response.status, 404);
    });
  });

  describe('Create Product', () => {

    it('should create a new product', async () => {
      const response = await productApi.create({ name: 'Full Throttle' });
      assert.equal(response.status, 200);
      assert.equal(response.body.productId, 1);
    });
  });

  describe('Update Product', () => {

    it('should update a product', async () => {
      await productDb.create({ name: 'Broken Sword' });

      const response = await productApi.update(1, { name: 'Beneath a Steel Sky' });
      assert.equal(response.status, 204);
    });

    it('should 404 when a product is not found', async () => {
      const response = await productApi.update(999, { name: 'Sam & Max: Hit the Road' });
      assert.equal(response.status, 404);
    });
  });

});

