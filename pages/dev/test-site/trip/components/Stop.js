import React, { Component, PropTypes } from 'react'
import Constants from '../Constants'
import Paper from '@material-ui/core/Paper'
import CheckinCard from './CheckinCard'
import IconButton from '@material-ui/core/IconButton'
import Room from '@material-ui/icons/Room'

class Stop extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { stop, idx, goToStop } = this.props

    return (
      <Paper className='stop'>
        <div className='stop-content'>
          <h1 className='stop-name'>{idx}. {stop.name}</h1>
          <p className='stop-description'>{stop.description}</p>
          <IconButton aria-label="location" className='go-to-stop' onClick={() => { goToStop([stop.checkin.lng, stop.checkin.lat]) }}>
            <Room />
          </IconButton>
        </div>

        <CheckinCard checkin={stop.checkin}/>

      </Paper>
    )
  }
}

export default Stop
