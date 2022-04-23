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

export { createDays, getYearsSince }
