import { createGlobalStyle } from 'styled-components'
import { createCssVars } from 'utils'
import { lightTheme, theme } from 'themes'

const GlobalStyle = createGlobalStyle`
:root {
	${createCssVars(lightTheme)}
}

body {
  box-sizing: border-box;
  color: ${theme('color.neutral.main')};
  background-color: ${theme('color.neutral.surface')};
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -webkit-app-region: drag;
  -webkit-user-select: none;
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
