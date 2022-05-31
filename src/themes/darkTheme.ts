import { alphaToHex } from 'utils'

const darkPalette = {
  neutral: {
    '10': '#3A3A3A', // popper
    '15': '#464646', // hover, inverted, toggle group bg
    '20': '#4C4C4C', // hover on inverted, border
    '25': '#252525', // bg
    '30': '#383838', // secondary surface
    '35': '#4A4A4A', // secondary hover
    '40': '#8F8F8F', // Not active toggle in Appearance toolbar
    '100': '#E3E3E3', // text
  },
  red: {
    '100': '#FF5B5B',
  },
}

const darkTheme = {
  color: {
    primary: {
      // base colors
      main: darkPalette.neutral[100],
      surface: darkPalette.neutral[25],
      get surface0() {
        return this.surface + alphaToHex(0)
      },
      hover: darkPalette.neutral[30],
      border: darkPalette.neutral[30],
    },
    secondary: {
      // base colors
      main: darkPalette.neutral[100],
      surface: darkPalette.neutral[30],
      // colors for states
      hover: darkPalette.neutral[35],
    },
    popper: {
      // base colors
      main: darkPalette.neutral[100],
      inverted: darkPalette.neutral[15],
      border: darkPalette.neutral[20],
      surface: darkPalette.neutral[10],

      // colors for states
      active: darkPalette.neutral[20],
      hover: darkPalette.neutral[15],
      hoverInverted: darkPalette.neutral[20],
      disabled: darkPalette.neutral[40],
    },
    error: {
      main: darkPalette.red[100],
    },
  },
  style: {
    shadow: `0px 0px 0px 4px ${darkPalette.neutral[25]}`,
  },
}

export { darkTheme }
