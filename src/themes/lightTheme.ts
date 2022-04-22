import { alphaToHex } from 'utils'

const lightPalette = {
  neutral: {
    '10': '#F9F9F9', // popper
    '15': '#F3F3F3', // hover, inverted, toggle group bg
    '20': '#E9E9E9', // hover on inverted, border
    '25': '#E0E0E0', // bg
    '30': '#CFCFCF', // secondary surface
    '35': '#B7B7B7', // secondary hover
    '40': '#9A9A9A', // Not active toggle in Appearance toolbar
    '100': '#3A3A3A', // text
  },
}

const lightTheme = {
  color: {
    primary: {
      // base colors
      main: lightPalette.neutral[100],
      surface: lightPalette.neutral[25],
      surface0: lightPalette.neutral[25] + alphaToHex(0),
      hover: lightPalette.neutral[30],
      border: lightPalette.neutral[30],
    },
    secondary: {
      // base colors
      main: lightPalette.neutral[100],
      surface: lightPalette.neutral[30],
      // colors for states
      hover: lightPalette.neutral[35],
    },
    popper: {
      // base colors
      main: lightPalette.neutral[100],
      inverted: lightPalette.neutral[15],
      border: lightPalette.neutral[20],
      surface: lightPalette.neutral[10],

      // colors for states
      active: lightPalette.neutral[20],
      hover: lightPalette.neutral[15],
      hoverInverted: lightPalette.neutral[20],
      disabled: lightPalette.neutral[40],
    },
  },
  style: {
    shadow: `0px 0px 0px 4px ${lightPalette.neutral[25]}`,
  },
}

export { lightTheme }
