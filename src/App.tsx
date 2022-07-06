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
  Splash,
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
  SpellCheckEnabled,
  getBaseThemeWithOverrides,
} from 'config'
import { electronAPIType } from './preload'

declare global {
  interface Window {
    electronAPI: electronAPIType
    clipboardData?: any
  }
}

const userPreferences = window.electronAPI.preferences.getAll()
const initialColorTheme: ColorTheme = userPreferences?.theme || defaultUserPreferences.theme
const initialFontFace: FontFace = userPreferences?.fontFace || defaultUserPreferences.fontFace
const initialFontSize: FontSize = userPreferences?.fontSize || defaultUserPreferences.fontSize
const initialCalendarOpen: CalendarOpen =
  userPreferences?.calendarOpen || defaultUserPreferences.calendarOpen
const initialSpellCheckEnabled: SpellCheckEnabled =
  userPreferences?.spellCheckEnabled || defaultUserPreferences.spellCheckEnabled

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
  user-select: none;
}

hr {
  background-color: ${theme('color.primary.main')}!important;
  height: 1px!important;
  opacity: 0.1;
}

.slate-hand-strikethrough {
  background-image: ${theme('style.handStriketrough')};
  background-position: center;
  background-repeat: repeat-x;
  
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
      <Splash />
      <UserProvider>
        <EntriesProvider>
          <AppearanceProvider
            initialColorTheme={initialColorTheme}
            initialFontFace={initialFontFace}
            initialFontSize={initialFontSize}
            initialCalendarOpen={initialCalendarOpen}
            initialSpellCheckEnabled={initialSpellCheckEnabled}
          >
            <FadeOut />
            <Menu />
            <TrafficLightMenu />
            <Calendar />
            <ScrollToToday />
            <FeedbackWidget />
            <NoDragScrollBars />
            <Container>
              <EntryList />
            </Container>
          </AppearanceProvider>
        </EntriesProvider>
      </UserProvider>
    </>
  )
}

export { App }
