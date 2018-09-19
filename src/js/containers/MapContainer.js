import { connect } from 'react-redux'
import { pageClick } from '../actions'
import Map from '../components/Map'

const mapStateToProps = (state) => {
  return {
    msg: state.main.msg,
    clicks: state.main.clicks
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
