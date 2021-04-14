const assert = require('assert');
const { Locals } = require('..');

describe('Locals', () => {

  it('should get and set values', async () => {
    const locals = new Locals();

    locals.set('a', 1);

    assert.strictEqual(locals.get('a'), 1);
  });

  it('should delete values', async () => {
    const locals = new Locals();

    locals.set('a', 1);
    locals.del('a');

    assert.strictEqual(locals.get('a'), undefined);
  });

  it('should mask parent values', async () => {
    const parent = new Locals();
    parent.set('a', 1);
    parent.set('b', 2);

    const child = parent.child();
    child.set('a', 2);
    child.set('b', undefined);

    assert.strictEqual(child.get('a'), 2);
    assert.strictEqual(child.get('b'), undefined);

    assert.strictEqual(parent.get('a'), 1);
    assert.strictEqual(parent.get('b'), 2);
  });

  it('should get parent values when not masked', async () => {
    const parent = new Locals();
    parent.set('a', 1);
    parent.set('b', 2);

    const child = parent.child();

    assert.strictEqual(child.get('a'), 1);
    assert.strictEqual(child.get('b'), 2);
  });
});
