import "@babel/polyfill";

import React from "react";
import { render, hydrate } from "react-dom";
import { Provider } from "react-redux";
import thunkMiddleware from "redux-thunk";
import { createStore, applyMiddleware } from "redux";
import reducers from "./reducers";
import AppContainer from "./containers/AppContainer";

const state = window.__STATE__;
delete window.__STATE__;

// Create the data store
let store = createStore(reducers, applyMiddleware(thunkMiddleware));

// Render the application
render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
  document.getElementById("react")
);

// Fetch the data on load
//store.dispatch()
