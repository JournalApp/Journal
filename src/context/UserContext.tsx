import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'

interface UserContextInterface {
  theme: 'light' | 'dark'
  fontFace: 'inter' | 'novela'
  fontSize: 'small' | 'normal' | 'large'
  getFontSizePx: () => number
  setFontSize: (size: UserContextInterface['fontSize']) => void
  getFontFaceName: () => string
  setFontFace: (size: UserContextInterface['fontFace']) => void
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

const UserContext = createContext<UserContextInterface | null>(null)

export function UserProvider({ children }: any) {
  const [user, setUser] = useState({})
  const [theme, setTheme] = useState<UserContextInterface['theme']>('light')
  const [fontFace, setFontFace] = useState<UserContextInterface['fontFace']>('inter')
  const [fontSize, setFontSize] = useState<UserContextInterface['fontSize']>('normal')

  const getFontSizePx = () => {
    return fontSizeMap[fontSize]
  }

  const getFontFaceName = () => {
    return fontFaceMap[fontFace]
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
  return <UserContext.Provider value={state}>{children}</UserContext.Provider>
}

export function useUserContext() {
  return useContext(UserContext)
}

export { UserContextInterface }
