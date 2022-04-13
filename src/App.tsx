import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { EntryList, Calendar, Menu } from 'components'
import { UserProvider, EntriesProvider } from './context'
import { lightTheme, theme } from 'themes'
import { createGlobalStyle } from 'styled-components'
import { createCssVars } from 'utils'

const GlobalStyle = createGlobalStyle`
:root {
	${createCssVars(lightTheme)}
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

declare global {
  interface Window {
    electronAPI?: any
    clipboardData?: any
  }
}

const Container = styled.div`
  min-height: 100vh;
`

function App() {
  return (
    <>
      <GlobalStyle />
      <EntriesProvider>
        <UserProvider>
          <Container>
            <Menu />
            <EntryList />
            <Calendar />
          </Container>
        </UserProvider>
      </EntriesProvider>
    </>
  )
}

export { App }
