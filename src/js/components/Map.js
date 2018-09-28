import React, { Component, PropTypes } from 'react'
import axios from 'axios'
import Constants from '../Constants'
import MapStyle from '../MapStyle'
import LongText from './LongText'
import Reference from './Reference'
import Button from '@material-ui/core/Button'
import Modal from '@material-ui/core/Modal'
import Paper from '@material-ui/core/Paper'
import Close from '@material-ui/icons/Close'

class Map extends Component {
  constructor(props) {
    super(props)
    this.map = null
    this.state = {
      showBedrock: false,
      showMapInfo: false,
      mapInfo: {}
    }
  }

  componentDidMount() {
    let mapboxgl;
    if (__CLIENT__) {
      mapboxgl = require('mapbox-gl')
    }
    mapboxgl.accessToken = Constants.MAPBOX_ACCESS_TOKEN
    const { onClick, trip } = this.props

    // Create the map
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i',
      center: [0, 0],
      zoom: 1,
      hash: true
    })
    // Add the zoom control
    let nav = new mapboxgl.NavigationControl({ showCompass: false })
    this.map.addControl(nav, 'top-left')

    let geojson = {
      'type': 'FeatureCollection',
      'features': []
    }
    let lats = []
    let lngs = []

    trip.stops.forEach((stop, i) => {
      geojson.features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [stop.checkin.lng, stop.checkin.lat]
        },
        properties: {
          index: i + 1
        }
      })

      lngs.push(stop.checkin.lng)
      lats.push(stop.checkin.lat)
    })

    // Add the trip stops to the map
    this.map.on('load', () => {
      this.map.addLayer({
        id: 'points',
        type: 'symbol',
        source: {
          type: 'geojson',
          data: geojson
        },
        layout: {
          "icon-image": "pin",
          "icon-size": 0.65,
          "text-field": "{index}",
          "text-offset": [0.6, 0.6],
          "text-anchor": "top",
          "icon-allow-overlap": true
        }
      })

      // adjust the map to show all the stops
      this.map.fitBounds([
        [ Math.max(...lngs), Math.max(...lats) ],
        [ Math.min(...lngs), Math.min(...lats) ]
      ], {
        maxZoom: 12,
        duration: 0,
        padding: 25
      })
    })

    this.map.on('click', (event) => {
      // Are they clicking on a trip stop?
      let points = this.map.queryRenderedFeatures(event.point, { layers: ['points']})

      if (points.length) {
        this.map.flyTo({
          center: points[0].geometry.coordinates,
          zoom: 12
        })
        return
      }

      if (this.state.showBedrock) {
        let burwellFeatures = this.map.queryRenderedFeatures(event.point, { layers: [ 'burwell_fill' ]})

        if (burwellFeatures.length) {
          this.queryMap(event.lngLat, this.map.getZoom())
        }
      }
    })
  }

  queryMap(lngLat, z) {
    let CancelToken = axios.CancelToken
    let source = CancelToken.source()

    let url = `${Constants.MACROSTRAT_API_URL}/mobile/map_query_v2?lng=${lngLat.lng.toFixed(5)}&lat=${lngLat.lat.toFixed(5)}&z=${parseInt(z)}`

    return axios.get(url, {
      cancelToken: source.token,
      responseType: 'json'
    })
    .then(json => {
      this.setState({
        mapInfo: json.data.success.data.mapData[0],
        showMapInfo: true
      })
      console.log(json.data.success.data.mapData[0])
    })

    .catch(error => {
      // don't care 💁
    })
  }

  closeMapInfo() {
    this.setState({
      showMapInfo: false
    })
  }
  shouldComponentUpdate(nextProps, nextState) {
    // If the user wants to zoom to a stop adjust the map but don't trigger a render
    if (nextProps.activeStop[0] != this.props.activeStop[0] && nextProps.activeStop[1] != this.props.activeStop[1]) {
      this.map.flyTo({
        center: nextProps.activeStop,
        zoom: 12
      })
      return false
    }
    return true
  }

  toggleBedrock() {
    // remove
    if (this.state.showBedrock) {
      this.setState({showBedrock: false})

      MapStyle.layers.forEach(layer => {
        this.map.removeLayer(layer.id)
      })
      this.map.removeSource('burwell')
      this.map.removeSource('info_marker')
    }
    // add
    else {
      this.setState({showBedrock: true})
      this.map.addSource('burwell', MapStyle.sources.burwell)
      this.map.addSource('info_marker', MapStyle.sources.info_marker)

      MapStyle.layers.forEach(layer => {
        if (layer.id != 'infoMarker') {
          this.map.addLayer(layer, 'airport-label')
        } else {
          this.map.addLayer(layer)
        }
      })
    }
  }

  render() {
    console.log('render')
    const { trip } = this.props
    const { showBedrock, showMapInfo, mapInfo } = this.state

    return (
      <div className='map-container2'>
        <Button variant="extendedFab" size="small" aria-label="bedrock" className={showBedrock ? "bedrock-control active" : "bedrock-control"} onClick={() => { this.toggleBedrock() }}>
          {showBedrock ? 'Hide' : 'Show'} Bedrock
        </Button>
        <div id="map"></div>

          <Modal
            aria-labelledby="simple-modal-title"
            aria-describedby="simple-modal-description"
            open={showMapInfo}
            onClose={() => { this.closeMapInfo() }}
          >
            <Paper className='mapInfo-paper'>
              <Close className='close-modal' onClick={() => { this.closeMapInfo() }}/>
              {
                Object.keys(mapInfo).length ?

                      <div className="map-source-attrs">
                        {
                          mapInfo.name && mapInfo.name.length
                          ? <div className="map-source-attr">
                              <span className="attr">Name: </span> {mapInfo.name}
                            </div>
                          : ''
                        }
                        {
                          mapInfo.age && mapInfo.age.length
                          ? <div className="map-source-attr">
                              <span className="attr">Age: </span> {mapInfo.age} ({ mapInfo.b_int.b_age } - {mapInfo.t_int.t_age}<span className="age-chip-ma">Ma</span>)
                            </div>
                          : ''
                        }
                        {
                          mapInfo.strat_name && mapInfo.strat_name.length
                          ? <LongText name="Stratigraphic name(s)" text={mapInfo.strat_name}/>
                          :''
                        }
                        {
                          mapInfo.lith && mapInfo.lith.length
                          ? <LongText name="Lithology" text={mapInfo.lith}/>
                          : ''
                        }
                        {
                          mapInfo.descrip && mapInfo.descrip.length
                          ? <LongText name="Description" text={mapInfo.descrip}/>
                          : ''
                        }
                        {
                          mapInfo.comments && mapInfo.comments.length
                          ? <LongText name="Comments" text={mapInfo.comments}/>
                          : ''
                        }
                        {
                          mapInfo.lines && mapInfo.lines.length
                          ?
                            <div className="map-source-attr">
                              <span className="attr">Lines: </span>
                              {mapInfo.lines.map((line, idx) => {
                                return <div className="map-source-line" key={idx}>
                                  {
                                    line.name
                                    ? <span className="line-attr"><span className="attr">Name: </span> {line.name}</span>
                                    : ''
                                  }
                                  {
                                    line.type
                                    ? <span className="line-attr"><span className="attr">Type: </span> {line.type}</span>
                                    : ''
                                  }
                                  {
                                    line.direction
                                    ? <span className="line-attr"><span className="attr">Direction: </span> {line.direction}</span>
                                    : ''
                                  }
                                  {
                                    line.descrip
                                    ? <span className="line-attr"><span className="attr">Description: </span> {line.descrip}</span>
                                    : ''
                                  }
                                </div>
                              })}
                            </div>

                          : ''
                        }
                        <Reference reference={mapInfo.ref} />
                      </div>

                : ''
              }
            </Paper>
          </Modal>
      </div>

    )
  }
}

export default Map
