import React from 'react'
import { renderToString } from 'react-dom/server'

import { Provider } from 'react-redux'
import configureStore from './js/redux/configureStore'
import AppContainer from './js/containers/AppContainer'

import { SheetsRegistry } from 'react-jss/lib/jss'
import JssProvider from 'react-jss/lib/JssProvider'
import {
  MuiThemeProvider,
  createMuiTheme,
  createGenerateClassName,
} from '@material-ui/core/styles'
import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';

module.exports = initialState => {
  // Configure the store with the initial state provided
  const store = configureStore(initialState)

  // Create a sheetsRegistry instance.
  const sheetsRegistry = new SheetsRegistry()

  // Create a sheetsManager instance.
  const sheetsManager = new Map()

  // Create a theme instance.
  const theme = createMuiTheme()

  // Create a new class name generator.
  const generateClassName = createGenerateClassName()

  // render the App store static markup ins content variable
  let content = renderToString(
    <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
      <MuiThemeProvider theme={theme} sheetsManager={sheetsManager}>
        <Provider store={store} >
           <AppContainer />
        </Provider>
      </MuiThemeProvider>
    </JssProvider>
  )

  // Grab the CSS from our sheetsRegistry.
  // THIS NEEDS TO HAPPEN AFTER renderToString!!!!
  const css = sheetsRegistry.toString()

  // Get a copy of store data to create the same store on client side
  const preloadedState = store.getState()

  return { content, preloadedState, css }
}
