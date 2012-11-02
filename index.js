module.exports = process.env.LOADER_COV ? require('./lib-cov/loader') : require('./lib/loader');
