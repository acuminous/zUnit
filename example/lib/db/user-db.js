const users = [];

module.exports = {
  list: async () => {
    return users;
  },
  findById: async (userId) => {
    const user = users.find(u => u.userId === userId);
    if (user) return user;
    throw new Error(`Not found: ${userId}`);
  },
  create: async (details) => {
    const maxUserId = users.reduce((userId, user) => {
      if (userId >= user.userId) return userId;
      return user.userId;
    }, 0);
    const userId = maxUserId + 1;
    users.push({ ...details, userId });
    return userId;
  },
  update: async (userId, details) => {
    const existing = users.find(u => u.userId === userId);
    if (!existing) throw new Error(`Not found: ${userId}`);

    existing.name = details.name;
    return existing;
  },
  flush: async () => {
    users.length = 0;
  }
};

