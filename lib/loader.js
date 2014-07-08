/**
 * 本文件用于loader的实现
 */

/*!
 * Dependencies
 */
var fs = require('fs');
var url = require('url');
var util = require('util');
var path = require('path');
var crypto = require('crypto');
var uglify = require('uglify-js');
var Cleaner = require('clean-css');
var less = require('less');
var stylus = require('stylus');
var coffee = require('coffee-script');

/**
 * 静态资源加载器
 * @param js 压缩js路径
 * @param css 压缩css路径
 */
var Loader = function (js, css) {
  if (!(this instanceof Loader)) {
    return new Loader(js, css);
  }
  var target = {};
  target[path.extname(js)] = js;
  target[path.extname(css)] = css;

  this.script = {
    assets: [],
    target: target[".js"]
  };
  this.style = {
    assets: [],
    target: target[".css"]
  };
};

/**
 * 加载js文件
 * @param {String} src js文件相对项目根目录的路径
 */
Loader.prototype.js = function (src) {
  this.script.assets.push(src);
  return this;
};

/**
 * 加载css文件
 * @param {String} href css文件相对项目根目录的路径
 */
Loader.prototype.css = function (href) {
  this.style.assets.push(href);
  return this;
};

/**
 * 记得在static中间件之前使用，否则会被静态文件中间件处理
 */
Loader.less = function (root) {
  return function (req, res, next) {
    if ('GET' !== req.method && 'HEAD' !== req.method) {
      return next();
    }
    var pathname = url.parse(req.originalUrl).pathname;
    if (!pathname.match(/\.less$/)) {
      return next();
    }
    fs.readFile(path.join(root, pathname), 'utf8', function (err, content) {
      if (err) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        if ('HEAD' === req.method) {
          return res.end();
        }
        res.end('Cannot find ' + req.originalUrl + '\n');
        return;
      }
      // 调用less将源文件内容翻译为CSS
      less.render(content, function (err, css) {
        if (err) {
          return next(err);
        }
        res.writeHead(200, {
          'Content-Type': 'text/css'
        });
        res.end(css);
      });
    });
  };
};

/**
 * 记得在static中间件之前使用，否则会被静态文件中间件处理
 */
Loader.stylus = function (root) {
  return function (req, res, next) {
    if ('GET' !== req.method && 'HEAD' !== req.method) {
      return next();
    }
    var pathname = url.parse(req.originalUrl).pathname;
    if (!pathname.match(/\.styl$/)) {
      return next();
    }
    fs.readFile(path.join(root, pathname), 'utf8', function (err, content) {
      if (err) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        if ('HEAD' === req.method) {
          return res.end();
        }
        res.end('Cannot find ' + req.originalUrl + '\n');
        return;
      }
      // 调用stylus将源文件内容翻译为CSS
      stylus(content).render(function (err, css) {
        if (err) {
          return next(err);
        }
        res.writeHead(200, {
          'Content-Type': 'text/css'
        });
        res.end(css);
      });
    });
  };
};

/**
 * 记得在static中间件之前使用，否则会被静态文件中间件处理
 */
Loader.coffee = function (root) {
  return function (req, res, next) {
    if ('GET' !== req.method && 'HEAD' !== req.method) {
      return next();
    }
    var pathname = url.parse(req.originalUrl).pathname;
    if (!pathname.match(/\.coffee$/)) {
      return next();
    }
    fs.readFile(path.join(root, pathname), 'utf8', function (err, content) {
      if (err) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        if ('HEAD' === req.method) {
          return res.end();
        }
        res.end('Cannot find ' + req.originalUrl + '\n');
        return;
      }
      // 调用coffee-script编译源文件
      var output;
      try {
        output = coffee.compile(content);
      } catch (ex) {
        return next(ex);
      }
      res.writeHead(200, {
        'Content-Type': 'text/javascript'
      });
      res.end(output);
    });
  };
};

var timestamp = (new Date()).getTime();

/**
 * 生成开发环境下的标签
 */
Loader.prototype.dev = function (prefix) {
  var html = '';
  prefix = prefix || '';
  var version = '?v=' + timestamp;

  var i;
  for (i = 0; i < this.script.assets.length; i++) {
    html += '<script src="' + prefix + this.script.assets[i] + version + '"></script>\n';
  }
  for (i = 0; i < this.style.assets.length; i++) {
    html += '<link rel="stylesheet" href="' + prefix + this.style.assets[i] + version + '" media="all" />\n';
  }

  return html;
};

/**
 * 生成线上环境下的标签
 * @param {Object} CDNMap 通过Loader.scanDir() => Loader.minify() => Loader.map()得到的map文件
 * @param {String} prefix CDN前缀。如有CDN，可以一键切换文件到CDN中
 */
Loader.prototype.pro = function (CDNMap, prefix) {
  prefix = prefix || '';
  var html = '';
  var scriptTarget = this.script.target;
  if (scriptTarget && CDNMap[scriptTarget]) {
    html += '<script src="' + prefix + CDNMap[scriptTarget] + '"></script>\n';
  }
  var styleTarget = this.style.target;
  if (styleTarget && CDNMap[styleTarget]) {
    html += '<link rel="stylesheet" href="' + prefix + CDNMap[styleTarget]  + '" media="all" />\n';
  }

  return html;
};

/**
 * 根据环境和版本号去生成对应标签
 * 如果env没有传入，将取`process.env.NODE_ENV`作为判断，`production`为产品环境，其余将采用原始版本
 * @param {Object} CDNMap 通过Loader.scanDir() => Loader.minify() => Loader.map()得到的map文件
 * @param {String} prefix CDN前缀。如有CDN，可以一键切换文件到CDN中
 * @param {Boolean} env 是否启用压缩版
 */
Loader.prototype.done = function (CDNMap, prefix, env) {
  CDNMap = CDNMap || {};
  var mode = (env !== undefined) ? env : (process.env.NODE_ENV === "production");
  return mode ? this.pro(CDNMap, prefix) : this.dev(prefix);
};

/**
 * 扫描文本中的静态资源部分，提取出目标路径和文件列表。
 * 结果如下：
 * ```
 * [
 *   {target: "x.js", assets:["path1", "path2"]},
 *   {target: "x.css", assets:["path1", "path2"]}
 * ]
 * ```
 * @param {String} view view html code
 */
Loader.scan = function (view) {
  var reg = /Loader\([\s\S]*?\.done\(.*\)/gm;
  var argReg = /Loader\(['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?\)/g;
  var jsReg = /.js\(['"](.*?)['"]\)/g;
  var cssReg = /.css\(['"](.*?)['"]\)/g;

  var retVal = [];

  var block;
  while ((block = reg.exec(view)) !== null) {
    var find = block[0];
    if (find) {
      var arg;
      var target = {};
      while ((arg = argReg.exec(find)) !== null) {
        target[path.extname(arg[1])] = arg[1];
        target[path.extname(arg[2])] = arg[2];
      }

      var jsAssets = [];
      var js;
      while ((js = jsReg.exec(find)) !== null) {
        jsAssets.push(js[1]);
      }
      if (jsAssets.length) {
        retVal.push({target: target[".js"], assets: jsAssets});
      }

      var cssAssets = [];
      var css;
      while ((css = cssReg.exec(find)) !== null) {
        cssAssets.push(css[1]);
      }
      if (cssAssets.length) {
        retVal.push({target: target[".css"], assets: cssAssets});
      }
    }
  }
  return retVal;
};

/**
 * 扫描指定目录，生成合并压缩映射关系数组
 * 生成结构如下：
 * ```
 * [
 *   {target: "x.js", assets:["path1", "path2"]},
 *   {target: "x.css", assets:["path1", "path2"]}
 * ]
 * ```
 * @param {String} dirpath The dir path
 */
Loader.scanDir = function (dirpath) {
  var views = fs.readdirSync(dirpath).sort();
  var combo = [];

  views = views.filter(function (val, index) {
    return ['.DS_Store', '.svn', '.git'].indexOf(val) === -1;
  });

  views.forEach(function (filename, index) {
    var realPath = path.join(dirpath, filename);
    var stat = fs.statSync(realPath);
    if (stat.isFile()) {
      var section = fs.readFileSync(realPath, "utf8");
      combo = combo.concat(Loader.scan(section));
    } else if (stat.isDirectory()) {
      combo = combo.concat(Loader.scanDir(realPath));
    }
  });

  return combo;
};

/**
 * 调用uglifyjs模块压缩脚本文件
 * @param {String} input JavaScript source code
 */
Loader.transformScript = function (input) {
  var result = uglify.minify(input, {fromString: true});
  return result.code;
};

/**
 * 调用less模块编译less文件到CSS内容
 * @param {String} input JavaScript source code
 */
Loader.transformLess = function (input) {
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
Loader.transformStylus = function (input) {
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
Loader.transformCoffee = function (input) {
  return coffee.compile(input);
};

/**
 * 调用clean css模块压缩样式表文件
 * @param {String} input CSS source code
 */
Loader.transformStyle = function (input) {
  return new Cleaner().minify(input);
};

// 用于保存编译后的结果，避免重复编译
var cache = {};

/**
 * 根据传入映射关系数组和指定的基本目录地址，调用uglifyjs和cleancss压缩文本
 * 并生成带MD5签名的压缩文件，以及一个debug文件
 * ```
 * [
 *   {target: "x.js", assets:["path1", "path2"]},
 *   {target: "x.css", assets:["path1", "path2"]}
 * ]
 * =>
 * [
 *   {target: "x.js", min: "x.hash.js", debug: "x.hash.debug.js",
 *      assets:["path1", "path2"]},
 *   {target: "x.css", min: "x.hash.css", debug: "x.hash.debug.css",
 *      assets:["path1", "path2"]}
 * ]
 * ```
 * @param {String} basedir 基本目录路径
 * @param {Array} arr 静态资源数组
 */
Loader.minify = function (basedir, arr) {
  arr.forEach(function (item, index) {
    // combo
    var content = "";
    var minified = "";
    item.assets.forEach(function (asset) {
      var cached = cache[asset];
      // 编译，压缩
      if (!cached) {
        var file = path.join(basedir, asset);
        var text = fs.readFileSync(file, 'utf-8');
        var extname = path.extname(file);
        if (extname === '.less') {
          text = Loader.transformLess(text);
        } else if (extname === '.styl') {
          text = Loader.transformStylus(text);
        } else if (extname === '.coffee') {
          text = Loader.transformCoffee(text);
        }
        var transformed;
        // transformed
        try {
          transformed = (extname === ".js" || extname === '.coffee') ? Loader.transformScript(text)
            : Loader.transformStyle(text);
        } catch (ex) {
          ex.message = util.format('Compress %s has error:\n', asset) + ex.message;
          throw ex;
        }
        cache[asset] = {
          text: text + '\n',
          minified: transformed + '\n'
        };
        cached = cache[asset];
      }

      minified += cached.minified;
      // debug
      content += cached.text;
    });

    // add hash
    var md5 = crypto.createHash('md5');
    var hash = md5.update(minified).digest('hex').slice(24);
    var target = item.target;
    var dir = path.dirname(target);
    var extname = path.extname(target);
    var basename = path.basename(target, extname);
    var format = '%s/%s.%s.%s%s'; // {dir}/{basename}.{hash}.{version}{extname}
    item.min = util.format(format, dir, basename, hash, 'min', extname);
    item.debug = util.format(format, dir, basename, hash, 'debug', extname);

    // 写入压缩的文件和debug版本的文件
    fs.writeFileSync(path.join(basedir, item.min), minified);
    fs.writeFileSync(path.join(basedir, item.debug), content);
  });

  return arr;
};

/**
 * 将压缩生成的文件映射关系转换为map
 * ```
 * [
 *   {target: "x.js", min: "x.hash.js", debug: "x.hash.debug.js",
 *      assets:["path1", "path2"]},
 *   {target: "x.css", min: "x.hash.css", debug: "x.hash.debug.css",
 *      assets:["path1", "path2"]}
 * ]
 * =>
 * {
 *   "x.js": "x.hash.js",
 *   "x.css": "x.hash.css"
 * }
 * ```
 * @param {Array} arr 压缩生成的映射关系数组
 */
Loader.map = function (arr) {
  var map = {};
  arr.forEach(function (item) {
    map[item.target] = item.min;
  });
  return map;
};

module.exports = Loader;
