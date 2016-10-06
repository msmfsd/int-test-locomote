var assert              = require('chai').assert
var request             = require('supertest')
var moment              = require('moment')
var server              = require('../server.js')

describe('GET /api/airlines', function() {
  it('should return success true and 200 OK', function(done) {
    request(server)
      .get('/api/airlines')
      .expect(function(res){ res.body.success = true; })
      .expect(200, done)
  })
})


describe('GET /api/airports', function() {
  it('should return success true and 200 OK', function(done) {
    request(server)
      .get('/api/airports/?q=Melbourne')
      .expect(function(res){ res.body.success = true; })
      .expect(200, done)
  })
})

describe('GET /api/search', function() {
  var date = moment(new Date('15 March, 2017')).format('YYYY-MM-DD')
  var query = '?date=' + date + '&from=MEL&to=SYD'
  it('should return success true and 200 OK', function(done) {
    request(server)
      .get('/api/search/QF/' + query)
      .expect(function(res){ res.body.success = true; })
      .expect(200, done)
  })
})
