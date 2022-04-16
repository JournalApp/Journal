import { lightTheme, darkTheme } from 'themes'

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

const getFontSize = (name: FontSize) => {
  return fontSizeMap[name] ? fontSizeMap[name] : fontSizeMap['normal']
}

const getFontFace = (name: FontFace) => {
  return fontFaceMap[name] ? fontFaceMap[name] : fontFaceMap['inter']
}

const getColorTheme = (name: ColorTheme) => {
  return colorThemeMap[name] ? colorThemeMap[name] : colorThemeMap['light']
}

export {
  getFontSize,
  getFontFace,
  getColorTheme,
  defaultUserPreferences,
  ColorTheme,
  FontSize,
  FontFace,
}
