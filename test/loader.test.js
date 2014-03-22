var Loader = require('../');
var should = require('should');
var path = require('path');
var fs = require('fs');

// console.log(Loader.minify(path.join(__dirname, "../"), Loader.scanDir(path.join(__dirname, "../views"))));
describe("Asset loader", function () {
  it("Constructor", function () {
    var loader = new Loader("/assets/scripts/jqueryplugin.min.js");
    loader.script.should.have.property("target", "/assets/scripts/jqueryplugin.min.js");
    loader = new Loader("/assets/scripts/jqueryplugin.min.css");
    loader.style.should.have.property("target", "/assets/scripts/jqueryplugin.min.css");
    loader = Loader("/assets/scripts/jqueryplugin.min.js", "/assets/scripts/jqueryplugin.min.css");
    loader.script.should.have.property("target", "/assets/scripts/jqueryplugin.min.js");
    loader.style.should.have.property("target", "/assets/scripts/jqueryplugin.min.css");
  });

  it("js/css", function () {
    var loader = Loader("/assets/scripts/jqueryplugin.min.js", "/assets/scripts/jqueryplugin.min.css");
    loader.js("/hehe");
    loader.script.assets.should.eql(['/hehe']);
    loader.js("/heihei");
    loader.script.assets.should.eql(['/hehe', '/heihei']);
    loader.css("/hehe.css");
    loader.style.assets.should.eql(['/hehe.css']);
    var output = loader.done();
    output.should.match(/<script src="\/hehe\?v=\d{13}"><\/script>/);
    output.should.match(/<script src="\/heihei\?v=\d{13}"><\/script>/);
    output.should.match(/<link rel="stylesheet" href="\/hehe.css\?v=\d{13}" media="all" \/>/);
    var nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    var map = {
      '/assets/scripts/jqueryplugin.min.js': '/assets/scripts/jqueryplugin.min.js?v=version',
      '/assets/scripts/jqueryplugin.min.css': '/assets/scripts/jqueryplugin.min.css?v=version'
    };
    loader.done(map).should.equal('<script src="/assets/scripts/jqueryplugin.min.js?v=version"></script>\n' +
      '<link rel="stylesheet" href="/assets/scripts/jqueryplugin.min.css?v=version" media="all" />\n');
    process.env.NODE_ENV = nodeEnv;
  });

  it('less', function () {
    var loader = Loader("/assets/style/jqueryplugin.min.css");
    loader.css("/hehe.less");
    loader.style.assets.should.eql(['/hehe.less']);
    var output = loader.done();
    output.should.match(/<link rel="stylesheet" href="\/hehe.less\?v=\d{13}" media="all" \/>/);
    var nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    var map = {
      '/assets/style/jqueryplugin.min.css': '/assets/scripts/jqueryplugin.min.css?v=version'
    };
    loader.done(map).should.equal('<link rel="stylesheet" href="/assets/scripts/jqueryplugin.min.css?v=version" media="all" />\n');
    process.env.NODE_ENV = nodeEnv;
  });

  it("done", function () {
    var loader = Loader("/assets/scripts/jqueryplugin.min.js", "/assets/scripts/jqueryplugin.min.css");
    loader.js("/hehe");
    loader.script.assets.should.eql(['/hehe']);
    loader.js("/heihei");
    loader.script.assets.should.eql(['/hehe', '/heihei']);
    loader.css("/hehe.css");
    loader.style.assets.should.eql(['/hehe.css']);
    var output = loader.done(undefined, '', false);
    output.should.match(/<script src="\/hehe\?v=\d{13}"><\/script>/);
    output.should.match(/<script src="\/heihei\?v=\d{13}"><\/script>/);
    output.should.match(/<link rel="stylesheet" href="\/hehe.css\?v=\d{13}" media="all" \/>/);
    var map = {
      '/assets/scripts/jqueryplugin.min.js': '/assets/scripts/jqueryplugin.min.js?v=version',
      '/assets/scripts/jqueryplugin.min.css': '/assets/scripts/jqueryplugin.min.css?v=version'
    };
    loader.done(map, '', true).should.equal('<script src="/assets/scripts/jqueryplugin.min.js?v=version"></script>\n' +
      '<link rel="stylesheet" href="/assets/scripts/jqueryplugin.min.css?v=version" media="all" />\n');
  });

  it("CDNMap", function () {
    var loader = Loader("/assets/scripts/jqueryplugin.min.js", "/assets/scripts/jqueryplugin.min.css");
    loader.js("/hehe");
    loader.script.assets.should.eql(['/hehe']);
    loader.js("/heihei");
    loader.script.assets.should.eql(['/hehe', '/heihei']);
    loader.css("/hehe.css");
    loader.style.assets.should.eql(['/hehe.css']);
    var nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    var map = {
      '/assets/scripts/jqueryplugin.min.js': 'http://a.bcdn.com/jqueryplugin.min.hash.js',
      '/assets/scripts/jqueryplugin.min.css': 'http://a.bcdn.com/jqueryplugin.min.hash.css'
    };
    var output = loader.done(map);
    output.should.equal('<script src="http://a.bcdn.com/jqueryplugin.min.hash.js"></script>\n' +
      '<link rel="stylesheet" href="http://a.bcdn.com/jqueryplugin.min.hash.css" media="all" />\n');
    process.env.NODE_ENV = nodeEnv;
  });

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

    Loader.scan(str).should.eql([
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

    Loader.scanDir(path.join(__dirname, "views")).should.eql([
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

    Loader.scan(str).should.eql([
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

  it("uglify/CSS should work well", function () {
    Loader.transformScript("(function (a, b, c, d) {console.log('hello world!');}());").should.equal('!function(){console.log("hello world!")}();');
    Loader.transformStyle(".foo {  float: left;}").should.equal(".foo{float:left}");
  });

  it("less should work well", function () {
    Loader.transformLess('.class{width: (1 + 1)}').should.equal('.class {\n  width: 2;\n}\n');
  });

  it("less should work with exception", function () {
    (function () {
      Loader.transformLess('.class{width: (1 +)}');
    }).should.throw("expected ')' got '+'");
  });

  it("stylus should work well", function () {
    Loader.transformStylus('.class{width: (1 + 1)}').should.equal('.class {\n  width: 2;\n}\n');
  });

  it("stylus should work with exception", function () {
    (function () {
      Loader.transformStylus('.class{width: (1 +)}');
    }).should.throw("stylus:1\n > 1| .class{width: (1 +)}\n\nCannot read property 'lineno' of undefined\n    at \".class\" (stylus:294)\n");
  });

  it("coffee should work well", function () {
    Loader.transformCoffee('foo = 1').should.equal('(function() {\n  var foo;\n\n  foo = 1;\n\n}).call(this);\n');
  });

  it("coffee should work with exception", function () {
    (function () {
      Loader.transformCoffee('<foo> = bar');
    }).should.throw("unexpected <");
  });

  it("minify should work well", function () {
    var arr = [
      {"target": "/assets/min.js", "assets": ["/assets/hehe.js", "/assets/ganma.js"]},
      {"target": "/assets/min.css", "assets": ["/assets/hehe.css", "/assets/ganma.css", "/assets/home.less"]}
    ];
    var minified = Loader.minify(__dirname, arr);
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

    var map = Loader.map(minified);
    var minJS = path.join(__dirname, map["/assets/min.js"]);
    var minCSS = path.join(__dirname, map["/assets/min.css"]);

    fs.readFileSync(minJS, 'utf-8').should.equal('!function(){console.log("Hello World!")}();\n!function(){console.log("Hello World!")}();\n');
    fs.readFileSync(minCSS, 'utf-8').should.equal(".foo{float:left}\n.bar{float:left}\n.class{width:2}\n");
  });

  it("minify should work with exception", function () {
    var arr = [
      {"target": "/assets/sorry.js", "assets": ["/assets/invalid.js"]},
    ];
    (function () {
      Loader.minify(__dirname, arr);
    }).should.throw('Compress /assets/invalid.js has error:\nUnexpected token: operator (<)');
  });
});
