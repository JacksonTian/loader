var fs = require("fs");
var path = require("path");

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
  //this.asyncAssets = [];
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

// Loader.prototype.async = function (src) {
//   this.asyncAssets.push(src);
//   return this;
// };

/**
 * 生成开发环境下的标签
 */
Loader.prototype.dev = function (version) {
  var html = '';
  var i, l;

  for (i = 0, l = this.script.assets.length; i < l; i++) {
    html += '<script src="' + this.script.assets[i] + '"></script>\n';
  }
   for (i = 0, l = this.style.assets.length; i < l; i++) {
    html += '<link rel="stylesheet" href="' + this.style.assets[i] + '" media="all" />\n';
  }

  // for (i = 0, l = this.asyncAssets.length; i < l; i++) {
  //   html += '<script>\n' +
  //       '(function () {\n' + 
  //       'var s = document.createElement("script");\n' +
  //       's.type = "text/javascript";\n' +
  //       's.async = true;\n' +
  //       's.src = "' + this.asyncAssets[i] + '";\n' +
  //       'var h = document.getElementsByTagName("script")[0];\n' +
  //       'h.parentNode.insertBefore(s, h);\n' +
  //     '}());\n' +
  //   '</script>\n';
  // }
  return html;
};

/**
 * 生成线上环境下的标签
 */
Loader.prototype.pro = function (version) {
  var html = '';
  if (this.script.min) {
    html += '<script src="' + this.script.min + '?v=' + version + '"></script>\n';
  }
  if (this.style.min) {
    html += '<link rel="stylesheet" href="' + this.style.min + '?v=' + version + '" media="all" />\n';
  }

  // for (i = 0, l = this.asyncAssets.length; i < l; i++) {
  //   html += '<script>\n' +
  //       '(function () {\n' +
  //       'var s = document.createElement("script");\n' +
  //       's.type = "text/javascript";\n' +
  //       's.async = true;\n' +
  //       's.src = "' + this.asyncAssets[i] + '";\n' +
  //       'var h = document.getElementsByTagName("script")[0];\n' +
  //       'h.parentNode.insertBefore(s, h);\n' +
  //     '}());\n' +
  //   '</script>\n';
  // }
  return html;
};

/**
 * 根据环境和版本号去生成对应标签
 */
Loader.prototype.done = function (env, version) {
  console.log(arguments);
  return (env === "production") ? this.pro(version) : this.dev();
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
Loader.minify = function (basedir, arr) {
  arr.forEach(function (item, index) {
    var min = item.min;
    var content = "";
    item.assets.forEach(function (asset) {
      content += fs.readFileSync(path.join(basedir, asset), 'utf-8') + "\n";
    });

    var minified = path.extname(min) === ".js" ? Loader.transformScript(content) : Loader.transformStyle(content);
    fs.writeFileSync(path.join(basedir, min), minified);
  });
};

module.exports = Loader;

