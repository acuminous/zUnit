async function loadModule(filePath) {
  let mod;
  try {
    mod = require(filePath);
  } catch (err) {
    if (err !== 'ERR_REQUIRE_ESM') throw err;
    mod = import(filePath);
  }
  console.log(mod);
  return mod;
}

module.exports = loadModule;
