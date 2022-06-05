import React, { useState, useEffect } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import {
  EntryList,
  Calendar,
  Menu,
  TrafficLightMenu,
  FadeOut,
  ScrollToToday,
  FeedbackWidget,
} from 'components'
import { AppearanceProvider, EntriesProvider, UserProvider } from 'context'
import { theme } from 'themes'
import { createCssVars, supabase } from 'utils'
import {
  defaultUserPreferences,
  getColorTheme,
  ColorTheme,
  FontFace,
  FontSize,
  CalendarOpen,
  getBaseThemeWithOverrides,
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

const initialCalendarOpen: CalendarOpen =
  userPreferences.appearance?.calendarOpen || defaultUserPreferences.appearance.calendarOpen

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

const NoDragScrollBars = styled.div`
  -webkit-app-region: no-drag;
  position: fixed;
  top: 0px;
  bottom: 0px;
  right: 0px;
  width: 12px;
`

function App() {
  return (
    <>
      <GlobalStyle />
      <UserProvider>
        <EntriesProvider>
          <AppearanceProvider
            initialColorTheme={initialColorTheme}
            initialFontFace={initialFontFace}
            initialFontSize={initialFontSize}
            initialCalendarOpen={initialCalendarOpen}
          >
            <FadeOut />
            <Menu />
            <TrafficLightMenu />
            <Calendar />
            <ScrollToToday />
            <FeedbackWidget />
          </AppearanceProvider>
          <NoDragScrollBars />
          <Container>
            <EntryList />
          </Container>
        </EntriesProvider>
      </UserProvider>
    </>
  )
}

export { App }
