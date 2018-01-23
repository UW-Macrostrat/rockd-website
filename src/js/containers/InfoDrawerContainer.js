import { connect } from 'react-redux'
import { toggleInfoDrawer, expandInfoDrawer } from '../actions'
import InfoDrawer from '../components/InfoDrawer'

const mapStateToProps = (state) => {
  return {
    infoDrawerOpen: state.update.infoDrawerOpen,
    infoDrawerExpanded: state.update.infoDrawerExpanded,
    mapInfo: state.update.mapInfo,
    fetchingMapInfo: state.update.fetchingMapInfo,
    infoMarkerLng: state.update.infoMarkerLng,
    infoMarkerLat: state.update.infoMarkerLat
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggleInfoDrawer: () => {
      dispatch(toggleInfoDrawer())
    },
    expandInfoDrawer: () => {
      dispatch(expandInfoDrawer())
    }
  }
}

const InfoDrawerContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(InfoDrawer)

export default InfoDrawerContainer
