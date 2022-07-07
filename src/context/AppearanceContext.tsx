import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { logger, setCssVars } from 'utils'
import {
  defaultUserPreferences,
  getFontSize,
  getFontFace,
  getColorTheme,
  getCalendarIsOpen,
  getSpellCheckIsEnabled,
  ColorTheme,
  FontSize,
  FontFace,
  CalendarOpen,
  SpellCheckEnabled,
} from 'config'
import { useUserContext } from 'context'

interface AppearanceContextInterface {
  colorTheme: ColorTheme
  fontFace: FontFace
  fontSize: FontSize
  isCalendarOpen: CalendarOpen
  spellCheckIsEnabled: SpellCheckEnabled
  setColorTheme: (theme: ColorTheme) => void
  setFontSize: (size: FontSize) => void
  setFontFace: (size: FontFace) => void
  toggleIsCalendarOpen: () => void
  setSpellCheck: (spellCheckEnabled: SpellCheckEnabled) => void
}

const AppearanceContext = createContext<AppearanceContextInterface | null>(null)

type AppearanceProviderProps = {
  initialColorTheme: ColorTheme
  initialFontSize: FontSize
  initialFontFace: FontFace
  initialCalendarOpen: CalendarOpen
  initialSpellCheckEnabled: SpellCheckEnabled
  children: any
}

export function AppearanceProvider({
  initialColorTheme,
  initialFontSize,
  initialFontFace,
  initialCalendarOpen,
  initialSpellCheckEnabled,
  children,
}: AppearanceProviderProps) {
  const [colorTheme, setColorThemeInternal] = useState<ColorTheme>(initialColorTheme)
  const [fontFace, setFontFaceInternal] = useState<FontFace>(initialFontFace)
  const [fontSize, setFontSizeInternal] = useState<FontSize>(initialFontSize)
  const [isCalendarOpen, setIsCalendarOpenInternal] = useState<CalendarOpen>(initialCalendarOpen)
  const [spellCheckIsEnabled, setSpellCheckIsEnabled] =
    useState<SpellCheckEnabled>(initialSpellCheckEnabled)
  const { session } = useUserContext()

  const setFontFace = (face: FontFace) => {
    setFontFaceInternal(face)
    document.documentElement.style.setProperty('--appearance-fontFace', getFontFace(face))
    window.electronAPI.preferences.set(session.user.id, { fontFace: face })
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'appearance set-font-face',
      properties: { face },
    })
  }

  const setFontSize = (size: FontSize) => {
    setFontSizeInternal(size)
    document.documentElement.style.setProperty('--appearance-fontSize', getFontSize(size) + 'px')
    window.electronAPI.preferences.set(session.user.id, { fontSize: size })
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'appearance set-font-size',
      properties: { size },
    })
  }

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeInternal(theme)
    setCssVars(getColorTheme(theme))
    window.electronAPI.preferences.set(session.user.id, { theme })
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'appearance set-theme',
      properties: { theme },
    })
  }

  const setSpellCheck = (spellCheckEnabled: SpellCheckEnabled) => {
    if (spellCheckEnabled == 'false') {
      window.electronAPI.disableSpellCheck()
    } else {
      window.electronAPI.enableSpellCheck()
    }
    setSpellCheckIsEnabled(spellCheckEnabled)
    window.electronAPI.preferences.set(session.user.id, { spellCheckEnabled })
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'entry spell-check',
      properties: { spellCheckEnabled },
    })
  }

  const toggleIsCalendarOpen = () => {
    if (isCalendarOpen == 'opened') {
      document.documentElement.style.setProperty(
        '--appearance-entriesOffset',
        getCalendarIsOpen('closed').entriesOffset + 'px'
      )
      document.documentElement.style.setProperty(
        '--appearance-miniDatesVisibility',
        getCalendarIsOpen('closed').miniDatesVisibility
      )
      setIsCalendarOpenInternal('closed')
      window.electronAPI.preferences.set(session.user.id, { calendarOpen: 'closed' })
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'calendar toggle',
        properties: { action: 'close' },
      })
    } else {
      document.documentElement.style.setProperty(
        '--appearance-entriesOffset',
        getCalendarIsOpen('opened').entriesOffset + 'px'
      )
      document.documentElement.style.setProperty(
        '--appearance-miniDatesVisibility',
        getCalendarIsOpen('opened').miniDatesVisibility
      )
      setIsCalendarOpenInternal('opened')
      window.electronAPI.preferences.set(session.user.id, { calendarOpen: 'opened' })
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'calendar toggle',
        properties: { action: 'open' },
      })
    }
  }

  useEffect(() => {
    const userPreferences = window.electronAPI.preferences.getAll(session.user.id)

    if (userPreferences?.theme) {
      if (colorTheme != userPreferences.theme) {
        setColorTheme(userPreferences.theme)
        logger(`👨‍💻 Setting theme to ${userPreferences?.theme}`)
      }
    } else if (defaultUserPreferences.theme != colorTheme) {
      setColorTheme(defaultUserPreferences.theme)
      logger(`👨‍💻 Setting theme to ${defaultUserPreferences.theme}`)
    }

    if (userPreferences?.fontFace) {
      if (fontFace != userPreferences.fontFace) {
        setFontFace(userPreferences.fontFace)
        logger(`👨‍💻 Setting fontFace to ${userPreferences?.fontFace}`)
      }
    } else if (defaultUserPreferences.fontFace != fontFace) {
      setFontFace(defaultUserPreferences.fontFace)
      logger(`👨‍💻 Setting fontFace to ${defaultUserPreferences.fontFace}`)
    }

    if (userPreferences?.fontSize) {
      if (fontSize != userPreferences.fontSize) {
        setFontSize(userPreferences.fontSize)
        logger(`👨‍💻 Setting fontSize to ${userPreferences?.fontSize}`)
      }
    } else if (defaultUserPreferences.fontSize != fontSize) {
      setFontSize(defaultUserPreferences.fontSize)
      logger(`👨‍💻 Setting fontFace to ${defaultUserPreferences.fontSize}`)
    }

    if (userPreferences?.calendarOpen) {
      if (isCalendarOpen != userPreferences.calendarOpen) {
        toggleIsCalendarOpen()
        logger(`👨‍💻 Setting toggleIsCalendarOpen`)
      }
    } else if (defaultUserPreferences.calendarOpen != isCalendarOpen) {
      toggleIsCalendarOpen()
      logger(`👨‍💻 Setting toggleIsCalendarOpen`)
    }

    if (userPreferences?.spellCheckEnabled) {
      if (spellCheckIsEnabled != userPreferences.spellCheckEnabled) {
        setSpellCheck(userPreferences.spellCheckEnabled)
        logger(`👨‍💻 Setting setSpellCheck to ${userPreferences.spellCheckEnabled}`)
      }
    } else if (defaultUserPreferences.spellCheckEnabled != spellCheckIsEnabled) {
      setSpellCheck(defaultUserPreferences.spellCheckEnabled)
      logger(`👨‍💻 Setting setSpellCheck to ${defaultUserPreferences.spellCheckEnabled}`)
    }
  }, [])

  let state = {
    colorTheme,
    fontFace,
    fontSize,
    isCalendarOpen,
    spellCheckIsEnabled,
    setColorTheme,
    setFontFace,
    setFontSize,
    toggleIsCalendarOpen,
    setSpellCheck,
  }
  return <AppearanceContext.Provider value={state}>{children}</AppearanceContext.Provider>
}

export function useAppearanceContext() {
  return useContext(AppearanceContext)
}

export { AppearanceContextInterface }
