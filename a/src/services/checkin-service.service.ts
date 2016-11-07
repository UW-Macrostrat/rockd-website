import { Injectable, Inject } from '@angular/core';
import { Http } from '@angular/http';
import { Settings } from './settings.service'

import 'rxjs/add/operator/toPromise';

@Injectable()


export class CheckinService {
  constructor(
    private http: Http) {
  }

  hexToRgba(hex) {
    if (!hex) {
      return hex
    }
    if (hex.indexOf('#') > -1) {
      hex = hex.replace('#', '')
    } else {
      return hex
    }

    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return [r, g, b, 0.5].join(', ')
  }

  getCardinalDirection(heading) {
    // Principle winds + half-winds defintions via https://en.wikipedia.org/wiki/Points_of_the_compass
    // 22.49deg between each step
    switch(true) {
      case (heading >= 348.76 || heading <= 11.25):
        return 'N'
      case heading >= 11.26 && heading <= 33.75:
        return 'NNE'
      case heading >= 33.76 && heading <= 56.25:
        return 'NE'
      case heading >= 56.26 && heading <= 78.75:
        return 'ENE'
      case heading >= 78.76 && heading <= 101.25:
        return 'E'
      case heading >= 101.26 && heading <= 123.75:
        return 'ESE'
      case heading >= 123.76 && heading <= 146.25:
        return 'SE'
      case heading >= 146.26 && heading <= 168.75:
        return 'SSE'
      case heading >= 168.76 && heading <= 191.25:
        return 'S'
      case heading >= 191.26 && heading <= 213.75:
        return 'SSW'
      case heading >= 213.76 && heading <= 236.25:
        return 'SW'
      case heading >= 236.26 && heading <= 258.75:
        return 'WSW'
      case heading >= 258.76 && heading <= 281.25:
        return 'W'
      case heading >= 281.26 && heading <= 303.75:
        return 'WNW'
      case heading >= 303.76 && heading <= 326.25:
        return 'NW'
      case heading >= 326.26 && heading <= 348.75:
        return 'NNW'
      default:
        return 'N/A'
    }
  }

  getMap(callback) {
    this.http.get(Settings.APIURL + '/protected/map-checkins')
      .toPromise()
      .then(response => callback(null, response.json()))
      .catch(error => callback(error, null))
  }

  get(params, user, callback) {
    if (!user) {
      user = {token: null, first_name: '', last_name: '' }
    }

    let url = `${Settings.APIURL}/protected/checkins?`
    if (user.token) {
      url += `token=${user.token}`
    }
    let query = []

    Object.keys(params).forEach(d => {
      query.push(d + '=' + params[d])
    })

    url += query.join('&')

    this.http.get(url)
      .toPromise()
      .then(response => { return response.json() })
      .then(data => {
        if (!data.success || data.success.data.length < 1) {
          return callback(null, [])
        }
        let checkins = data.success.data.map(d => { return this.process(d, user)})
        return callback(null, checkins)
      })
      .catch(error => callback(error))
  }

  ImageURL(person_id, photo_id, type, token) {
    if (!person_id || !photo_id || !type || photo_id === 0 || !Boolean(photo_id)) {
      return ''
    }
    let url = `${Settings.APIURL}/protected/image/${person_id}/${type}/${photo_id}`

    if (token) {
      url += `?token=${token}`
    }
    return url
  }

  process(checkin, user) {
    if (checkin.checkin_id && !isNaN(checkin.checkin_id)) {
      checkin.checkin_id = 'chk|' + checkin.checkin_id
    }
    // If the checkin has an integer photo_id
    if (parseInt(checkin.photo) === checkin.photo) {
      checkin.thumb = this.ImageURL(checkin.person_id, checkin.photo, 'thumb', user.token)
      checkin.banner = this.ImageURL(checkin.person_id, checkin.photo, 'banner', user.token)
      checkin.full = this.ImageURL(checkin.person_id, checkin.photo, 'full', user.token)
      // Make the default photo the full photo URL
      checkin.photo = checkin.full
    }
    // If it has a blob URL or no photo, ignore it

    checkin.photo_id = (parseInt(checkin.photo) === checkin.photo) ? checkin.photo : 0
    checkin.ownedByUser = checkin.person_id == user.person_id ? true : false

    // Mostly for handling unsynced checkins that don't already have this data
    checkin.created = (checkin.created) ? checkin.created : 'Unsynced'
    checkin.first_name = (checkin.first_name) ? checkin.first_name : user.first_name
    checkin.last_name = (checkin.last_name) ? checkin.last_name : user.last_name

    checkin.likes = parseInt(checkin.likes)
    checkin.gravatar = `${Settings.APIURL}/protected/gravatar/${checkin.person_id}`
    if (user.token) {
      checkin.gravatar += `?token=${user.token}`
    }

    // Tally the number of photos this checkin has
    if (checkin.observations) {
      checkin.n_photos = checkin.observations.map(d => {
        if (d.rocks && d.rocks.photo) return d.rocks.photo
      }).concat(checkin.observations.map(d => {
        if (d.fossils && d.fossils.photo) return d.fossils.photo })
      ).concat([checkin.photo]).filter(d => {
        if (d) return d
      }).length
    } else {
      checkin.n_photos = (checkin.photo) ? 1 : 0
    }

    if (checkin.geom) {
      checkin.lat = checkin.geom.coordinates[1]
      checkin.lng = checkin.geom.coordinates[0]
    }

    // Pick a good title to display
    checkin.title = ''
    if (checkin.observations && checkin.observations.length) {
      let stratNames = checkin.observations.filter(d => {
        if (Object.keys(d.rocks).length > 0 && Object.keys(d.rocks.strat_name).length > 0) return d
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
      checkin.observations = checkin.observations.map(d => { return this.processObservation(checkin.person_id, d, user) })
    } else {
      checkin.observations = []
    }

    return checkin
  }

  processObservation(person_id, observation, user) {
    if (observation.obs_id) {
      observation.obs_id = 'obs|' + observation.obs_id
    }

    if (observation.rocks.liths) {
      observation.rocks.liths.forEach(l => {
        l.color = this.hexToRgba(l.color)
      })
    }

    if (Object.keys(observation.rocks).length && parseInt(observation.rocks.photo) === observation.rocks.photo) {
      observation.rocks.thumb = this.ImageURL(person_id, observation.rocks.photo, 'thumb', user.token)
      observation.rocks.banner = this.ImageURL(person_id, observation.rocks.photo, 'banner', user.token)
      observation.rocks.full = this.ImageURL(person_id, observation.rocks.photo, 'full', user.token)
      observation.rocks.photo = observation.rocks.full
    }
    if (Object.keys(observation.fossils).length && parseInt(observation.fossils.photo) === observation.fossils.photo) {
      observation.fossils.thumb = this.ImageURL(person_id, observation.fossils.photo, 'thumb', user.token)
      observation.fossils.banner = this.ImageURL(person_id, observation.fossils.photo, 'banner', user.token)
      observation.fossils.full = this.ImageURL(person_id, observation.fossils.photo, 'full', user.token)
      observation.fossils.photo = observation.fossils.full
    }

    if (Object.keys(observation.orientation).length) {
      if (observation.orientation.strike != null) {
        observation.orientation.strikeCardinal = this.getCardinalDirection(observation.orientation.strike)
      }
      if (observation.orientation.dip_dir != null) {
        observation.orientation.dip_dirCardinal = this.getCardinalDirection(observation.orientation.dip_dir)
      }
    }

    return observation
  }
}
