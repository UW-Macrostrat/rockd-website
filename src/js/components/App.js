import React, { Component, PropTypes } from 'react'
import Grid from '@material-ui/core/Grid'

// Import other components
import MapContainer from '../containers/MapContainer'
import InfoContainer from '../containers/InfoContainer'

class App extends Component {
  constructor(props) {
    super(props)
  }
  render() {
    const { trip } = this.props
    let content;
    if (trip && trip.trip_id && trip.trip_id != null) {
      content = (<div className='app'>
        <Grid container className='app'>
          <Grid item xs={12} sm={8} className='map-container'>
            <MapContainer/>
          </Grid>
          <Grid item xs={12} sm={4} className="info-grid">
            <InfoContainer/>
          </Grid>
        </Grid>
      </div>)
    } else {
      content = (
        <div className='error'>
          <div>
            <h1>Trip not found</h1>
          </div>
        </div>
      )
    }
    return content
  }
}

export default App
