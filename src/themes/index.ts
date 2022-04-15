import { lightTheme } from './lightTheme'
import { baseTheme } from './baseTheme'

type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `${TKey}`>
}[keyof TObj & (string | number)]

type RecursiveKeyOfInner<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `.${TKey}`>
}[keyof TObj & (string | number)]

type RecursiveKeyOfHandleValue<TValue, Text extends string> = TValue extends any[]
  ? Text
  : TValue extends object
  ? Text | `${Text}${RecursiveKeyOfInner<TValue>}`
  : Text

type LightThemeItemKey = RecursiveKeyOf<typeof lightTheme>
type BaseThemeItemKey = RecursiveKeyOf<typeof baseTheme>

const theme = (itemKey: LightThemeItemKey | BaseThemeItemKey) => {
  const cssVar = itemKey.split('.').reduce((acc, key) => acc + '-' + key, '-')
  return `var(${cssVar})`
}

export { theme, lightTheme, baseTheme }
