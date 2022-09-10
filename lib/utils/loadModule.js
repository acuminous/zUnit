const Testable = require('../Testable');

async function loadModule(filePath) {
  let emittedModule;

  process.once('zunit:testable', (testable) => {
    emittedModule = testable;
  });

  const exportedModule = (await import(filePath))?.default;

  const mod = emittedModule || exportedModule;
  if (mod instanceof Testable) return mod;

  throw new Error(`No zUnit suite or test found in ${filePath}. Did you forget to export one?`);
}

module.exports = loadModule;
