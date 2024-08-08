import React, { Component, PropTypes } from 'react'
import Constants from '../Constants'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import StopContainer from '../containers/StopContainer'

class Info extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { trip } = this.props

    return (
      <div className='info-container'>
        <div className='trip-meta'>
          <img src={Constants.ROCKD_API_URL + "/protected/gravatar/" + trip.person_id} className='profile-pic'/>
          <div className='trip-meta-text'>
            <p className='person-name'>{trip.first_name} {trip.last_name}</p>
            <p className='edited'>Edited {trip.updated.toString()}</p>
          </div>

        </div>
        <h1 className='trip-title'>{trip.name}</h1>
        <p className={trip.description ? 'trip-description' : 'hidden'}>{trip.description}</p>
        <Button className='download-kmz' size="small" variant="outlined" href={"https://rockd.org/api/v2/trips/" + trip.trip_id + "?format=kmz"} target="_blank">
          Download KMZ
        </Button>
        {trip.stops.map((s, i) => {
          return <StopContainer key={s.stop_id} stop={s} idx={i + 1}/>
        })}

      </div>
    )
  }
}

export default Info
