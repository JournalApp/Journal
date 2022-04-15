import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'

interface AppearanceContextInterface {
  theme: 'light' | 'dark'
  fontFace: 'inter' | 'novela'
  fontSize: 'small' | 'normal' | 'large'
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

const AppearanceContext = createContext<AppearanceContextInterface | null>(null)

export function AppearanceProvider({ children }: any) {
  const [theme, setTheme] = useState<AppearanceContextInterface['theme']>('light')
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
  }

  const setFontSize = (size: AppearanceContextInterface['fontSize']) => {
    setFontSizeInternal(size)
    document.documentElement.style.setProperty('--appearance-fontSize', fontSizeMap[size] + 'px')
  }

  let state = {
    theme,
    setTheme,
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
