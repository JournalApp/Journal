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

function arrayEquals(a: Array<number>, b: Array<number>) {
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

function createDays(year: number, month: number) {
  let mon = month - 1 // months in JS are 0..11, not 1..12
  let d = new Date(year, mon)

  let days = []

  while (d.getMonth() == mon) {
    // days.push(`${year}${month}${d.getDate()}`)
    days.push(d.getDate())
    d.setDate(d.getDate() + 1)
  }

  return days
}

const alphaToHex = (alpha: number) => {
  if (alpha < 0) alpha = 0
  if (alpha > 100) alpha = 100
  let multiplier = 255 / 100
  let val = Math.round(alpha * multiplier).toString(16)
  return val.length == 1 ? '0' + val : val
}

export { shallowEqual, arrayEquals, countWords, createCssVars, setCssVars, createDays, alphaToHex }
