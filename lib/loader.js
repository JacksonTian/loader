var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

/**
 * 静态资源加载器
 * @param js 压缩js路径
 * @param css 压缩css路径
 */
var Loader = function (js, css) {
  if (!(this instanceof Loader)) {
    return new Loader(js, css);
  }
  var min = {};
  min[path.extname(js)] = js;
  min[path.extname(css)] = css;
  this.script = {
    assets: [],
    min: min[".js"]
  };
  this.style = {
    assets: [],
    min: min[".css"]
  };
};

/**
 * 加载js文件
 */
Loader.prototype.js = function (src) {
  this.script.assets.push(src);
  return this;
};

/**
 * 加载css文件
 */
Loader.prototype.css = function (href) {
  this.style.assets.push(href);
  return this;
};

/**
 * 生成开发环境下的标签
 */
Loader.prototype.dev = function () {
  var html = '';
  var version = 'v=' + (new Date()).getTime();
  var i;
  for (i = 0; i < this.script.assets.length; i++) {
    html += '<script src="' + this.script.assets[i] + (this.hasQuery(this.script.assets[i]) ? "&" : "?") + version + '"></script>\n';
  }
  for (i = 0; i < this.style.assets.length; i++) {
    html += '<link rel="stylesheet" href="' + this.style.assets[i] + (this.hasQuery(this.style.assets[i]) ? "&" : "?") + version + '" media="all" />\n';
  }

  return html;
};

/**
 * 生成线上环境下的标签
 */
Loader.prototype.pro = function (CDNMap, prefix) {
  prefix = prefix || '';
  var html = '';
  if (this.script.min) {
    var scriptMin = CDNMap[this.script.min];
    html += '<script src="' + prefix + scriptMin + '"></script>\n';
  }
  if (this.style.min) {
    var styleMin = CDNMap[this.style.min];
    html += '<link rel="stylesheet" href="' + prefix + styleMin  + '" media="all" />\n';
  }

  return html;
};

/**
 * 根据环境和版本号去生成对应标签
 * 如果debug没有传入，将取`process.env.NODE_ENV`作为判断，`production`为产品环境，其余为debug模式
 */
Loader.prototype.done = function (CDNMap, prefix, debug) {
  CDNMap = CDNMap || {};
  var mode = debug !== undefined ? debug : process.env.NODE_ENV === "production";
  return mode ? this.pro(CDNMap, prefix) : this.dev();
};

Loader.prototype.hasQuery = function(url) {
  return url.indexOf('?') > -1;
};

/**
 * 扫描文本中的静态资源部分，提取出压缩路径和文件列表。
 * 结果如下：
 * [
 * {min: "x.min.js", assets:["path1", "path2"]},
 * {min: "x.min.css", assets:["path1", "path2"]}
 * ]
 */
Loader.scan = function (view) {
  var reg = /Loader\([\s\S]*?\.done\(.*\)/gm;
  var argReg = /Loader\(['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?\)/g;
  //var argReg = /['"]([^"']+)['"]/ig;
  var jsReg = /.js\(['"](.*)['"]\)/g;
  var cssReg = /.css\(['"](.*)['"]\)/g;
  //var asyncReg = /.async\(['"](.*)['"]\)/g;

  var retVal = [];

  var block;
  while ((block = reg.exec(view)) !== null) {
    var find = block[0];
    if (find) {
      var arg;
      var min = {};
      while ((arg = argReg.exec(find)) !== null) {
        min[path.extname(arg[1])] = arg[1];
        min[path.extname(arg[2])] = arg[2];
      }

      var jsAssets = [];
      var js;
      while ((js = jsReg.exec(find)) !== null) {
        jsAssets.push(js[1]);
      }
      if (jsAssets.length) {
        retVal.push({min: min[".js"], assets: jsAssets});
      }

      var cssAssets = [];
      var css;
      while ((css = cssReg.exec(find)) !== null) {
        cssAssets.push(css[1]);
      }
      if (cssAssets.length) {
        retVal.push({min: min[".css"], assets: cssAssets});
      }
    }
  }
  return retVal;
};

/**
 * 扫描指定目录，生成合并压缩隐射关系数组
 * 生成结构如下：
 * [
 * {min: "x.min.js", assets:["path1", "path2"]},
 * {min: "x.min.css", assets:["path1", "path2"]}
 * ]
 */
Loader.scanDir = function (dirpath) {
  var views = fs.readdirSync(dirpath);
  var combo = [];

  views = views.filter(function (val, index) {
    return ['.DS_Store', '.svn'].indexOf(val) === -1;
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
 */
Loader.transformScript = function (input) {
  var parser = require('uglify-js').parser;
  var uglify = require('uglify-js').uglify;
  var ast = uglify.ast_squeeze(uglify.ast_mangle(parser.parse(input)));
  return uglify.gen_code(ast);
};

/**
 * 调用clean css模块压缩样式表文件
 */
Loader.transformStyle = function (input) {
  var cleaner = require('clean-css');
  return cleaner.process(input);
};

/**
 * 根据传入隐射关系数组和指定的基本目录地址
 * 根据指定压缩文件的后缀调用uglifyjs和cleancss压缩文本
 * 并写入到指定压缩文件
 */
Loader.minify = function (basedir, arr, justCombo) {
  arr.forEach(function (item, index) {
    var min = item.min;
    var content = "";
    item.assets.forEach(function (asset) {
      var file = path.join(basedir, asset);
      content += fs.readFileSync(file, 'utf-8') + "\n";
    });

    var md5 = crypto.createHash('md5');
    var hash = md5.update(content).digest('hex').slice(24);
    var extname = path.extname(min);
    var filename = path.basename(min, extname) + '.' + hash + extname;
    item.hash = path.dirname(min) + '/' + filename;

    if (!justCombo) {
      content = (extname === ".js") ? Loader.transformScript(content) : Loader.transformStyle(content);
    }
    fs.writeFileSync(path.join(basedir, item.hash), content);
  });
  return arr;
};

Loader.map = function (arr) {
  var map = {};
  arr.forEach(function (item) {
    map[item.min] = item.hash;
  });
  return map;
};

module.exports = Loader;
