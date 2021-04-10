const assert = require('assert');
const userApi = require('../../lib/api/user-api');
const userDb = require('../../lib/db/user-db');

describe('User API Tests', () => {

  beforeEach(async () => {
    await userDb.flush();
  });

  describe('List Users', () => {

    it('should list all users', async () => {
      await userDb.create({ name: 'John' });
      await userDb.create({ name: 'Julie' });

      const response = await userApi.list();
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.length, 2);
      assert.strictEqual(response.body[0].userId, 1);
      assert.strictEqual(response.body[0].name, 'John');
      assert.strictEqual(response.body[1].userId, 2);
      assert.strictEqual(response.body[1].name, 'Julie');
    });

    xit('should list matching users', async () => {
    });

  });

  xdescribe('Get User', () => {

    it('should find a user by user id', async () => {
      await userDb.create({ name: 'John' });

      const response = await userApi.findById(1);
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.userId, 1);
      assert.strictEqual(response.body.name, 'John');
    });

    it('should 404 when a user is not found', async () => {
      const response = await userApi.findById('/api/users/999');
      assert.strictEqual(response.status, 404);
    });
  });

  describe('Create User', () => {

    it('should create a new user', async () => {
      const response = await userApi.create({ name: 'Steve' });
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.userId, 1);
    });

  });

  describe('Update User', () => {

    it('should update a user', async () => {
      await userDb.create({ name: 'John' });

      const response = await userApi.update(1, { name: 'Fred' });
      assert.strictEqual(response.status, 204);
    });

    it('should 404 when a user is not found', async () => {
      const response = await userApi.update(999, { name: 'Fred' });
      assert.strictEqual(response.status, 404);
    });
  });

});
