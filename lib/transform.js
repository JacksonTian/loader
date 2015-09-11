var uglify = require('uglify-js');
var Cleaner = require('clean-css');
var less = require('less');
var stylus = require('stylus');
var coffee = require('coffee-script');

/**
 * 调用uglifyjs模块压缩脚本文件
 * @param {String} input JavaScript source code
 */
exports.transformScript = function (input) {
  var result = uglify.minify(input, {fromString: true});
  return result.code;
};

/**
 * 调用clean css模块压缩样式表文件
 * @param {String} input CSS source code
 */
exports.transformStyle = function (input) {
  return new Cleaner().minify(input);
};

/**
 * 调用less模块编译less文件到CSS内容
 * @param {String} input JavaScript source code
 */
exports.transformLess = function (input) {
  var output;
  less.render(input, function (err, css) {
    if (err) {
      throw err;
    }
    output = css;
  });
  return output;
};

/**
 * 调用stylus模块编译stylus文件到CSS内容
 * @param {String} input JavaScript source code
 */
exports.transformStylus = function (input) {
  var output;
  stylus(input).render(function (err, css) {
    if (err) {
      throw err;
    }
    output = css;
  });
  return output;
};

/**
 * 调用coffee-script模块编译coffee文件到JS内容
 * @param {String} input JavaScript source code
 */
exports.transformCoffee = function (input) {
  return coffee.compile(input);
};
