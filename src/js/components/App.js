import React, { Component, PropTypes } from 'react'
import Grid from '@material-ui/core/Grid'

// Import other components
import MapContainer from '../containers/MapContainer'
import InfoContainer from '../containers/InfoContainer'

class App extends Component {
  constructor(props) {
    super(props)
  }
  // componentDidMount() {
  //   const jssStyles = document.getElementById('jss-server-side')
  //   if (jssStyles && jssStyles.parentNode) {
  //     jssStyles.parentNode.removeChild(jssStyles)
  //   }
  // }

  render() {
    return (
      <div className='app'>
        <Grid container className='app'>
          <Grid item xs={12} sm={8}>
            <MapContainer/>
          </Grid>
          <Grid item xs={12} sm={4}>
            <InfoContainer/>
          </Grid>
        </Grid>

      </div>
    )
  }
}

export default App
