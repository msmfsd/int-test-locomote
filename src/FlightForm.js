import Api from './Api'
import moment from 'moment'
import _ from 'lodash'

/**
* @class FlightForm
*/
export default class FlightForm {

  constructor () {

    // vars
    this.resultsLength = null
    this.renderCount = null
    this.flightForm = document.getElementById('flight-form')
    this.formSubmitBtn = document.getElementById('form-submit-btn')
    this.preloader = document.getElementById('preloader')
    this.flightTakeoffInput = document.getElementById('flight_takeoff')
    this.flightLandInput = document.getElementById('flight_land')
    this.dateRangeInput = document.getElementById('date_range')
    this.dateRangeFor = document.getElementById('date_range_for')
    this.statusMessage = document.getElementById('status')
    this.resultDiv = document.getElementById('result')
    this.flights = document.getElementById('flights')
    this.tabsContent = document.getElementById('tabs-content')
    this.prevBtn = document.getElementById('prev-btn')
    this.nextBtn = document.getElementById('next-btn')
    this.resultsDate = document.getElementById('results-date')

    // init
    this.init()

  }

  /**
   * Init app
   */
  init () {

    // ensure all CDN libs are defined
    if(typeof $ === 'undefined' || typeof Materialize === 'undefined') {
      throw new Error('CDN lib/s not loaded')
    }

    // Materialize datepicker component
    $('.datepicker').pickadate({ selectMonths: true, selectYears: 15 })

    // form submit actions
    this.flightForm.addEventListener('submit', (event) => {
      event.preventDefault()
      this.submitForm()
    }, false)
    this.formSubmitBtn.addEventListener('click', (event) => {
      event.preventDefault()
      this.submitForm()
    })

    // next/prev actions
    this.prevBtn.addEventListener('click', (event) => {
      event.preventDefault()
      this.submitForm('prev')
    }, false)
    this.nextBtn.addEventListener('click', (event) => {
      event.preventDefault()
      this.submitForm('next')
    })

    // inputs
    this.flightTakeoffInput.addEventListener('focus', (event) => {
      this.updateDisplay([this.statusMessage])
    })
    this.flightLandInput.addEventListener('focus', (event) => {
      this.updateDisplay([this.statusMessage])
    })
    this.dateRangeInput.addEventListener('focus', (event) => {
      this.updateDisplay([this.statusMessage])
      // fix date input safari/FF issue
      this.dateRangeFor.classList.add('active')
    })

  }

  /**
   * Form submit
   * @param {string} day = ''
   */
  submitForm (day = '') {

    // if next/prev then modify date range input value
    if (day === 'prev') {
      this.dateRangeInput.value = moment(new Date(this.dateRangeInput.value))
          .add(-1, 'days').format('D MMMM, YYYY')
    }
    if (day === 'next') {
      this.dateRangeInput.value = moment(new Date(this.dateRangeInput.value))
          .add(1, 'days').format('D MMMM, YYYY')
    }

    // manual validate - TODO: automate
    const validateResult = this.validate([
      { value: this.flightTakeoffInput.value, type: 'text', name: 'From location' },
      { value: this.flightLandInput.value, type: 'text', name: 'To location' },
      { value: this.dateRangeInput.value, type: 'text', name: 'Travel date' },
      { value: this.dateRangeInput.value, type: 'date', name: 'Travel date' }
    ])

    // update display
    if(validateResult.length > 0) {
      this.updateDisplay(
        [this.preloader],
        [this.statusMessage],
        [],
        [this.formSubmitBtn],
        validateResult.join(' ')
      )
      return false
    } else {
      this.updateDisplay(
        [this.statusMessage, this.resultDiv],
        [this.preloader],
        [this.formSubmitBtn]
      )
    }

    // entries
    const entries = {}
    const inputs = [].slice.call(this.flightForm.getElementsByTagName('input'))
    inputs.forEach(input => {
      entries[input.name] = input.value
    })

    // get flights
    this.getFlights(entries)

  }

  /**
   * Get flights
   * @param {object} entries
   */
  getFlights (entries) {

    // initiate async fetch
    Api.GetFlights(entries)
          .then(responses => {

            // reset render
            this.resetRender(responses.length)

            // loop all promises and render data
            for(let i = 0; i < responses.length; i++) {
              if(!responses[i].ok) {
                this.updateDisplay(
                  [this.preloader],
                  [this.statusMessage],
                  [],
                  [this.formSubmitBtn],
                  'Server Error: no results returned'
                )
                return false
              }
              let p = responses[i].json()
              p.then(response => { this.render(response.data) })
            }

          })
          .catch((reason) => {
            this.updateDisplay(
              [this.preloader],
              [this.statusMessage],
              [],
              [this.formSubmitBtn],
              'Server Error: ' + reason.message
            )
          })
  }

  /**
   * Render data to html
   * @param {object} data
   */
  render (data) {

    // construct flight items and sort by cheapest
    const flights = data.map((obj) => {

      // vars
      let entry = ''
      let price = obj.price.toFixed(2)
      let heading = moment(new Date(obj.start.dateTime))
          .format('MMMM Do YYYY')
      let start = moment(new Date(obj.start.dateTime))
          .format('MMMM Do YYYY, h:mm:ss a')
      let finish = moment(new Date(obj.finish.dateTime))
          .format('MMMM Do YYYY, h:mm:ss a')

      // html
      entry += '<li><div class="card horizontal hoverable">'
      entry += '<div class="card-content">'
      entry += '<h5 class="teal-text text-darken-2">' +
                obj.airline.code + obj.flightNum + '</h5>'
      entry += '<p>From: <b>' + obj.start.cityName + ', ' + obj.start.countryName +
                '</b><br /><span class="teal-text text-darken-2">' + start +
                '</span><br />'
      entry += 'To: <b>' + obj.finish.cityName + ', ' + obj.finish.countryName +
                '</b><br /><span class="teal-text text-darken-2">' + finish +
                '</span><br />'
      entry += 'Price: <b>&#36;' + price + '</b></p>'
      entry += '</div>'
      entry += '<div class="card-action">'
      entry += '<a href="#" class="waves-effect waves-light btn">'
      entry += '<i class="material-icons">flight</i></a>&nbsp;&nbsp;'
      entry += '<a href="#" class="waves-effect waves-light btn">'
      entry += '<i class="material-icons">share</i></a>'
      entry += '</div></div></li>'

      // save to array
      return {
        price: price,
        entry: entry,
        title: obj.airline.name,
        id: obj.airline.code,
        heading: heading
      }

    }).sort((a, b) => { return parseFloat(a.price) - parseFloat(b.price) })

    // set main results heading to current start date
    this.resultsDate.textContent = flights[0].heading

    // set tab headings - use jQuery for append..
    let activeClass = this.renderCount === 0 ? 'active' : ''
    $('#flights').append(
      '<li class="tab col s3"><a class="' + activeClass + '" href="#' +
      flights[0].id + '">' + flights[0].title + '</a></li>'
    )

    // set tab content - use jQuery for append..
    const content = flights.map(obj => obj.entry).join('')
    $('#tabs-content').append(
      '<ul id="' + flights[0].id + '" class="entries">' + content + '</ul>'
    )

    // update display on final render
    if(this.renderCount === this.resultsLength-1) {
      // Materialize tabs component after render
      setTimeout(() => { $('ul.tabs').tabs() }, 100)
      // show results
      this.updateDisplay(
        [this.preloader],
        [this.resultDiv],
        [],
        [this.formSubmitBtn]
      )
    } else {
      this.renderCount++
    }

  }

  /**
   * Validate form input
   * @param {array} inputs
   * @return {array}
   */
  validate (inputs) {

    // validate
    const validateResult = []
    inputs.map(input => {

      // text
      if(input.type === 'text' && input.value === '') {
        validateResult.push(input.name + ' cannot be empty.')
      }

      // date
      if(input.type === 'date') {
        const date = moment(new Date(input.value))
        const now = moment()
        if(date.endOf('day').isBefore(now)) {
          validateResult.push(input.name + ' cannot be in the past.')
        }
      }

    })

    // result
    return validateResult

  }

  /**
   * Update display
   * @param {array} hide
   * @param {array} show
   * @param {array} disable
   * @param {array} enable
   * @param {string} statusText
   */
  updateDisplay (hide = [], show = [], disable = [], enable = [], statusText = '') {

    // hide?
    hide.map(val => { val.classList.add('hide') })

    // show?
    show.map(val => { val.classList.remove('hide') })

    // disable?
    disable.map(val => { val.disabled = true })

    // enable?
    enable.map(val => { val.disabled = false })

    // update statusMessage
    this.statusMessage.textContent = statusText

  }

  /**
   * Reset render vars and clear rendered html
   * @param {number} responsesLength
   */
  resetRender (responsesLength) {

    // use class count vars as async order may not be sequential
    this.resultsLength = responsesLength
    this.renderCount = 0

    // clear render
    while(this.flights.firstChild) {
      this.flights.removeChild(this.flights.firstChild)
    }
    while(this.tabsContent.firstChild) {
      this.tabsContent.removeChild(this.tabsContent.firstChild)
    }

  }

}
