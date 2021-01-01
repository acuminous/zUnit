const products = [];

module.exports = {
  list: async () => {
    return products;
  },
  findById: async (productId) => {
    const product = products.find(u => u.productId === productId);
    if (product) return product;
    throw new Error(`Not found: ${productId}`);
  },
  create: async (details) => {
    const maxProductId = products.reduce((productId, product) => {
      if (productId >= product.productId) return productId;
      return product.productId;
    }, 0);
    const productId = maxProductId + 1;
    products.push({ ...details, productId });
    return productId;
  },
  update: async (productId, details) => {
    const existing = products.find(u => u.productId === productId);
    if (!existing) throw new Error(`Not found: ${productId}`);

    existing.name = details.name;
    return existing;
  },
  flush: async () => {
    products.length = 0;
  }
};
