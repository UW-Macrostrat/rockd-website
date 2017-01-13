import { Component } from '@angular/core'
import { CheckinService } from '../../services/checkin-service.service'
import { MacrostratService } from '../../services/macrostrat.service'
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
    strat_name_concepts: [],
    strat_name_orphans: [],
    lithologies: [],
    intervals: [],
    minerals: [],
    structures: []
  }
  public loadingAutocomplete:boolean = false
  public filters: any = []

  public mode = (window.innerWidth < 1000) ? 'mobile' : 'desktop'
  public showList = true

  constructor(
    public checkinService: CheckinService,
    public macrostratService: MacrostratService,
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
    this.macrostratService.autocomplete($event.target.value, (error, results) => {
      this.autocompleteResults = {
        strat_name_concepts: results.strat_name_concepts || [],
        strat_name_orphans: results.strat_name_orphans || [],
        lithologies: results.lithologies || [],
        intervals: results.intervals || [],
        minerals: results.minerals || [],
        structures: results.structures || []
      }
      this.loadingAutocomplete = false
    })
  }

  addFilter(item, type) {
    // Need a query to get hierarchy for strat_name_concepts and strat_name_orphans
    // Lithologies, intervals, minerals, and structures can be applied right away
    switch(type) {
      case 'strat_name_concept':
      case 'strat_name_orphan':
        this.macrostratService.defineStratName(item.id, type, (error, result) => {
          if (error || !result || !result.length) { return }
          this.filters = [{
            cat: type,
            name: item.name,
            vals: result.map(d => { return d.strat_name_id })
          }].concat(this.filters)
        })
        break
      case 'intervals':
        this.macrostratService.defineInterval(item.id, (error, result) => {
          if (error || !result || !result.length) { return }
          this.filters = [{
            cat: type,
            name: item.name,
            vals: [result[0].b_age, result[0].t_age]
          }].concat(this.filters)
        })
        break
      case 'lithologies':
      case 'minerals':
      case 'structures':
        this.filters = [{
          cat: type,
          name: item.name,
          vals: [ item.id ]
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
