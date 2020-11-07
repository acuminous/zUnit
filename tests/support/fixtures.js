module.exports = {
  pass: (params = {}) => {
    const delay = params.delay || 1;
    return () => new Promise((resolve) => setTimeout(resolve, delay));
  },
  fail: (params = {}) => {
    const delay = params.delay || 1;
    const error = params.error || new Error('Oh Noes!');
    return () => new Promise((resolve, reject) => setTimeout(() => reject(error), delay));
  }
};
