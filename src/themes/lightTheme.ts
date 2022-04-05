const lightPalette = {
  neutral: {
    '10': '#F9F9F9', // popper
    '15': '#F3F3F3', // hover, inverted, toggle group bg
    '20': '#E9E9E9', // hover on inverted, border
    '25': '#E0E0E0', // bg
    '100': '#3A3A3A', // text
  },
}

// const baseTheme = {
//   font: {
//     main: "'Inter var'",
//   },
//   space: {
//     one: '8px',
//   },
//   animation: {
//     time: '300ms',
//   },
// }

const lightTheme = {
  color: {
    neutral: {
      // base colors
      main: lightPalette.neutral[100],
      inverted: lightPalette.neutral[15],
      border: lightPalette.neutral[20],
      surface: lightPalette.neutral[25],
      popper: lightPalette.neutral[10],

      // colors for states
      active: lightPalette.neutral[20],
      hover: lightPalette.neutral[15],
      hoverInverted: lightPalette.neutral[20],
    },
  },
  style: {
    shadow: `0px 0px 0px 4px ${lightPalette.neutral[25]}`,
  },
  font: {
    main: "'Inter var'",
  },
  space: {
    one: '8px',
  },
  animation: {
    time: {
      fast: '100ms',
      normal: '200ms',
      long: '400ms',
    },
  },
}

type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `${TKey}`>
}[keyof TObj & (string | number)]

type RecursiveKeyOfInner<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<
    TObj[TKey],
    `['${TKey}']` | `.${TKey}`
  >
}[keyof TObj & (string | number)]

type RecursiveKeyOfHandleValue<TValue, Text extends string> = TValue extends any[]
  ? Text
  : TValue extends object
  ? Text | `${Text}${RecursiveKeyOfInner<TValue>}`
  : Text

type ColorKey = RecursiveKeyOf<typeof lightTheme>

const theme = (colorKey: ColorKey) => {
  const cssVar = colorKey.split('.').reduce((acc, key) => acc + '-' + key, '-')
  return `var(${cssVar})`
}

export { theme, lightTheme }