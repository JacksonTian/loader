var path = require('path');
var fs = require('fs');

var builder = require('../lib/builder');

describe('builder', function () {
  it('scanView', function () {
    var str = '' +
    '<head>\n' +
    '  <meta charset="utf-8" />\n' +
    '  <!-- All JavaScript at the bottom, except for Modernizr which enables HTML5 elements & feature detects -->\n' +
    '  {%- partial(\'head.inc.html\') %}\n' +
    '  \n' +
    '  {%- Loader("/assets/scripts/index.min.js")\n' +
    '  .js("/assets/scripts/index.js")\n' +
    '  .done(version) %}\n' +
    '  {%- Loader("/assets/scripts/jqueryplugin.min.js", "/assets/styles/jqueryplugin.min.css")\n' +
    '  .js("/assets/scripts/lib/jquery.jmodal.js")\n' +
    '  .js("/assets/scripts/lib/jquery.mousewheel.min.js")\n' +
    '  .js("/assets/scripts/lib/jquery.tagsphere.min.js")\n' +
    '  .css("/hehe")\n' +
    '  .done() %}\n' +
    '</head>';

    builder.scan(str).should.eql([
      {
        target: '/assets/scripts/index.min.js',
        assets: [ '/assets/scripts/index.js' ]
      },
      {
        target: '/assets/scripts/jqueryplugin.min.js',
        assets: [ '/assets/scripts/lib/jquery.jmodal.js',
           '/assets/scripts/lib/jquery.mousewheel.min.js',
           '/assets/scripts/lib/jquery.tagsphere.min.js' ]
      },
      { target: '/assets/styles/jqueryplugin.min.css',
        assets: [ '/hehe' ] }
    ]);

    builder.scanDir(path.join(__dirname, "views")).should.eql([
      { target: '/assets/styles/common.min.css',
        assets: [
          '/assets/styles/reset.css',
          '/assets/styles/common.css',
          '/assets/styles/site_nav.css',
          '/assets/styles/color.css',
          '/assets//styles/jquery.autocomplete.css'
        ]
      },
      { target: '/assets/styles/hoho.min.css',
        assets:
         [ '/assets/styles/reset.css',
           '/assets/styles/common.css',
           '/assets/styles/site_nav.css',
           '/assets/styles/color.css',
           '/assets//styles/jquery.autocomplete.css' ]
      }
    ]);
  });

  it('scanView with empty list', function () {
    var str = '{%- Loader("/assets/styles/common.min.css", "/assets/js/js.min.js")\n' +
      '  .css("/assets/styles/reset.css")\n' +
      '  .css("/assets/styles/common.css")\n' +
      '  .css("/assets/styles/site_nav.css")\n' +
      '  .css("/assets/styles/color.css")\n' +
      '  .css("/assets//styles/jquery.autocomplete.css")\n' +
      '  .done()\n' +
      '%}';

    builder.scan(str).should.eql([
      {
        target: '/assets/styles/common.min.css',
        assets:
         [ '/assets/styles/reset.css',
           '/assets/styles/common.css',
           '/assets/styles/site_nav.css',
           '/assets/styles/color.css',
           '/assets//styles/jquery.autocomplete.css' ]
      }
    ]);
  });

  it('scanView with mutiple files in one line', function () {
    var str = '{%- Loader("/assets/styles/common.min.css", "/assets/js/js.min.js")' +
      '.css("/assets/styles/reset.css")' +
      '.css("/assets/styles/common.css")' +
      '.css("/assets/styles/site_nav.css")' +
      '.css("/assets/styles/color.css")' +
      '.css("/assets//styles/jquery.autocomplete.css")' +
      '.done()' +
      '%}';

    builder.scan(str).should.eql([
      {
        target: '/assets/styles/common.min.css',
        assets:
         [ '/assets/styles/reset.css',
           '/assets/styles/common.css',
           '/assets/styles/site_nav.css',
           '/assets/styles/color.css',
           '/assets//styles/jquery.autocomplete.css' ]
      }
    ]);
  });

  it("minify should work well", function () {
    var arr = [
      {"target": "/assets/min.js", "assets": ["/assets/hehe.js", "/assets/ganma.js"]},
      {"target": "/assets/min.css", "assets": ["/assets/hehe.css", "/assets/ganma.css", "/assets/home.less"]}
    ];
    var minified = builder.minify(__dirname, arr);
    minified.should.eql([
      { target: '/assets/min.js',
        assets: [ '/assets/hehe.js', '/assets/ganma.js' ],
        min: '/assets/min.99d5311f.min.js',
        debug: '/assets/min.99d5311f.debug.js'
      },
      { target: '/assets/min.css',
        assets: [ '/assets/hehe.css', '/assets/ganma.css', '/assets/home.less' ],
        min: '/assets/min.0d525130.min.css',
        debug: '/assets/min.0d525130.debug.css'
      }
    ]);

    var map = builder.map(minified);
    var minJS = path.join(__dirname, map["/assets/min.js"]);
    var minCSS = path.join(__dirname, map["/assets/min.css"]);

    fs.readFileSync(minJS, 'utf-8').should.equal('!function(){console.log("Hello World!")}();\n!function(){console.log("Hello World!")}();\n');
    fs.readFileSync(minCSS, 'utf-8').should.equal(".foo{float:left}\n.bar{float:left}\n.class{width:2}\n");
  });

  it("minify should work well with coffee", function () {
    var arr = [
      {"target": "/assets/coffee.js", "assets": ["/assets/js.coffee"]}
    ];
    var minified = builder.minify(__dirname, arr);
    minified.should.eql([
      { target: '/assets/coffee.js',
        assets: [ '/assets/js.coffee'],
        min: '/assets/coffee.b8b735e8.min.js',
        debug: '/assets/coffee.b8b735e8.debug.js'
      }
    ]);

    var map = builder.map(minified);
    var minJS = path.join(__dirname, map["/assets/coffee.js"]);

    fs.readFileSync(minJS, 'utf-8').should.equal('(function(){var n;n=function(n){return n*n}}).call(this);\n');
  });

  it("minify should work well with coffee", function () {
    var arr = [
      {"target": "/assets/coffee.js", "assets": ["/assets/js.coffee"]}
    ];
    var minified = builder.minify(__dirname, arr);
    minified.should.eql([
      { target: '/assets/coffee.js',
        assets: [ '/assets/js.coffee'],
        min: '/assets/coffee.b8b735e8.min.js',
        debug: '/assets/coffee.b8b735e8.debug.js'
      }
    ]);

    var map = builder.map(minified);
    var minJS = path.join(__dirname, map["/assets/coffee.js"]);

    fs.readFileSync(minJS, 'utf-8').should.equal('(function(){var n;n=function(n){return n*n}}).call(this);\n');
  });

  it("minify should work well with stylus", function () {
    var arr = [
      {"target": "/assets/home.css", "assets": ["/assets/home.styl"]}
    ];
    var minified = builder.minify(__dirname, arr);
    minified.should.eql([
      { target: '/assets/home.css',
        assets: [ '/assets/home.styl'],
        min: '/assets/home.cb2d2217.min.css',
        debug: '/assets/home.cb2d2217.debug.css'
      }
    ]);

    var map = builder.map(minified);
    var minJS = path.join(__dirname, map["/assets/home.css"]);

    fs.readFileSync(minJS, 'utf-8').should.equal('.class{width:2}\n');
  });

  it("minify should work with exception", function () {
    var arr = [
      {"target": "/assets/sorry.js", "assets": ["/assets/invalid.js"]},
    ];
    (function () {
      builder.minify(__dirname, arr);
    }).should.throw('Compress /assets/invalid.js has error:\nUnexpected token: operator (<)');
  });
});
