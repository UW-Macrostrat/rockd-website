import { combineReducers } from 'redux'
import { PAGE_CLICK, REQUEST_DATA, RECIEVE_DATA } from '../actions'

// This is the initial state and the primary reducer
const handleInteraction = (state = {
  isFetching: false,
  data: [],
  msg: '',
  clicks: 0
}, action) => {

  switch (action.type) {
    case PAGE_CLICK:
      return Object.assign({}, state, {
        msg: action.msg,
        clicks: state.clicks + 1
      })
    case REQUEST_DATA:
      return Object.assign({}, state, {
        isFetching: true
      })
    case RECIEVE_DATA:
      return Object.assign({}, state, {
        isFetching: false,
        data: action.data
      })
    default:
      return state
  }
}



const reducers = combineReducers({
  // list reducers here
  handleInteraction
})

export default reducers
