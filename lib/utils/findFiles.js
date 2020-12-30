const fs = require('fs');
const path = require('path');

function findFiles(options = {}) {

  const directory = options.directory || process.cwd();
  const byMatchingFilePath = options.filter || byDirectoryOrPattern;
  const pattern = options.pattern || /.*/;

  return fs.readdirSync(directory)
    .map(toFullPath)
    .filter(byMatchingFilePath)
    .reduce(toFlattenedFilePaths, [])
    .sort(alphabetically);

  function byDirectoryOrPattern(filePath) {
    return fs.statSync(filePath).isDirectory() || pattern.test(path.basename(filePath));
  }

  function toFullPath(filename) {
    return path.join(directory, filename);
  }

  function toFlattenedFilePaths(filePaths, filePath) {
    const additions = fs.statSync(filePath).isDirectory()
      ? findFiles({ ...options, directory: filePath }, filePaths)
      : filePath;
    return filePaths.concat(additions);
  }

  function alphabetically(a, b) {
    return a.localeCompare(b);
  }
}

module.exports = findFiles;
