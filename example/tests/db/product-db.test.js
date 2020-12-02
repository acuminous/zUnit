const assert = require('assert');
const { describe } = require('../../..');
const productDb = require('../../lib/db/product-db');

describe('Product DB Tests', ({ beforeEach, afterEach, describe, xdescribe }) => {

  beforeEach(async () => {
    await productDb.flush();
  });

  describe('List Products', ({ it, xit }) => {

    it('should list all products', async () => {
      await productDb.create({ name: 'Broken Sword' });
      await productDb.create({ name: 'Flight of the Amazon Queen' });

      const products = await productDb.list();
      assert.equal(products.length, 2);
      assert.equal(products[0].name, 'Broken Sword');
      assert.equal(products[1].name, 'Flight of the Amazon Queen');
    });

    xit('should list matching products', async () => {
    });

  });

  xdescribe('Get Product', ({ it }) => {

    it('should find a product by product id', async () => {
      const { productId } = await productDb.create({ name: 'Broken Sword' });

      const product = await productDb.findById(productId);
      assert.equal(product.productId, productId);
      assert.equal(product.name, 'Broken Sword');
    });

    it('should error when a product is not found', async () => {
      await assert.rejects(() => {
        return productDb.findById(999);
      });
    });
  });

  describe('Create Product', ({ it }) => {

    it('should create a new product', async () => {
      const productId = await productDb.create({ name: 'Broken Sword' });

      const product = await productDb.findById(productId);
      assert.equal(product.productId, productId);
      assert.equal(product.name, 'Borked Sword');
    });

  });

  describe('Update Product', ({ it }) => {

    it('should update a product', async () => {
      const productId = await productDb.create({ name: 'Full Throttle' });

      await productDb.update(productId, { name: 'Beneath a Steel Sky' });

      const product = await productDb.findById(productId);
      assert.equal(product.name, 'Beneath a Steel Sky');
    });

    it('should error when a product is not found', async () => {
      await assert.rejects(() => {
        return productDb.update(999, { name: 'Sam & Max: Hit the Road' });
      });
    });
  });
});

