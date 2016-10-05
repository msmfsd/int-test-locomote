import Api from './Api'
import moment from 'moment'
import _ from 'lodash'

/**
* @class FlightForm
*/
export default class FlightForm {

  constructor () {

    // ensure all CDN libs are defined
    if(typeof $ === 'undefined' || typeof Materialize === 'undefined') {
      // TODO: load local libs
      console.log('Error: CDN lib/s not loaded')
      throw new Error('CDN lib/s not loaded')
    } else {
      // vars
      this.resultsLength = null
      this.renderCount = null
      this.flightForm = document.getElementById('flight-form')
      this.formSubmitBtn = document.getElementById('form-submit-btn')
      this.preloader = document.getElementById('preloader')
      this.flightTakeoffInput = document.getElementById('flight_takeoff')
      this.flightLandInput = document.getElementById('flight_land')
      this.dateRangeInput = document.getElementById('date_range')
      this.statusMessage = document.getElementById('status')
      this.resultDiv = document.getElementById('result')
      this.flights = document.getElementById('flights')
      // Materialize components init
      $('.datepicker').pickadate({ selectMonths: true, selectYears: 15 })
      // init
      this.init()
    }

  }

  init () {
    // form submit
    this.flightForm.addEventListener('submit', (event) => {
      event.preventDefault()
      this.submitForm()
    }, false)
    this.formSubmitBtn.addEventListener('click', (event) => {
      event.preventDefault()
      this.submitForm()
    })
  }

  submitForm () {
    // update display
    this.formSubmitBtn.disabled = true
    this.preloader.classList.remove('hide')
    // reset
    this.statusMessage.textContent = ''
    this.resultDiv.classList.add('hide')
    // validate
    const date = moment(new Date(this.dateRangeInput.value))
    const now = moment()
    if (
      date.isBefore(now) ||
      this.flightTakeoffInput.value === '' ||
      this.flightLandInput.value === '' ||
      this.dateRangeInput.value === ''
    ) {
      this.statusMessage.textContent = 'Please complete all fields correctly. Dates must be today onwards.'
      this.preloader.classList.add('hide')
      this.formSubmitBtn.disabled = false
      return false
    }


    // form data
    let formData = new FormData(this.flightForm)
    const entries = {}
    for (var [key, value] of formData.entries()) { entries[key] = value }

    // call API
    Api.GetFlights(entries)
          .then(responses => {
            // reset render
            $('#flights').empty()
            $('#tabs-content').empty()
            this.resultsLength = responses.length
            this.renderCount = 0
            // responses is a Promise.all array of objects arrays,
            // resolve all response objects data and call render on each
            // NOTE: async so render order may not be sequential
            for(let i = 0; i < responses.length; i++) {
              if(!responses[i].ok) {
                this.preloader.classList.add('hide')
                this.statusMessage.textContent = '500 Internal Server Error: no results returned'
                this.formSubmitBtn.disabled = false
                return false
              }
              let p = responses[i].json()
              p.then(response => { this.render(response.data) })
            }
          })
          .catch((reason) => {
            this.preloader.classList.add('hide')
            this.statusMessage.textContent = 'Server Error: ' + reason.message
            this.formSubmitBtn.disabled = false
          })
  }

  render (data) {

    const flights = data.map((obj) => {
      let start = moment(new Date(obj.start.dateTime)).format('MMMM Do YYYY, h:mm:ss a')
      let finish = moment(new Date(obj.finish.dateTime)).format('MMMM Do YYYY, h:mm:ss a')
      let entry = '<li><div class="card horizontal hoverable">'
      entry += '<div class="card-content">'
      entry += '<h5 class="teal-text text-darken-2">' + obj.airline.code + obj.flightNum + '</h5>'
      entry += '<p>'
      entry += 'From: <b>' + obj.start.cityName + '</b><br /><span class="teal-text text-darken-2">' + start + '</span><br />'
      entry += 'To: <b>' + obj.finish.cityName + '</b><br /><span class="teal-text text-darken-2">' + finish + '</span><br />'
      entry += 'Price: <b>&#36;' + obj.price + '</b>'
      entry += '</p>'
      entry += '</div>'
      entry += '<div class="card-action"><a href="#" class="waves-effect waves-light btn"><i class="material-icons left">flight</i>Make Booking</a></div>'
      entry += '</div></li>'
      return { price: obj.price, entry: entry, title: obj.airline.name, id: obj.airline.code }
    }).sort((a, b) => { return parseFloat(a.price) - parseFloat(b.price) })

    // tab heading
    let activeClass = this.renderCount === 0 ? 'active' : ''
    $('#flights').append('<li class="tab col s3"><a class="' + activeClass + '" href="#' + flights[0].id + '">' + flights[0].title + '</a></li>')
    // tab content
    const content = flights.map(obj => obj.entry).join('')
    $('#tabs-content').append('<ul id="' + flights[0].id + '" class="entries">' + content + '</ul>')

    // update display on final render
    if(this.renderCount === this.resultsLength-1) {
      setTimeout(() => { $('ul.tabs').tabs() }, 100)
      this.preloader.classList.add('hide')
      this.resultDiv.classList.remove('hide')
      this.formSubmitBtn.disabled = false
    } else {
      this.renderCount++
    }

  }

}
