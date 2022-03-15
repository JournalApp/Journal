import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'

interface EntriesContextInterface {
  initialCache: any
  indexCache: any
  getEntry: any
  getAllEntries: any
  setEntry: any
  setIndexes: any
}

const EntriesContext = createContext<EntriesContextInterface | null>(null)

export function EntriesProvider({ children }: any) {
  const initialCache = useRef(window.electronAPI.storeEntries.getAll() || [])
  const indexCache = useRef(window.electronAPI.storeIndex.get('EntriesIDs') || [])

  useEffect(() => {
    let today = dayjs().format('YYYYMMDD') //20220307
    let todayExists = indexCache.current.some((el: any) => {
      return el.day == today
    })
    console.log(`Today exists? ${todayExists}`)
    // TODO if Today does not exist, what next?
  }, [])

  const getEntry = (property: string) => {
    return window.electronAPI.storeEntries.get(property)
  }

  const getAllEntries = (property: string) => {
    return window.electronAPI.storeEntries.getAll()
  }

  const setEntry = (property: string, value: any) => {
    window.electronAPI.storeEntries.set(property, value)
    initialCache.current[property] = value
    console.log('Entry set!')
  }

  const setIndexes = (value: any) => {
    window.electronAPI.storeIndex.set('EntriesIDs', value)
    indexCache.current['EntriesIDs'] = value
    console.log('Indexes set!')
  }

  let state = {
    initialCache,
    indexCache,
    getEntry,
    getAllEntries,
    setEntry,
    setIndexes,
  }
  return <EntriesContext.Provider value={state}>{children}</EntriesContext.Provider>
}

export function useEntriesContext() {
  return useContext(EntriesContext)
}
