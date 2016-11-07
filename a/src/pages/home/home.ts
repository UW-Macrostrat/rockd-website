import { Component, AfterViewInit } from '@angular/core';
import { CheckinService } from '../../services/checkin-service.service';
import { MacrostratService } from '../../services/macrostrat.service';
import { ModalController } from 'ionic-angular'
import { CheckinInfoModal } from '../checkin-info/checkin-info-modal';
import { MapInfoModal } from '../map-info/map-info';

import { AboutPage } from '../about/about';

// Ignore typings for Leaflet...it's a huge unnecessary pain
declare const L

@Component({
  selector: 'home-page',
  templateUrl: 'home.html'
})

export class HomePage {
  mapInfo

  aboutPage = AboutPage;

  constructor(
    public checkinService: CheckinService,
    public macrostratService: MacrostratService,
    public modalCtrl: ModalController
  ) {
    this.mapInfo = {
      macrostrat: {},
      burwell: [],
      elevation: null,
      literature: {
        journals: []
      }
    }
  }

  ngAfterViewInit() {
    const map = L.map('map', {
      maxZoom: 14
    }).setView([30, -12], 3)
  //  var hash = new L.Hash(map)
    // add tile layer

    let geologyTiles = L.tileLayer(`https://macrostrat.org/api/v2/maps/burwell/emphasized/{z}/{x}/{y}/tile.png`, {
      opacity: 0.5,
      zIndex: 100
    }).addTo(map)

    // let basemapTiles = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
    //   attribution: '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attributions">CARTO</a>',
    //   zIndex: 1
    // }).addTo(map)

    let basemapTiles = L.tileLayer('https://api.mapbox.com/styles/v1/jczaplewski/cigmamq4n000xaaknfpuj1zdk/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiamN6YXBsZXdza2kiLCJhIjoiWnQxSC01USJ9.oleZzfREJUKAK1TMeCD0bg', {
      attribution: '© <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a><span> © <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a></span><span> © <a href="https://www.digitalglobe.com/" target="_blank">DigitalGlobe</a></span>',
      zIndex: 1
    }).addTo(map)


    setTimeout(function() {
      map.invalidateSize(true)
    }, 100)

    const points = L.featureGroup().addTo(map)
    const clusters = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true
    })

    const infoMarker = new L.marker([0, 0], {
      icon: L.icon({
        iconUrl: '../assets/marker-icon-bw-2x.png',
        shadowUrl: '../assets/marker-shadow.png',
        iconSize: [25,41],
        iconAnchor: [12, 41]
      })
    }).addTo(map)

    map.on('click', (event) => {
      infoMarker.setLatLng(event.latlng).addTo(map)

      let z = map.getZoom()
      this.macrostratService.queryMap(event.latlng, z, (error, data) => {
        if (error) { console.log(error) }

        this.mapInfo = data.success.data
        this.mapInfo.lat = event.latlng.lat.toFixed(4)
        this.mapInfo.lng = event.latlng.lng.toFixed(4)
        this.mapInfo.literature = {
          journals: []
        }
        if (Object.keys(this.mapInfo.macrostrat).length && this.mapInfo.macrostrat.rank_names.length) {
          this.macrostratService.fetchArticles(this.mapInfo.macrostrat.rank_names, (error, literature) => {
              this.mapInfo.literature = literature
          })
        }
        this.openMapInfoModal()
      })
    })

    this.checkinService.getMap((error, data) =>
      data.features.forEach(d => {
        var marker = L.circleMarker([d.geometry.coordinates[1], d.geometry.coordinates[0]], {
          radius: 1,
          // stroke
          color: '#ffffff',
          weight: '1',
          opacity: 1,
          // fill
          fill: true,
          fillColor: '#ffffff',
          fillOpacity: 0.5,
          checkin_id: d.properties.checkin_id
        })

        marker.on('click', event => {
          L.DomEvent.stopPropagation(event)

          this.checkinService.get({
            checkin_id: event.target.options.checkin_id
          }, null, (error, result) => {
            this.openModal(result[0])
          })
        })

        points.addLayer(marker)
        clusters.addLayer(marker)
      })
    )

    map.on('zoomstart, movestart', function() {
      map.removeLayer(infoMarker)
    })


    // style
    map.on('zoomend', function() {
      let z = map.getZoom()
      if (z >= 12) {
        if (map.hasLayer(points)) {
          map.removeLayer(points)
          map.addLayer(clusters)
        }
      }
      if (z < 12) {
        if (map.hasLayer(clusters)) {
          map.removeLayer(clusters)
          map.addLayer(points)
        }
      }
      var style = {}
      switch (z) {
        case 0:
        case 1:
        case 2:
        case 3:
          style = {
            radius: 1,
            color: '#ffffff',
            weight: '1',
            opacity: 1,
            fill: true,
            fillColor: '#ffffff',
            fillOpacity: 1
          }
          break
        case 4:
        case 5:
          style = {
            radius: 2,
            color: '#ffffff',
            weight: '1',
            opacity: 1,
            fill: true,
            fillColor: '#ffffff',
            fillOpacity: 1
          }
          break
        case 6:
          style = {
            radius: 3,
            color: '#ffffff',
            weight: '1',
            opacity: 1,
            fill: true,
            fillColor: '#ffffff',
            fillOpacity: 1
          }
          break
        case 7:
          style = {
            radius: 4,
            color: '#ffffff',
            weight: '1',
            opacity: 1,
            fill: true,
            fillColor: '#ffffff',
            fillOpacity: 1
          }
          break
        case 8:
          style = {
            radius: 5,
            color: '#ffffff',
            weight: '1',
            opacity: 1,
            fill: true,
            fillColor: '#ffffff',
            fillOpacity: 1
          }
          break
        case 9:
          style = {
            radius: 6,
            color: '#ffffff',
            weight: '1',
            opacity: 1,
            fill: true,
            fillColor: '#ffffff',
            fillOpacity: 1
          }
          break
        case 10:
        case 11:
        case 12:
          style = {
            radius: 8,
            color: '#ffffff',
            weight: '1',
            opacity: 1,
            fill: true,
            fillColor: '#ffffff',
            fillOpacity: 1
          }
          break
        case 13:
        case 14:
          style = {
            radius: 8,
            color: '#ffffff',
            weight: '1',
            opacity: 1,
            fill: true,
            fillColor: '#ffffff',
            fillOpacity: 0.5
          }
          break
      }

      points.setStyle(style)
    })
  }

  openModal(checkin) {
    this.modalCtrl.create(CheckinInfoModal, {checkin: checkin }).present()
  }
  openMapInfoModal() {
    this.modalCtrl.create(MapInfoModal, {mapInfo: this.mapInfo}).present()
  }
}
