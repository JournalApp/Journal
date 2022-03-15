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

export { shallowEqual, countWords }
