const path = require('path');
const assert = require('assert');
const { describe, it, Testable } = require('..');
const loadModule = require('../lib/utils/loadModule');

describe('Module Loader', () => {
  it('should load an emitted cjs module', async () => {
    const mod = await load('CommonJS.emitted.cjs');
    assert.ok(mod instanceof Testable);
  });

  it('should load an exported cjs module', async () => {
    const mod = await load('CommonJS.exported.cjs');
    assert.ok(mod instanceof Testable);
  });

  it('should report an unloadable cjs module', async () => {
    await assert.rejects(
      () => load('CommonJS.unloadable.cjs'),
      (err) => {
        assert.match(err.message, /Module not found in .*\/CommonJS.unloadable.cjs. Did you forget to export it\?/);
        return true;
      }
    );
  });

  it('should load an emitted mjs module', async () => {
    const mod = await load('ECMAScript.emitted.mjs');
    assert.ok(mod instanceof Testable);
  });

  it('should load an exported mjs module', async () => {
    const mod = await load('ECMAScript.exported.mjs');
    assert.ok(mod instanceof Testable);
  });

  it('should report an unloadable mjs module', async () => {
    await assert.rejects(
      () => load('ECMAScript.unloadable.mjs'),
      (err) => {
        assert.match(err.message, /Module not found in .*\/ECMAScript.unloadable.mjs. Did you forget to export it\?/);
        return true;
      }
    );
  });
});

async function load(fileName) {
  return loadModule(path.join(__dirname, 'module-types', fileName));
}
