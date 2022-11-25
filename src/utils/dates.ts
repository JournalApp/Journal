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

function getYearsSince(year: number) {
  let years = []
  let currentYear = new Date().getFullYear()
  while (year <= currentYear) {
    years.push(year)
    year++
  }
  return years
}

const stripeEpochToDate = (secs: number) => {
  var t = new Date('1970-01-01T00:30:00Z') // Unix epoch start.
  t.setSeconds(secs)
  return t
}

export { createDays, getYearsSince, stripeEpochToDate }
