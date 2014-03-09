var Loader = require('../');
var request = require('supertest');
var connect = require('connect');
var app = connect();
app.use(connect.query());
app.use(Loader.less(__dirname));

describe('Loader.less', function () {
  it('should 200', function (done) {
    request(app)
    .get('/assets/home.less')
    .expect(200)
    .expect('.class {\n  width: 2;\n}\n', done);
  });

  it('should 404', function (done) {
    request(app)
    .post('/assets/home.less')
    .expect(404, done);
  });

  it('should 404 with css', function (done) {
    request(app)
    .get('/assets/home.css')
    .expect(404, done);
  });

  it('should 404 with less', function (done) {
    request(app)
    .get('/assets/inexsit.less')
    .expect(404, done);
  });

  it('should 404 with head & less', function (done) {
    request(app)
    .head('/assets/inexsit.less')
    .expect(404, done);
  });

  it('should 500 with invalid less', function (done) {
    request(app)
    .head('/assets/invalid.less')
    .expect(500, done);
  });
});

