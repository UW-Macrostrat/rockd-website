import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Settings } from './settings.service'

import 'rxjs/add/operator/toPromise';

@Injectable()

export class AutocompleteService {

  constructor(
    private http: Http) {

  }
  search(query, callback) {
    this.http.get(`${Settings.APIURL}/autocomplete/${query}`)
      .toPromise()
      .then(response => { return response.json() })
      .then(json => callback(null, json.success.data))
      .catch(error => callback(error, null))
  }
}
