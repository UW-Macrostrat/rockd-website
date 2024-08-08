import React, { Component, PropTypes } from 'react'
import Constants from '../Constants'
import Paper from '@material-ui/core/Paper'

class CheckinCard extends Component {
  constructor(props) {
    super(props)
  }

  goToCheckin(checkin_id) {
    window.location.href = `https://rockd.org/checkin/${checkin_id}`
  }

  render() {
    const { checkin } = this.props
    return (
      <Paper onClick={() => { this.goToCheckin(checkin.checkin_id) }}>
        <div className='checkin-content'>
          <div className='checkin-header'>
            <img className='checkin-avatar' src={checkin.gravatar}/>
            <div className='checkin-header-content'>
              <p className='checkin-title'>{checkin.title}</p>
              <p className='checkin-near'>{checkin.near}</p>
              <p className='checkin-name'>{checkin.first_name} {checkin.last_name}</p>
            </div>
          </div>
          <img className='checkin-card-img' src={checkin.banner}/>
        </div>

      </Paper>
    )
  }
}

export default CheckinCard
