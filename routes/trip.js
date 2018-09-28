// Import our server-side renderer that has been compiled by babel
const ssr = require('../src-compiled/server')
// The page template (scaffold the HTML page)
const html = require('../src-compiled/html')
const pgHelper = require('@macrostrat/pg-helper')
const tripSQL = require('./trip_sql')

const moment = require('moment')

const pg = new pgHelper({
  host: 'localhost',
  user: 'john',
  port: 5432,
  database: 'rockd'
})

let initialState = {
  main: {
    isFetching: false,
    trip: {},
    activeStop: [0,0]
  }
}

const ROCKD_API_URL = 'http://localhost:5500/api/v2'

function processCheckin(checkin) {
  checkin.photo_id = (parseInt(checkin.photo) === checkin.photo) ? checkin.photo : 0

  checkin.thumb = `${ROCKD_API_URL}/protected/image/${checkin.person_id}/thumb/${checkin.photo_id}`
  checkin.thumbLarge = `${ROCKD_API_URL}/protected/image/${checkin.person_id}/thumb_large/${checkin.photo_id}`
  checkin.banner = `${ROCKD_API_URL}/protected/image/${checkin.person_id}/banner/${checkin.photo_id}`
  checkin.full = `${ROCKD_API_URL}/protected/image/${checkin.person_id}/full/${checkin.photo_id}`
  // Make the default photo the full photo URL
  checkin.photo = checkin.full

  checkin.created = moment(checkin.created).format('MMMM DD, YYYY').toString()
  checkin.likes = parseInt(checkin.likes) || 0
  checkin.gravatar = `${ROCKD_API_URL}/protected/gravatar/${checkin.person_id}`

  checkin.observations = checkin.observations.filter(d => { if (d) return d })
  // Tally the number of photos this checkin has
  if (checkin.observations) {
    checkin.n_photos = checkin.observations.map(d => {
      if (d.photo) return d.photo
    }).concat([checkin.photo]).filter(d => {
      if (d) return d
    }).length
  } else {
    checkin.n_photos = (checkin.photo) ? 1 : 0
  }

  // Pick a good title to display
  checkin.title = ''
  if (checkin.observations && checkin.observations.length) {
    let stratNames = checkin.observations.filter(d => {
      if (Object.keys(d.rocks).length > 0 && d.rocks.strat_name && Object.keys(d.rocks.strat_name).length > 0) return d
    }).map(d => {
      return d.rocks.strat_name.strat_name_long
    })

    let unitNames = checkin.observations.filter(d => {
      if (Object.keys(d.rocks).length > 0 && d.rocks.map_unit && Object.keys(d.rocks.map_unit).length > 0) return d
    }).map(d => {
      return d.rocks.map_unit.unit_name
    })

    if (stratNames.length > 1) {
      checkin.title = stratNames[0] + '...'
    } else if (stratNames.length === 1) {
      checkin.title = stratNames[0]
    } else if (unitNames.length > 1) {
      checkin.title = unitNames[0] + '...'
    } else if (unitNames.length === 1) {
      checkin.title = unitNames[0]
    }
  }
  if (checkin.title === '') {
    checkin.title = checkin.notes
  }

  if (checkin.observations) {
    checkin.observations = checkin.observations.map(d => { return processObservation(checkin.person_id, d) })
  } else {
    checkin.observations = []
  }

  return checkin
}

function processObservation(person_id, observation) {
  if (observation.rocks.liths) {
    observation.rocks.liths.forEach(l => {
      l.color = this.hexToRgba(l.color)
    })
  }

  if (observation.age_est) {
    observation.age_est.color = this.hexToRgba(observation.age_est.color)
  }

  observation.thumb = `${ROCKD_API_URL}/protected/image/${person_id}/thumb/${observation.photo}`
  observation.thumbLarge = `${ROCKD_API_URL}/protected/image/${person_id}/thumb_large/${observation.photo}`
  observation.banner = `${ROCKD_API_URL}/protected/image/${person_id}/banner/${observation.photo}`
  observation.full = `${ROCKD_API_URL}/protected/image/${person_id}/full/${observation.photo}`

  observation.title = ''
  if (Object.keys(observation.rocks).length > 0 && observation.rocks.strat_name && Object.keys(observation.rocks.strat_name).length) {
    observation.title = observation.rocks.strat_name.strat_name_long
  } else if (Object.keys(observation.rocks).length > 0 && observation.rocks.map_unit && Object.keys(observation.rocks.map_unit).length > 0) {
    observation.title = observation.rocks.map_unit.unit_name
  }

  return observation

}

module.exports = async (req, res, next) => {
  let trip_id = req.params.trip_id || null

  let trips = await pg.query(tripSQL, [ -1, trip_id ])

  if (trips.length) {
    initialState.main.trip = trips[0]
    initialState.main.trip.updated = moment(initialState.main.trip.updated).format('MMMM DD, YYYY').toString()
    initialState.main.trip.stops = trips[0].stops.map(d => {
      d.checkin = processCheckin(d.checkin)
      return d
    })
  }

  const { preloadedState, content, css } = ssr(initialState)
  res.setHeader('Cache-Control', 'assets, max-age=604800')
  res.send(html(`Rockd - ${initialState.main.trip.name}`, preloadedState, content, css))
}
