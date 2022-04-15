import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { setCssVars } from 'utils'
import { lightTheme, darkTheme } from 'themes'

interface AppearanceContextInterface {
  colorTheme: 'light' | 'dark'
  fontFace: 'inter' | 'novela'
  fontSize: 'small' | 'normal' | 'large'
  setColorTheme: (theme: AppearanceContextInterface['colorTheme']) => void
  getFontSizePx: () => number
  setFontSize: (size: AppearanceContextInterface['fontSize']) => void
  getFontFaceName: () => string
  setFontFace: (size: AppearanceContextInterface['fontFace']) => void
}

const userPreferences = {
  theme: 'light',
  fontFace: 'inter',
  fontSize: 'normal',
}

const fontSizeMap = {
  small: 18,
  normal: 21,
  large: 23,
}

const fontFaceMap = {
  inter: 'Inter var',
  novela: 'Novela',
}

const colorThemeMap = {
  light: lightTheme,
  dark: darkTheme,
}

const AppearanceContext = createContext<AppearanceContextInterface | null>(null)

export function AppearanceProvider({ children }: any) {
  const [colorTheme, setColorThemeInternal] =
    useState<AppearanceContextInterface['colorTheme']>('light')
  const [fontFace, setFontFaceInternal] = useState<AppearanceContextInterface['fontFace']>('inter')
  const [fontSize, setFontSizeInternal] = useState<AppearanceContextInterface['fontSize']>('normal')

  const getFontSizePx = () => {
    return fontSizeMap[fontSize]
  }

  const getFontFaceName = () => {
    return fontFaceMap[fontFace]
  }

  const setFontFace = (face: AppearanceContextInterface['fontFace']) => {
    setFontFaceInternal(face)
    document.documentElement.style.setProperty('--appearance-fontFace', fontFaceMap[face])
    // TODO Set it in local config
  }

  const setFontSize = (size: AppearanceContextInterface['fontSize']) => {
    setFontSizeInternal(size)
    document.documentElement.style.setProperty('--appearance-fontSize', fontSizeMap[size] + 'px')
    // TODO Set it in local config
  }

  const setColorTheme = (theme: AppearanceContextInterface['colorTheme']) => {
    setColorThemeInternal(theme)
    setCssVars(colorThemeMap[theme])
    // TODO Set it in local config
  }

  let state = {
    colorTheme,
    setColorTheme,
    fontFace,
    getFontFaceName,
    setFontFace,
    fontSize,
    getFontSizePx,
    setFontSize,
  }
  return <AppearanceContext.Provider value={state}>{children}</AppearanceContext.Provider>
}

export function useAppearanceContext() {
  return useContext(AppearanceContext)
}

export { AppearanceContextInterface }
