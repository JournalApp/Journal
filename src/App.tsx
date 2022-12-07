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
  Prompts,
  Splash,
} from 'components'
import { AppearanceProvider, EntriesProvider, UserProvider } from 'context'
import { theme } from 'themes'
import { createCssVars, logger } from 'utils'
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
import { serializeError } from 'serialize-error'
import { isDev } from 'utils'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

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

button {
  -webkit-app-region: no-drag;
}

.slate-hand-strikethrough {
  background-image: ${theme('style.handStriketrough')};
  background-position: center;
  background-repeat: repeat-x;
  
}

/* * { border: 1px solid red} */

`

const Container = styled.div`
  /* contain: paint; */
  overflow-x: clip;
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
  window.onerror = function (message, source, lineno, colno, error) {
    logger('window.onerror')
    let lastUser = window.electronAPI.app.getKey('lastUser')
    let serialized = serializeError(error)
    let name = serialized?.name ? ` ${serialized.name}` : 'error'
    window.electronAPI.capture({
      distinctId: lastUser,
      type: 'error',
      event: name,
      properties: serialized,
    })
  }

  return (
    <QueryClientProvider client={queryClient}>
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
            <Prompts />
            <FeedbackWidget />
            <NoDragScrollBars />
            <Container>
              <EntryList />
            </Container>
          </AppearanceProvider>
        </EntriesProvider>
      </UserProvider>
    </QueryClientProvider>
  )
}

export { App }
