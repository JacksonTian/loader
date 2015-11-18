var Loader = require('../');
var should = require('should');

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

  it("prefix", function () {
    var loader = Loader("/assets/scripts/jqueryplugin.min.js", "/assets/scripts/jqueryplugin.min.css");
    loader.js("/hehe");
    loader.script.assets.should.eql(['/hehe']);
    loader.js("/heihei");
    loader.script.assets.should.eql(['/hehe', '/heihei']);
    loader.css("/hehe.css");
    loader.style.assets.should.eql(['/hehe.css']);
    var output = loader.done({}, '/prefix');
    output.should.match(/<script src="\/prefix\/hehe\?v=\d{13}"><\/script>/);
    output.should.match(/<script src="\/prefix\/heihei\?v=\d{13}"><\/script>/);
    output.should.match(/<link rel="stylesheet" href="\/prefix\/hehe.css\?v=\d{13}" media="all" \/>/);
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

  it("prefix with tail slash", function () {
    var loader = Loader("/assets/scripts/jqueryplugin.min.js", "/assets/scripts/jqueryplugin.min.css");
    loader.js("/hehe");
    loader.script.assets.should.eql(['/hehe']);
    loader.js("/heihei");
    loader.script.assets.should.eql(['/hehe', '/heihei']);
    loader.css("/hehe.css");
    loader.style.assets.should.eql(['/hehe.css']);
    var output = loader.done({}, '/prefix/'); // this line is diff from above case
    output.should.match(/<script src="\/prefix\/hehe\?v=\d{13}"><\/script>/);
    output.should.match(/<script src="\/prefix\/heihei\?v=\d{13}"><\/script>/);
    output.should.match(/<link rel="stylesheet" href="\/prefix\/hehe.css\?v=\d{13}" media="all" \/>/);
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

  describe('#done', function () {
    it("should work with normal use", function () {
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

    it('should work with global prefix', function () {
      Loader.prefix = 'http://gogogo.qiniu.com';
      var loader = Loader("/assets/scripts/jqueryplugin.min.js", "/assets/scripts/jqueryplugin.min.css");

      loader.js("/hehe");
      loader.js("/heihei");
      loader.css("/hehe.css");

      var output = loader.done();
      output.should.match(/<script src="http:\/\/gogogo\.qiniu\.com\/hehe\?v=\d{13}"><\/script>/);
      output.should.match(/<script src="http:\/\/gogogo\.qiniu\.com\/heihei\?v=\d{13}"><\/script>/);
      output.should.match(/<link rel="stylesheet" href="http:\/\/gogogo\.qiniu\.com\/hehe.css\?v=\d{13}" media="all" \/>/);
      var map = {
        '/assets/scripts/jqueryplugin.min.js': '/assets/scripts/jqueryplugin.min.js?v=version',
        '/assets/scripts/jqueryplugin.min.css': '/assets/scripts/jqueryplugin.min.css?v=version'
      };
      loader.done(map, '', true).should.equal('<script src="/assets/scripts/jqueryplugin.min.js?v=version"></script>\n' +
        '<link rel="stylesheet" href="/assets/scripts/jqueryplugin.min.css?v=version" media="all" />\n');
      delete Loader.prefix;
    });

    it('should work with global mini', function () {
      Loader.mini = true;
      var loader = Loader("/assets/scripts/jqueryplugin.min.js", "/assets/scripts/jqueryplugin.min.css");

      var map = {
        '/assets/scripts/jqueryplugin.min.js': '/assets/scripts/jqueryplugin.min.js?v=version',
        '/assets/scripts/jqueryplugin.min.css': '/assets/scripts/jqueryplugin.min.css?v=version'
      };
      // test this.isMinify
      loader.done(map).should.equal('<script src="/assets/scripts/jqueryplugin.min.js?v=version"></script>\n' +
        '<link rel="stylesheet" href="/assets/scripts/jqueryplugin.min.css?v=version" media="all" />\n');
      delete Loader.mini;
    });

    it('should work with instance mini', function () {
      var loader = Loader("/assets/scripts/jqueryplugin.min.js", "/assets/scripts/jqueryplugin.min.css");
      loader.mini = true;
      var map = {
        '/assets/scripts/jqueryplugin.min.js': '/assets/scripts/jqueryplugin.min.js?v=version',
        '/assets/scripts/jqueryplugin.min.css': '/assets/scripts/jqueryplugin.min.css?v=version'
      };
      // test this.isMinify
      loader.done(map).should.equal('<script src="/assets/scripts/jqueryplugin.min.js?v=version"></script>\n' +
        '<link rel="stylesheet" href="/assets/scripts/jqueryplugin.min.css?v=version" media="all" />\n');
      // delete Loader.mini;
    });
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

  it("Loader.img", function () {
    var url = Loader.img("/assets/images/logo.png", "");
    url.should.equal('/assets/images/logo.png');
  });

  it("Loader.img with map", function () {
    var map = {
      "/assets/images/logo.png": "/assets/images/logo.hash.png"
    };
    var url = Loader.img("/assets/images/logo.png", "", map, true);
    url.should.equal('/assets/images/logo.hash.png');
  });
});
