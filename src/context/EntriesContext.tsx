import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'

interface EntriesContextInterface {
  initialCache: any
  daysCache: any
  setDaysCache: (days: String[]) => void
  getCachedEntry: any
  getAllCachedEntries: any
  setCachedEntry: (property: string, value: any) => void
  setAllCachedDays: (value: any) => void
  addCachedDay: (day: string) => void
  setScrollToDay: (day: string) => void
  clearScrollToDay: () => void
  shouldScrollToDay: (day: string) => boolean
}

const EntriesContext = createContext<EntriesContextInterface | null>(null)

export function EntriesProvider({ children }: any) {
  const initialCache = useRef(window.electronAPI.storeEntries.getAll() || [])
  const scrollToDay = useRef('')
  const today = useRef(dayjs().format('YYYYMMDD'))
  const [daysCache, setDaysCache] = useState(window.electronAPI.storeIndex.getAll() || [])

  useEffect(() => {
    const hasNewDayCome = setInterval(() => {
      let realToday = dayjs().format('YYYYMMDD')
      if (today.current != realToday) {
        console.log(`${today.current} != ${realToday}`)
        console.log(`New day has come ${realToday} !!!`)
        today.current = realToday
        addCachedDay(realToday)
      }
    }, 1000)

    return () => {
      clearInterval(hasNewDayCome)
    }
  }, [])

  const getCachedEntry = (property: string) => {
    return window.electronAPI.storeEntries.get(property)
  }

  const getAllCachedEntries = (property: string) => {
    return window.electronAPI.storeEntries.getAll()
  }

  const setCachedEntry = (property: string, value: any) => {
    window.electronAPI.storeEntries.set(property, value)
    console.log('Entry set!')
  }

  const setAllCachedDays = (value: any) => {
    window.electronAPI.storeIndex.setAll(value)
    setDaysCache([...value])
    console.log('Indexes set!')
  }

  const addCachedDay = (day: string) => {
    let days = window.electronAPI.storeIndex.add(day)
    // console.log(days)
    setDaysCache([...days])
    console.log(`Added day ${day}`)
  }

  const setScrollToDay = (day: string) => {
    scrollToDay.current = day
  }

  const shouldScrollToDay = (day: string) => {
    return scrollToDay.current == day
  }

  const clearScrollToDay = () => {
    scrollToDay.current = ''
  }

  let state = {
    initialCache,
    daysCache,
    setDaysCache,
    getCachedEntry,
    getAllCachedEntries,
    setCachedEntry,
    setAllCachedDays,
    addCachedDay,
    setScrollToDay,
    clearScrollToDay,
    shouldScrollToDay,
  }
  return <EntriesContext.Provider value={state}>{children}</EntriesContext.Provider>
}

export function useEntriesContext() {
  return useContext(EntriesContext)
}
