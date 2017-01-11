import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Settings } from './settings.service'

import 'rxjs/add/operator/toPromise';

@Injectable()

export class MacrostratService {

  constructor(
    private http: Http) {

  }

  queryMap(latlng, z, callback) {
    this.http.get(`${Settings.MACROSTRATURL}/mobile/map_query?lat=${latlng.lat}&lng=${latlng.lng}&z=${z}`)
      .toPromise()
      .then(response => callback(null, response.json()))
      .catch(error => callback(error, null))
  }

  fetchArticles(stratNames, callback) {
    this.http.get(`${Settings.GEODEEPDIVEURL}/snippets?term=${stratNames}`)
      .toPromise()
      .then(response => { return response.json() })
      .then(response => {
        let data = []
        if (!response.error) {
          data = response.success.data
        }

        let parsed = {
          journals: []
        }

        // Group articles by journal
        for (let i = 0; i < data.length; i++) {
          data[i].url = (data[i].URL.indexOf('elsevier') > -1) ? 'http://www.sciencedirect.com/science/article/pii/' + data[i].URL.split('pii/')[1] : data[i].URL
          let found = false
          data[i].year = (data[i].coverDate) ? data[i].coverDate.match(/\d{4}/)[0] : ''
          for (let j = 0; j < parsed.journals.length; j++) {
            if (parsed.journals[j].name === data[i].pubname) {
              parsed.journals[j].articles.push(data[i])
              found = true
            }
          }

          if (!found) {
            parsed.journals.push({
              name: data[i].pubname,
              reference: data[i].source,
              articles: [data[i]]
            })
          }
        }

        callback(null, parsed)
      })
      .catch(error => callback(error, null))
  }

  autocomplete(query, callback) {
    this.http.get(`${Settings.MACROSTRATURL}/defs/autocomplete?include=strat_name_concepts,strat_name_orphans,lithologies,intervals,minerals,structures&query=${query}`)
      .toPromise()
      .then(response => { return response.json() })
      .then(json => callback(null, json.success.data))
      .catch(error => callback(error, null))
  }

  defineInterval(int_id, callback) {
    this.http.get(`${Settings.MACROSTRATURL}/defs/intervals?int_id=${int_id}`)
      .toPromise()
      .then(response => { return response.json() })
      .then(json => callback(null, json.success.data))
      .catch(error => callback(error, null))
  }

  defineStratName(id, type, callback) {
    this.http.get(`${Settings.MACROSTRATURL}/defs/strat_names?${type === 'strat_name_concept' ? 'concept_id' : 'strat_name_id'}=${id}&rule=down`)
      .toPromise()
      .then(response => { return response.json() })
      .then(json => callback(null, json.success.data))
      .catch(error => callback(error, null))
  }
}
