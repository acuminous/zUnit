const { extname } = require('path');

const Testable = require('../Testable');

async function loadModule(filePath) {
  let emittedModule;
  let exportedModule;

  process.once('zunit:testable', (testable) => {
    emittedModule = testable;
  });

  switch (extname(filePath)) {
    case '.cjs': {
      exportedModule = require(filePath);
      break;
    }
    case '.mjs': {
      exportedModule = (await import(filePath))?.default;
      break;
    }
    default: {
      try {
        exportedModule = require(filePath);
      } catch (err) {
        if (err.code !== 'ERR_REQUIRE_ESM') throw err;
        exportedModule = (await import(filePath))?.default;
      }
    }
  }

  const mod = emittedModule || exportedModule;
  if (mod instanceof Testable) return mod;

  throw new Error(`Module not found in ${filePath}. Did you forget to export it?`);
}

module.exports = loadModule;
