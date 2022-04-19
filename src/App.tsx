import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { EntryList, Calendar, Menu } from 'components'
import { AppearanceProvider, EntriesProvider } from 'context'
import { lightTheme, darkTheme, theme } from 'themes'
import { createGlobalStyle } from 'styled-components'
import { createCssVars } from 'utils'
import {
  defaultUserPreferences,
  getColorTheme,
  ColorTheme,
  FontFace,
  FontSize,
  getBaseThemeWithOverrides,
  baseTheme,
} from 'config'

declare global {
  interface Window {
    electronAPI?: any
    clipboardData?: any
  }
}
const userPreferences = window.electronAPI.storeUserPreferences.getAll()
const initialColorTheme: ColorTheme =
  userPreferences.appearance?.theme || defaultUserPreferences.appearance.theme

const initialFontFace: FontFace =
  userPreferences.appearance?.fontFace || defaultUserPreferences.appearance.fontFace

const initialFontSize: FontSize =
  userPreferences.appearance?.fontSize || defaultUserPreferences.appearance.fontSize

const GlobalStyle = createGlobalStyle`
:root {
  ${createCssVars(getColorTheme(initialColorTheme))};
  ${createCssVars(getBaseThemeWithOverrides(userPreferences))};
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
  contain: paint;
`

function App() {
  return (
    <>
      <GlobalStyle />
      <EntriesProvider>
        <AppearanceProvider
          initialColorTheme={initialColorTheme}
          initialFontFace={initialFontFace}
          initialFontSize={initialFontSize}
        >
          <Menu />
        </AppearanceProvider>
        <Calendar />
        <Container>
          <EntryList />
        </Container>
      </EntriesProvider>
    </>
  )
}

export { App }
