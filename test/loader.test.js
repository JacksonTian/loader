var Loader = require('../');
var should = require('should');
var path = require('path');
var fs = require('fs');

// console.log(Loader.minify(path.join(__dirname, "../"), Loader.scanDir(path.join(__dirname, "../views"))));
describe("Asset loader", function () {
  it("Constructor", function () {
    var loader = new Loader("/assets/scripts/jqueryplugin.min.js");
    loader.script.should.have.property("min", "/assets/scripts/jqueryplugin.min.js");
    loader = new Loader("/assets/scripts/jqueryplugin.min.css");
    loader.style.should.have.property("min", "/assets/scripts/jqueryplugin.min.css");
    loader = Loader("/assets/scripts/jqueryplugin.min.js", "/assets/scripts/jqueryplugin.min.css");
    loader.script.should.have.property("min", "/assets/scripts/jqueryplugin.min.js");
    loader.style.should.have.property("min", "/assets/scripts/jqueryplugin.min.css");
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
      '/assets/scripts/jqueryplugin.min.css': 'http://a.bcdn.com/jqueryplugin.min.hash.css',
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
        min: '/assets/scripts/index.min.js',
        assets: [ '/assets/scripts/index.js' ]
      },
      {
        min: '/assets/scripts/jqueryplugin.min.js',
        assets: [ '/assets/scripts/lib/jquery.jmodal.js',
           '/assets/scripts/lib/jquery.mousewheel.min.js',
           '/assets/scripts/lib/jquery.tagsphere.min.js' ]
      },
      { min: '/assets/styles/jqueryplugin.min.css',
        assets: [ '/hehe' ] }
    ]);

    Loader.scanDir(path.join(__dirname, "views")).should.eql([
      { min: '/assets/styles/common.min.css',
        assets:
         [ '/assets/styles/reset.css',
           '/assets/styles/common.css',
           '/assets/styles/site_nav.css',
           '/assets/styles/color.css',
           '/assets//styles/jquery.autocomplete.css' ]
      },
      { min: '/assets/styles/hoho.min.css',
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

  it("minify should work well", function () {
    var arr = [
      {"min": "/assets/min.js", "assets": ["/assets/hehe.js", "/assets/ganma.js"]},
      {"min": "/assets/min.css", "assets": ["/assets/hehe.css", "/assets/ganma.css"]}
    ];
    var minified = Loader.minify(__dirname, arr);
    minified.should.eql([
      { min: '/assets/min.js',
        assets: [ '/assets/hehe.js', '/assets/ganma.js' ],
        hash: '/assets/min.9b080a0d.js' },
      { min: '/assets/min.css',
        assets: [ '/assets/hehe.css', '/assets/ganma.css' ],
        hash: '/assets/min.bd86c426.css' }
    ]);

    var map = Loader.map(minified);
    var minJS = path.join(__dirname, map["/assets/min.js"]);
    var minCSS = path.join(__dirname, map["/assets/min.css"]);

    fs.readFileSync(minJS, 'utf-8').should.equal('!function(){console.log("Hello World!")}(),function(){console.log("Hello World!")}();');
    fs.readFileSync(minCSS, 'utf-8').should.equal(".bar,.foo{float:left}");
  });

  it("minify should work well with justCombo", function () {
    var arr = [
      {"min": "/assets/min.js", "assets": ["/assets/hehe.js", "/assets/ganma.js"]},
      {"min": "/assets/min.css", "assets": ["/assets/hehe.css", "/assets/ganma.css"]}
    ];
    var minified = Loader.minify(__dirname, arr, true);
    minified.should.eql([
      { min: '/assets/min.js',
        assets: [ '/assets/hehe.js', '/assets/ganma.js' ],
        hash: '/assets/min.b7573b7a.js' },
      { min: '/assets/min.css',
        assets: [ '/assets/hehe.css', '/assets/ganma.css' ],
        hash: '/assets/min.b7a2275c.css' }
    ]);

    var map = Loader.map(minified);
    var minJS = path.join(__dirname, map["/assets/min.js"]);
    var minCSS = path.join(__dirname, map["/assets/min.css"]);

    fs.readFileSync(minJS, 'utf-8').should.equal("(function (a, b, c, d) {\n  console.log('Hello World!');\n}());\n\n(function (a, b, c, d) {\n  console.log('Hello World!');\n}());\n\n");
    var css = fs.readFileSync(minCSS, 'utf-8');
    css.should.include('.bar {');
    css.should.include('.foo {');
  });
});
