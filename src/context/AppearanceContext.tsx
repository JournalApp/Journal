import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { setCssVars } from 'utils'
import { getFontSize, getFontFace, getColorTheme, ColorTheme, FontSize, FontFace } from 'config'

interface AppearanceContextInterface {
  colorTheme: ColorTheme
  fontFace: FontFace
  fontSize: FontSize
  setColorTheme: (theme: ColorTheme) => void
  setFontSize: (size: FontSize) => void
  setFontFace: (size: FontFace) => void
}

const AppearanceContext = createContext<AppearanceContextInterface | null>(null)

type AppearanceProviderProps = {
  initialColorTheme: ColorTheme
  children: any
}

export function AppearanceProvider({ initialColorTheme, children }: AppearanceProviderProps) {
  const [colorTheme, setColorThemeInternal] = useState<ColorTheme>(initialColorTheme)
  const [fontFace, setFontFaceInternal] = useState<FontFace>('inter')
  const [fontSize, setFontSizeInternal] = useState<FontSize>('normal')

  const setFontFace = (face: FontFace) => {
    setFontFaceInternal(face)
    document.documentElement.style.setProperty('--appearance-fontFace', getFontFace(face))
    window.electronAPI.storeUserPreferences.set('appearance.fontFace', face)
  }

  const setFontSize = (size: FontSize) => {
    setFontSizeInternal(size)
    document.documentElement.style.setProperty('--appearance-fontSize', getFontSize(size) + 'px')
    window.electronAPI.storeUserPreferences.set('appearance.fontSize', size)
  }

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeInternal(theme)
    setCssVars(getColorTheme(theme))
    window.electronAPI.storeUserPreferences.set('appearance.theme', theme)
  }

  let state = {
    colorTheme,
    setColorTheme,
    fontFace,
    setFontFace,
    fontSize,
    setFontSize,
  }
  return <AppearanceContext.Provider value={state}>{children}</AppearanceContext.Provider>
}

export function useAppearanceContext() {
  return useContext(AppearanceContext)
}

export { AppearanceContextInterface }
