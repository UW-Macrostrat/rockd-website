import React, { Component, PropTypes } from 'react'
// import mapboxgl from 'mapbox-gl'
import Constants from '../Constants'

class Map extends Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    let mapboxgl;
    if (__CLIENT__) {
      mapboxgl = require('mapbox-gl')
    }
    mapboxgl.accessToken = Constants.MAPBOX_ACCESS_TOKEN

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i',
        center: [0, 0],
        zoom: 1
    })
  }
  render() {
    const { msg, clicks, onClick } = this.props

    return (
      <div id="map"></div>
    )
  }
}

export default Map
