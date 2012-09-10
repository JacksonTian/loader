var Loader = require('../lib/loader');
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

  it("js/css", function (){
    var loader = Loader("/assets/scripts/jqueryplugin.min.js", "/assets/scripts/jqueryplugin.min.css");
    loader.js("/hehe");
    loader.script.assets.should.eql(['/hehe']);
    loader.js("/heihei");
    loader.script.assets.should.eql(['/hehe', '/heihei']);
    loader.css("/hehe.css");
    loader.style.assets.should.eql(['/hehe.css']);
    loader.done().should.equal('<script src="/hehe"></script>\n' +
      '<script src="/heihei"></script>\n' +
      '<link rel="stylesheet" href="/hehe.css" media="all" />\n');
    var nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production'
    loader.done("version").should.equal('<script src="/assets/scripts/jqueryplugin.min.js?v=version"></script>\n' +
      '<link rel="stylesheet" href="/assets/scripts/jqueryplugin.min.css?v=version" media="all" />\n');
    process.env.NODE_ENV = nodeEnv;
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
    loader.done("version", {'/assets/scripts/jqueryplugin.min.js': 'http://a.bcdn.com/jqueryplugin.min.js'}).should.equal('<script src="http://a.bcdn.com/jqueryplugin.min.js"></script>\n' +
      '<link rel="stylesheet" href="/assets/scripts/jqueryplugin.min.css?v=version" media="all" />\n');
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
    //'  .async("/woca")' +
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
           '/assets/scripts/lib/jquery.tagsphere.min.js' ] },
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
      }]);
  });

  it("uglify/CSS should work well", function () {
    Loader.transformScript("(function (a, b, c, d) {}());").should.equal("(function(e,t,n,r){})()");
    Loader.transformStyle(".foo {  float: left;}").should.equal(".foo{float:left}");
  });

  it("minify should work well", function () {
    var arr = [{"min": "min.js", "assets": ["hehe.js", "ganma.js"]}, {"min": "min.css", "assets": ["hehe.css", "ganma.css"]}];
    var minJS = path.join(__dirname, "assets/min.js");
    var minCSS = path.join(__dirname, "assets/min.css");
    var existsSync = fs.existsSync || path.existsSync;
    if (existsSync(minJS)) {
      fs.unlinkSync(minJS);
    }
    existsSync(minJS).should.be.false;
    if (existsSync(minCSS)) {
      fs.unlinkSync(minCSS);
    }
    existsSync(minCSS).should.be.false;

    Loader.minify(path.join(__dirname, "assets"), arr);
    fs.readFileSync(minJS, 'utf-8').should.equal("(function(e,t,n,r){})(),function(e,t,n,r){}()");
    fs.readFileSync(minCSS, 'utf-8').should.equal(".foo{float:left}.bar{float:left}");
  });

});

