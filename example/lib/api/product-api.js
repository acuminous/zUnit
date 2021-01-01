const productDb = require('../db/product-db');

module.exports = {
  list: async () => {
    const products = await productDb.list();
    return { status: 200, body: products };
  },
  findByProductId: async (productId) => {
    try {
      const product = await productDb.findByProductId(productId);
      return { status: 200, body: product };
    } catch (err) {
      return { status: 404, body: {} };
    }
  },
  create: async (details) => {
    const productId = await productDb.create(details);
    return { status: 200, body: { productId } };
  },
  update: async (productId, details) => {
    try {
      await productDb.update(productId, details);
      return { status: 204 };
    } catch (err) {
      return { status: 404, body: {} };
    }
  }
};
