import { Component } from '@angular/core'
import { MacrostratService } from '../../services/macrostrat.service'
import { AutocompleteService } from '../../services/autocomplete.service'
import { ModalController, NavController } from 'ionic-angular'

import { AboutPage } from '../about/about'
import { CheckinPage } from '../checkin-page/checkin-page'

@Component({
  selector: 'new-home',
  templateUrl: 'new-home.html'
})

export class NewHomePage {
  public aboutPage = AboutPage
  public orderMap = {
    'added': 'addedParsed',
    'created': 'createdParsed',
    'likes': 'likes'
  }

  public sortby:string = 'added'
  public showMe:number = 5
  public checkins:any = []
  public visibleCheckins:any = []
  public focalLng = 0
  public focalLat = 0
  public searchIsFocused:boolean = false
  public searchText:string = ''
  public autocompleteResults = {
    taxa: [],
    minerals: [],
    structures: [],
    strat_names: [],
    people: [],
    intervals: [],
    liths: [],
    lith_atts: []
  }
  public loadingAutocomplete:boolean = false
  public filters: any = []

  public mode = (window.innerWidth < 1000) ? 'mobile' : 'desktop'
  public showList = true

  constructor(
    public macrostratService: MacrostratService,
    public autocompleteService: AutocompleteService,
    public modalCtrl: ModalController,
    public navCtrl: NavController
  ) { }

  ionViewDidLeave() {
  //  console.log('remove')
  //  this.map.remove()
  }

  ionViewDidEnter() {
//    console.log('ionViewDidEnter')
  //  this.initMap()
  }

  ngAfterViewInit() {

  }

  loadMore() {
    this.visibleCheckins = this.visibleCheckins.concat(this.checkins.slice(this.showMe, this.showMe + 5))
    this.showMe += 5
  }
  sortBy(order, checkins) {
    if (!order) {
      order = 'added'
    }
    return checkins.sort((a, b) => {
      return b[this.orderMap[order]] - a[this.orderMap[order]]
    })
  }

  changeSort() {
    this.checkins = this.sortBy(this.sortby, this.checkins)
    this.visibleCheckins = this.checkins.slice(0, 5)
  }
  setActiveCheckin(checkin) {
    checkin.mousedOver = true
  }
  removeActiveCheckin(checkin) {
    checkin.mousedOver = false
  }

  updateVisible(checkins: any) {
    this.showMe = 5
    this.checkins = this.sortBy(this.sortby, checkins)
    this.visibleCheckins = this.checkins.slice(0, 5)
  }

  zoomTo(lng, lat) {
    this.focalLng = lng
    this.focalLat = lat
  }

  pushCheckinPage(checkin_id) {
    this.navCtrl.push(CheckinPage, { checkin_id: checkin_id.replace('chk|', '') })
  }

  showSearch() {
    this.searchIsFocused = true
  }
  hideSearch() {
    setTimeout(() => {
      this.searchIsFocused = false
    }, 300)
  }

  toggleList() {
    this.showList = true
  }

  toggleMap() {
    this.showList = false
  }

  autocomplete($event) {
    let query = $event.target.value
    if (query.length < 3 || this.loadingAutocomplete) {
      return
    }
    this.loadingAutocomplete = true
    this.autocompleteService.search($event.target.value, (error, results) => {
      this.autocompleteResults = results
      this.loadingAutocomplete = false
    })
    // this.macrostratService.autocomplete($event.target.value, (error, results) => {
    //   this.autocompleteResults = {
    //     strat_name_concepts: results.strat_name_concepts || [],
    //     strat_name_orphans: results.strat_name_orphans || [],
    //     lithologies: results.lithologies || [],
    //     intervals: results.intervals || [],
    //     minerals: results.minerals || [],
    //     structures: results.structures || []
    //   }
    //   this.loadingAutocomplete = false
    // })
  }

  addFilter(item, type) {
    // Need a query to get hierarchy for strat_name_concepts and strat_name_orphans
    // Lithologies, intervals, minerals, and structures can be applied right away
    switch(type) {
      case 'strat_name':
        this.macrostratService.defineStratName(item.strat_name_id, type, (error, result) => {
          if (error || !result || !result.length) { return }
          this.filters = [{
            cat: type,
            name: item.strat_name,
            vals: result.map(d => { return d.strat_name_id })
          }].concat(this.filters)
        })
        break
      case 'intervals':
        this.macrostratService.defineInterval(item.int_id, (error, result) => {
          if (error || !result || !result.length) { return }
          this.filters = [{
            cat: type,
            name: item.name,
            vals: [result[0].b_age, result[0].t_age]
          }].concat(this.filters)
        })
        break
      case 'liths':
        this.filters = [{
          cat: type,
          name: item.name,
          vals: [ item.lith_id ]
        }].concat(this.filters)
        break
      case 'lith_atts':
        this.filters = [{
          cat: type,
          name: item.name,
          vals: [ item.lith_att_id ]
        }].concat(this.filters)
        break
      case 'minerals':
        this.filters = [{
          cat: type,
          name: item.name,
          vals: [ item.mineral_id ]
        }].concat(this.filters)
        break
      case 'taxa':
        this.filters = [{
          cat: type,
          name: item.name,
          vals: [ item.taxon_id ]
        }].concat(this.filters)
        break
      case 'structures':
        this.filters = [{
          cat: type,
          name: item.name,
          vals: [ item.structure_id ]
        }].concat(this.filters)
        break
      case 'people':
        this.filters = [{
          cat: type,
          name: item.name,
          vals: [ item.person_id ]
        }].concat(this.filters)
        break
    }

    this.searchIsFocused = false
    this.searchText = ''
    Object.keys(this.autocompleteResults).forEach(d => {
      this.autocompleteResults[d] = []
    })
  }

  removeFilter(item) {
    this.filters = [].concat(this.filters.filter(f => {
      if (f.name !== item.name && f.cat !== item.cat) {
        return f
      }
    }))
  }

}
