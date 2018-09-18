import React, { Component, PropTypes } from 'react'

class Info extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const { msg, clicks, onClick } = this.props

    return (
      <div className='info-container'>
        <h1>I'm the sidebar!</h1>
      </div>
    )
  }
}

export default Info
