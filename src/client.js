import '@babel/polyfill'

import React from 'react'
import { hydrate } from 'react-dom'
import { Provider } from 'react-redux'
import configureStore from './js/redux/configureStore'
import App from './js/components/app'

import JssProvider from 'react-jss/lib/JssProvider';
import {
  MuiThemeProvider,
  createMuiTheme,
  createGenerateClassName,
} from '@material-ui/core/styles'

// Create a theme instance.
const theme = createMuiTheme()

// Create a new class name generator.
const generateClassName = createGenerateClassName()

// Read the state sent with markup
const state = window.__STATE__;

// delete the state from global window object
delete window.__STATE__

// reproduce the store used to render the page on server
const store = configureStore(state)

/**
 * hydrate the page to make sure both server and client
 * side pages are identical. This includes markup checking,
 * react comments to identify elements and more.
 */

hydrate(
  <JssProvider generateClassName={generateClassName}>
    <MuiThemeProvider theme={theme}>
      <Provider store={store}>
         <App />
      </Provider>
    </MuiThemeProvider>
  </JssProvider>,
  document.getElementById('react')
)
