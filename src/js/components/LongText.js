import React, { Component } from 'react'
import IconButton from '@material-ui/core/IconButton'
import Collapse from '@material-ui/core/Collapse'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp'
/*
  Takes: b_int and t_int
*/
class LongText extends Component {
  constructor(props) {
    super(props)
    this.state = {
      expanded: false
    }
    this.toggleExpand = this.toggleExpand.bind(this)
  }

  toggleExpand() {
    this.setState({'expanded': !this.state.expanded})
  }

  render() {
    const { name, text } = this.props
    return (
      <div className="map-source-attr">
        <span className="attr">{name}: </span>
        {text.substr(0, 250)}
        { text.length > 250
          ?
          <span>
            <span className={this.state.expanded ? 'hidden' : ''}>...</span>
            <span className={this.state.expanded ? 'hidden' : ''}>
              <IconButton color="default" aria-label="Show more" onClick={this.toggleExpand} classes={{ 'root': 'long-text-button' }}>
                <KeyboardArrowDown />
              </IconButton>
            </span>
            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
              { text.substr(250, text.length) }
              <span className={this.state.expanded ? '' : 'hidden'}>
                <IconButton color="default" aria-label="Show more" onClick={this.toggleExpand} classes={{ 'root': 'long-text-button' }}>
                  <KeyboardArrowUp />
                </IconButton>
              </span>
            </Collapse>
          </span>

          : ''
        }
      </div>
    )
  }
}

export default LongText
