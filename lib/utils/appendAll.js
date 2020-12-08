function appendAll(seed, items) {
  return items.reduce((list, item) => {
    return list.concat(item);
  }, seed);
}

module.exports = appendAll;
