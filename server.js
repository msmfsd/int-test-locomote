/* eslint-disable no-console */
var express             = require('express')
var favicon             = require('serve-favicon')
var bodyParser          = require('body-parser')
var log                 = require('logging')
var logger              = require('logger-request')
var path                = require('path')
var axios               = require('axios')
var app                 = express()
var API_URL             = 'http://node.locomote.com/code-task'

/**
 * Settings
 */
app.set('port', 3000)
if(process.env.NODE_ENV === 'production') app.disable('x-powered-by')

/**
 * Middleware
 */
app.use(logger({ filename: './logs/server.log' }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(favicon(__dirname + '/favicon.ico'))
app.use('/public', express.static(path.join(__dirname, 'public')));

/**
 * Frontend
 */
app.get('/', function(req, res) { res.sendFile(__dirname + '/index.html') })

/**
 * API Routes
 */
app.get('/api/airlines', function(req, res) {
  // call external api
  axios.get(API_URL + '/airlines')
     .then(function(response) { res.send({ success: true, data: response.data })
     }).catch((reason) => { res.status(500).send({ success: false, message: reason.message }) })
})

app.get('/api/airports', function(req, res) {
  // query values
  var query = req.query.q.toString()
  // validation
  if(!query || query === '') {
    res.status(403).send({ success: false, message: 'Validation error, query not defined' })
  }
  // call external api
  axios.get(API_URL + '/airports?q=' + query)
     .then(function(response) { res.send({ success: true, data: response.data })
     }).catch((reason) => { res.status(500).send({ success: false, message: reason.message }) })
})

app.get('/api/search/:airline_code', function(req, res) {
  // query values
  var date = req.query.date.toString()
  var from = req.query.from.toString()
  var to = req.query.to.toString()
  var airline_code = req.params.airline_code.toString()
  // validation
  if(!date || date === '' || !from || from === '' || !to || to === '') {
    res.status(403).send({ success: false, message: 'Validation error, please complete all fields' })
  }
  // construct url query
  var query = airline_code + '?date=' + date + '&from=' + from + '&to=' + to
  // call external api
  axios.get(API_URL + '/flight_search/' + query)
      .then(function(response) { res.send({ success: true, data: response.data })
      }).catch((reason) => { res.status(500).send({ success: false, message: reason.message }) })
})

/**
 * Route not found
 */
app.use(function(req, res, next) {
 var err = new Error('Not Found')
 err.status = 404
 next(err)
})

/**
 * Error Handler
 */
app.use(function (err, req, res) {
  if (process.env.NODE_ENV === 'development') { log(err.status) }
  else { delete err.stack }
  var status = err.status || 500
  res.status(status).send({ success: false, message: err })
})

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'))
})

module.exports = app
