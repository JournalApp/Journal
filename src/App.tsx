import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { EntryList, Calendar, Menu } from 'components'
import { AppearanceProvider, EntriesProvider } from 'context'
import { lightTheme, darkTheme, baseTheme, theme } from 'themes'
import { createGlobalStyle } from 'styled-components'
import { createCssVars } from 'utils'
import { defaultUserPreferences, getColorTheme, ColorTheme, FontSize, FontFace } from 'config'

declare global {
  interface Window {
    electronAPI?: any
    clipboardData?: any
  }
}
const userPreferences = window.electronAPI.storeUserPreferences.getAll()

const colorTheme: ColorTheme =
  userPreferences.appearance.theme || defaultUserPreferences.appearance.theme

const GlobalStyle = createGlobalStyle`
:root {
	${createCssVars(getColorTheme(colorTheme))};
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
          <AppearanceProvider initialColorTheme={colorTheme}>
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
