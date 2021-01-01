const userDb = require('../db/user-db');

module.exports = {
  list: async () => {
    const users = await userDb.list();
    return { status: 200, body: users };
  },
  findByUserId: async (userId) => {
    try {
      const user = await userDb.findByUserId(userId);
      return { status: 200, body: user };
    } catch (err) {
      return { status: 404, body: {} };
    }
  },
  create: async (details) => {
    const userId = await userDb.create(details);
    return { status: 200, body: { userId } };
  },
  update: async (userId, details) => {
    try {
      await userDb.update(userId, details);
      return { status: 204 };
    } catch (err) {
      return { status: 404, body: {} };
    }
  }
};
