var dev = require('../lib/connect');
var request = require('supertest');
var connect = require('connect');
var app = connect();
app.use(connect.query());
app.use(dev.coffee(__dirname));

describe('Loader.coffee', function () {
  it('should 200', function (done) {
    request(app)
    .get('/assets/home.coffee')
    .expect(200)
    .expect('(function() {\n  var foo;\n\n  foo = 1;\n\n}).call(this);\n', done);
  });

  it('should 404', function (done) {
    request(app)
    .post('/assets/home.js')
    .expect(404, done);
  });

  it('should 404 with js', function (done) {
    request(app)
    .get('/assets/home.js')
    .expect(404, done);
  });

  it('should 404 with coffee', function (done) {
    request(app)
    .get('/assets/inexsit.coffee')
    .expect(404, done);
  });

  it('should 404 with head & coffee', function (done) {
    request(app)
    .head('/assets/inexsit.coffee')
    .expect(404, done);
  });

  it('should 500 with invalid coffee', function (done) {
    request(app)
    .head('/assets/invalid.coffee')
    .expect(500, done);
  });
});

