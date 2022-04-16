import { lightTheme, darkTheme } from 'themes'
import merge from 'deepmerge'

const fontSizeMap = {
  small: 18,
  normal: 21,
  large: 23,
}

type FontSize = keyof typeof fontSizeMap

const fontFaceMap = {
  inter: 'Inter var',
  novela: 'Novela',
}

type FontFace = keyof typeof fontFaceMap

const colorThemeMap = {
  light: lightTheme,
  dark: darkTheme,
}

type ColorTheme = keyof typeof colorThemeMap

const defaultUserPreferences = {
  appearance: {
    fontSize: 'normal',
    fontFace: 'inter',
    theme: 'light',
  },
}

const baseTheme = {
  appearance: {
    fontFace: 'Inter var',
    fontSize: '21px',
  },
  animation: {
    time: {
      fast: '100ms',
      normal: '200ms',
      long: '400ms',
    },
  },
}

const getFontSize = (name: FontSize) => {
  return fontSizeMap[name] ? fontSizeMap[name] : fontSizeMap['normal']
}

const getFontFace = (name: FontFace) => {
  return fontFaceMap[name] ? fontFaceMap[name] : fontFaceMap['inter']
}

const getColorTheme = (name: ColorTheme) => {
  return colorThemeMap[name] ? colorThemeMap[name] : colorThemeMap['light']
}

const getBaseThemeWithOverrides = (overrides: any) => {
  let theme = { ...baseTheme }

  if (overrides.appearance?.fontFace) {
    theme.appearance.fontFace = getFontFace(overrides.appearance.fontFace)
  }

  if (overrides.appearance?.fontSize) {
    theme.appearance.fontSize = getFontSize(overrides.appearance.fontSize) + 'px'
  }

  return theme
}

export {
  baseTheme,
  getBaseThemeWithOverrides,
  getFontSize,
  getFontFace,
  getColorTheme,
  defaultUserPreferences,
  ColorTheme,
  FontSize,
  FontFace,
}
