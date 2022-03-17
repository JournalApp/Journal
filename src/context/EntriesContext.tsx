import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

interface EntriesContextInterface {
  initialCache: any
  daysCache: any
  getCachedEntry: any
  getAllCachedEntries: any
  setCachedEntry: any
  setCachedDays: any
}

const EntriesContext = createContext<EntriesContextInterface | null>(null)

const daysKey = 'Days'

export function EntriesProvider({ children }: any) {
  const initialCache = useRef(window.electronAPI.storeEntries.getAll() || [])
  const daysCache = useRef(window.electronAPI.storeIndex.get() || [])

  const getCachedEntry = (property: string) => {
    return window.electronAPI.storeEntries.get(property)
  }

  const getAllCachedEntries = (property: string) => {
    return window.electronAPI.storeEntries.getAll()
  }

  const setCachedEntry = (property: string, value: any) => {
    window.electronAPI.storeEntries.set(property, value)
    initialCache.current[property] = value
    console.log('Entry set!')
  }

  const setCachedDays = (value: any) => {
    window.electronAPI.storeIndex.set(value)
    // TODO does it work?:
    daysCache.current = value
    console.log('Indexes set!')
  }

  let state = {
    initialCache,
    daysCache,
    getCachedEntry,
    getAllCachedEntries,
    setCachedEntry,
    setCachedDays,
  }
  return <EntriesContext.Provider value={state}>{children}</EntriesContext.Provider>
}

export function useEntriesContext() {
  return useContext(EntriesContext)
}
