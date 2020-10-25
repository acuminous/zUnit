function timeout(fn, duration) {
  let timer;
  return Promise.race([
    new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Timed out after ${Number(duration).toLocaleString()}ms`));
      }, duration);
    }),
    fn().then(() => clearTimeout(timer))
  ])
};

module.exports = timeout;
