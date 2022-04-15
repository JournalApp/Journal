import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { EntryList, Calendar, Menu } from 'components'
import { AppearanceProvider, EntriesProvider } from './context'
import { lightTheme, baseTheme, theme } from 'themes'
import { createGlobalStyle } from 'styled-components'
import { createCssVars } from 'utils'

declare global {
  interface Window {
    electronAPI?: any
    clipboardData?: any
  }
}

const GlobalStyle = createGlobalStyle`
:root {
	${createCssVars(lightTheme)};
  ${createCssVars(baseTheme)};
}

body {
  box-sizing: border-box;
  color: ${theme('color.primary.main')};
  background-color: ${theme('color.primary.surface')};
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -webkit-app-region: drag;
  -webkit-user-select: none;
}

hr {
  background-color: ${theme('color.primary.main')}!important;
  height: 1px!important;
  opacity: 0.1;
}
`

const Container = styled.div`
  min-height: 100vh;
`

function App() {
  return (
    <>
      <GlobalStyle />
      <EntriesProvider>
        <Container>
          <AppearanceProvider>
            <Menu />
          </AppearanceProvider>
          <EntryList />
          <Calendar />
        </Container>
      </EntriesProvider>
    </>
  )
}

export { App }
