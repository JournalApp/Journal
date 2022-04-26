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

const calendarOpenMap = {
  opened: { entriesOffset: 200, miniDatesVisibility: 'visible' },
  closed: { entriesOffset: 0, miniDatesVisibility: 'hidden' },
}
type CalendarOpen = keyof typeof calendarOpenMap

const defaultUserPreferences = {
  appearance: {
    fontSize: 'normal',
    fontFace: 'inter',
    theme: 'light',
    calendarOpen: 'closed',
  },
}

const baseTheme = {
  appearance: {
    fontFace: 'Inter var',
    fontSize: '21px',
    entriesOffset: '0',
    miniDatesVisibility: 'hidden',
  },
  animation: {
    time: {
      fast: '100ms',
      normal: '200ms',
      long: '400ms',
    },
    timingFunction: {
      dynamic: 'cubic-bezier(0.31, 0.3, 0.17, 0.99)',
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

const getCalendarIsOpen = (state: CalendarOpen) => {
  return calendarOpenMap[state] ? calendarOpenMap[state] : calendarOpenMap['closed']
}

const getBaseThemeWithOverrides = (overrides: any) => {
  let theme = { ...baseTheme }

  if (overrides.appearance?.fontFace) {
    theme.appearance.fontFace = getFontFace(overrides.appearance.fontFace)
  }

  if (overrides.appearance?.fontSize) {
    theme.appearance.fontSize = getFontSize(overrides.appearance.fontSize) + 'px'
  }

  if (overrides.appearance?.calendarOpen) {
    theme.appearance.entriesOffset =
      getCalendarIsOpen(overrides.appearance.calendarOpen).entriesOffset + 'px'
    theme.appearance.miniDatesVisibility = getCalendarIsOpen(
      overrides.appearance.calendarOpen
    ).miniDatesVisibility
  }

  return theme
}

export {
  baseTheme,
  getBaseThemeWithOverrides,
  getFontSize,
  getFontFace,
  getColorTheme,
  getCalendarIsOpen,
  defaultUserPreferences,
  ColorTheme,
  FontSize,
  FontFace,
  CalendarOpen,
}
