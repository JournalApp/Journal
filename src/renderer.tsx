import { createGlobalStyle } from 'styled-components'
import { createCssVars } from 'utils'

const lightPalette = {
  neutral: {
    '10': '#F9F9F9', // popper
    '15': '#F3F3F3', // hover, toggle group bg
    '20': '#E9E9E9', // border
    '25': '#E0E0E0', // bg
    '100': '#3A3A3A', // text
  },
}

const lightTheme = {
  color: {
    neutral: {
      main: lightPalette.neutral[100],
      inverted: lightPalette.neutral[15],
      border: lightPalette.neutral[20],
      surface: lightPalette.neutral[25],
      hover: lightPalette.neutral[20],
      popper: lightPalette.neutral[10],
    },
  },
  font: {
    main: "'Inter var'",
  },
  space: {
    one: '8px',
  },
}

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
