import { connect } from 'react-redux'
import { pageClick } from '../actions'
import Map from '../components/Map'

const mapStateToProps = (state) => {
  return {
    msg: state.handleInteraction.msg,
    clicks: state.handleInteraction.clicks
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onClick: () => {
      dispatch(pageClick())
    }
  }
}

const MapContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Map)

export default MapContainer
