const assert = require('assert');
const { xdescribe } = require('../../..');
const userDb = require('../../lib/db/user-db');

xdescribe('User DB Tests', ({ beforeEach, describe, xdescribe }) => {

  beforeEach(async () => {
    await userDb.flush();
  })

  describe('List Users', ({ it, xit }) => {

    it('should list all users', async () => {
      await userDb.create({ name: 'John' });
      await userDb.create({ name: 'Julie' });

      const users = await userDb.list();
      assert.equal(users.length, 2);
      assert.equal(users[0].name, 'John');
      assert.equal(users[1].name, 'Julie');
    });

    xit('should list matching users', async () => {
    });

  })

  xdescribe('Get User', ({ it, xit }) => {

    it('should find a user by user id', async () => {
      const { userId } = await userDb.create({ name: 'John' });

      const user = await userDb.findById(userId);
      assert.equal(user.userId, userId);
      assert.equal(user.name, 'John');
    })

    it('should error when a user is not found', async () => {
      await assert.rejects(() => {
        return userDb.findById(999);
      });
    })
  })

  describe('Create User', ({ it }) => {

    it('should create a new user', async () => {
      const userId = await userDb.create({ name: 'John' });

      const user = await userDb.findById(userId);
      assert.equal(user.userId, userId);
      assert.equal(user.name, 'John');
    });

  })

  describe('Update User', ({ it }) => {

    it('should update a user', async () => {
      const userId = await userDb.create({ name: 'Steve' });

      await userDb.update(userId, { name: 'Fred' });

      const user = await userDb.findById(userId);
      assert.equal(user.name, 'Fred');
    })

    it('should error when a user is not found', async () => {
      await assert.rejects(() => {
        return userDb.update(999, { name: 'Sam' });
      });
    })
  })
});

