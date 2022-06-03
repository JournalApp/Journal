import type { PostgrestError } from '@supabase/supabase-js'

function shallowEqual(object1: any, object2: any) {
  const keys1 = Object.keys(object1)
  const keys2 = Object.keys(object2)
  if (keys1.length !== keys2.length) {
    return false
  }
  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false
    }
  }
  return true
}

function arrayEquals(a: Array<string>, b: Array<string>) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  )
}

const countWords = (text: any) => {
  let res = []
  let str = text.replace(/[\t\n\r\.\?\!]/gm, ' ').split(' ')
  str.map((s: any) => {
    let trimStr = s.trim()
    if (trimStr.length > 0) {
      res.push(trimStr)
    }
  })
  return res.length
}

const setCssVars = (items: any, prefix = '-'): void => {
  Object.entries(items).flatMap(([key, value]: any) => {
    const varName = `${prefix}-${key}`
    if (typeof value === 'object') {
      setCssVars(value, varName)
    } else {
      document.documentElement.style.setProperty(varName, value)
    }
  })
}

const createCssVar = (items: [string], prefix = '-'): string[] =>
  Object.entries(items).flatMap(([key, value]: any) => {
    const varName = `${prefix}-${key}`
    if (typeof value === 'object') return createCssVar(value, varName)
    return `${varName}:${value}`
  })

const createCssVars = (themeColors: any) => createCssVar(themeColors).join(';')

const alphaToHex = (alpha: number) => {
  if (alpha < 0) alpha = 0
  if (alpha > 100) alpha = 100
  let multiplier = 255 / 100
  let val = Math.round(alpha * multiplier).toString(16)
  return val.length == 1 ? '0' + val : val
}

function ordinal(n: number) {
  var s = ['th', 'st', 'nd', 'rd']
  var v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function isDev() {
  return process.env.NODE_ENV == 'development'
}

function isUnauthorized(error: PostgrestError) {
  if (error.message == 'JWT expired' || error.code == '42501') {
    return true
  } else {
    return false
  }
}

export {
  shallowEqual,
  arrayEquals,
  countWords,
  createCssVars,
  setCssVars,
  alphaToHex,
  ordinal,
  isDev,
  isUnauthorized,
}
