import { connect } from 'react-redux'
import { goToStop } from '../actions'
import Stop from '../components/Stop'

const mapStateToProps = (state) => {
  return {
    activeStop: state.main.activeStop
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    goToStop: (coordinate) => {
      dispatch(goToStop(coordinate))
    }
  }
}

const StopContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Stop)

export default StopContainer
