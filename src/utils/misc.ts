import type { PostgrestError } from '@supabase/supabase-js'
import { getNodeString } from '@udecode/plate'

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

function isArrayEmpty(a: any[]) {
  return Array.isArray(a) && !a.length
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

const countEntryWords = (content: object[]) => {
  if (Array.isArray(content)) {
    return countWords(content.map((n: any) => getNodeString(n)).join(' '))
  } else {
    return 0
  }
}

const entryHasNoContent = (content: any[]) => {
  return content.some((n: any) => !getNodeString(n))
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

function isUniqueViolation(error: PostgrestError) {
  if (error.code == '23505') {
    return true
  } else {
    return false
  }
}

function isForeignKeyViolation(error: PostgrestError) {
  if (error.code == '23503') {
    return true
  } else {
    return false
  }
}

function randomInt(max: number) {
  // max number (exclusive)
  // e.g. max=3 -> 0,1,2
  return (max * Math.random()) << 0
}

const awaitTimeout = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))

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
  isUniqueViolation,
  isForeignKeyViolation,
  randomInt,
  isArrayEmpty,
  entryHasNoContent,
  countEntryWords,
  awaitTimeout,
}
