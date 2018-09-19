import { connect } from 'react-redux'
import { pageClick } from '../actions'
import Info from '../components/Info'

const mapStateToProps = (state) => {
  return {
    msg: state.main.msg,
    clicks: state.main.clicks,
    trip: state.main.trip
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onClick: () => {
      dispatch(pageClick())
    }
  }
}

const InfoContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Info)

export default InfoContainer
