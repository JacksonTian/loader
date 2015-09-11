var dev = require('../lib/connect');
var request = require('supertest');
var connect = require('connect');
var app = connect();
app.use(connect.query());
app.use(dev.stylus(__dirname));

describe('Loader.stylus', function () {
  it('should 200', function (done) {
    request(app)
    .get('/assets/home.styl')
    .expect(200)
    .expect('.class {\n  width: 2;\n}\n', done);
  });

  it('should 404', function (done) {
    request(app)
    .post('/assets/home.styl')
    .expect(404, done);
  });

  it('should 404 with css', function (done) {
    request(app)
    .get('/assets/home.css')
    .expect(404, done);
  });

  it('should 404 with styl', function (done) {
    request(app)
    .get('/assets/inexsit.styl')
    .expect(404, done);
  });

  it('should 404 with head & styl', function (done) {
    request(app)
    .head('/assets/inexsit.styl')
    .expect(404, done);
  });

  it('should 500 with invalid styl', function (done) {
    request(app)
    .head('/assets/invalid.styl')
    .expect(500, done);
  });
});

