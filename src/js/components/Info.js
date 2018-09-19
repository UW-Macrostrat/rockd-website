import React, { Component, PropTypes } from 'react'

class Info extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { msg, clicks, onClick, trip } = this.props

    return (
      <div className='info-container'>
        <h1>I'm the sidebar!</h1>
        <p>Displaying trip {trip.trip_id}</p>
      </div>
    )
  }
}

export default Info
