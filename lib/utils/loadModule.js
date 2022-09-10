async function loadModule(filePath) {
  let mod;
  process.once('zunit:testable', (testable) => {
    mod = testable;
  });
  try {
    const required = require(filePath);
    mod = mod || required;
  } catch (err) {
    if (err.code !== 'ERR_REQUIRE_ESM') throw err;
    const imported = await import(filePath);
    mod = mod || imported;
  }
  return mod;
}

module.exports = loadModule;
