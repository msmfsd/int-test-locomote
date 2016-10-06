import 'whatwg-fetch'
import moment from 'moment'

// API server
const API_URL = 'http://localhost:3000/api'
const opts = { method: 'get', headers: { 'Content-type': 'application/json' } }

/**
* @class Api
*/
export default class Api {

  /**
   * Get flights
   * @param {object} entries
   * @return {array}
   */
  static async GetFlights (entries) {

    // format date
    let date = moment(new Date(entries.date_range)).format('YYYY-MM-DD')

    // get from airport code
    const p1 = await fetch(API_URL + '/airports/?q=' + entries.flight_takeoff, opts)
    const fromAirports = await p1.json()
    if(fromAirports.data.length < 1) {
      throw new Error('Airport not found for: ' + entries.flight_takeoff)
      return false
    }
    const fromAirportCode = fromAirports.data[0].airportCode

    // get to airport code
    const p2 = await fetch(API_URL + '/airports/?q=' + entries.flight_land, opts)
    const toAirports = await p2.json()
    if(toAirports.data.length < 1) {
      throw new Error('Airport not found for: ' + entries.flight_land)
      return false
    }
    const toAirportCode = toAirports.data[0].airportCode

    // get airlines
    const p3 = await fetch(API_URL + '/airlines', opts)
    const airlines = await p3.json()

    // search results from all airlines
    let promises = airlines.data.map((obj) => {
      let q = obj.code + '?date=' + date + '&from=' + fromAirportCode + '&to=' + toAirportCode
      return fetch(API_URL + '/search/' + q, opts)
    })
    let results = await Promise.all(promises)
    // resturn result
    return results

  }

}
