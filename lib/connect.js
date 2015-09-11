var fs = require('fs');
var url = require('url');
var path = require('path');

var less = require('less');
var stylus = require('stylus');
var coffee = require('coffee-script');

/**
 * 记得在static中间件之前使用，否则会被静态文件中间件处理
 */
exports.less = function (root) {
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
exports.stylus = function (root) {
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
exports.coffee = function (root) {
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
