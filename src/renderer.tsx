import { createGlobalStyle } from 'styled-components'
import { createCssVars } from 'utils'
import { lightTheme } from 'themes'

const GlobalStyle = createGlobalStyle`
:root {
	${createCssVars(lightTheme)}
}
`

import React from 'react'
import { render } from 'react-dom'
import './index.css'

import { App } from './App'

function renderApp() {
  render(
    <>
      <GlobalStyle />
      <App />
    </>,
    document.getElementById('app')
  )
}

renderApp()
