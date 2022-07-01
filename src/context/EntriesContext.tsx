import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { useUserContext } from 'context'
import { electronAPIType } from '../preload'
import { defaultContent } from 'config'
import { supabase, isUnauthorized, logger } from 'utils'

interface EntriesContextInterface {
  initialCache: any
  daysCache: string[]
  setDaysCache: (days: string[]) => void
  daysWithNoContent: string[]
  setDaysWithNoContent: any // TODO better type
  cacheCreateNewEntry: (day: string) => Promise<void>
  removeCachedDay: (day: string) => Promise<void>
  setScrollToDay: (day: string) => void
  clearScrollToDay: () => void
  shouldScrollToDay: (day: string) => boolean
  cacheAddOrUpdateEntry: electronAPIType['cache']['addOrUpdateEntry']
  cacheUpdateEntry: electronAPIType['cache']['updateEntry']
  cacheUpdateEntryProperty: electronAPIType['cache']['updateEntryProperty']
}

const EntriesContext = createContext<EntriesContextInterface | null>(null)

export function EntriesProvider({ children }: any) {
  const { session, serverTimeNow, signOut } = useUserContext()
  const initialCache = useRef([])
  const scrollToDay = useRef('')
  const [initialCacheFetchDone, setInitialCacheFetchDone] = useState(false)
  const [pendingDeletedEntries, setPendingDeletedEntries] = useState(false)
  const today = useRef(dayjs().format('YYYY-MM-DD'))
  const [daysCache, setDaysCache] = useState([])
  const [daysWithNoContent, setDaysWithNoContent] = useState<string[]>([])

  useEffect(() => {
    logger('daysCache updated:')
    logger(daysCache)
  }, [daysCache])

  useEffect(() => {
    logger('daysWithNoContent updated:')
    logger(daysWithNoContent)
  }, [daysWithNoContent])

  const syncPendingDeletedEntries = async () => {
    const days = await window.electronAPI.cache.getDeletedDays(session.user.id)
    logger(`Days to delete:`)
    logger(days)
    if (days) {
      await Promise.all(
        days.map(async (day: string) => {
          // TODO check if local modified_at > server modified_at
          let { error } = await supabase
            .from('journals')
            .delete({ returning: 'minimal' })
            .match({ user_id: session.user.id, day })
          if (error) {
            logger(error)
            setPendingDeletedEntries(true)
            if (isUnauthorized(error)) signOut()
          } else {
            await window.electronAPI.cache.deleteEntry({ user_id: session.user.id, day })
          }
        })
      )
    } else {
      setPendingDeletedEntries(false)
      logger('No days to delete')
    }
  }

  useEffect(() => {
    const cacheFetch = async () => {
      const entries = await window.electronAPI.cache.getEntries(session.user.id)
      const days = await window.electronAPI.cache.getDays(session.user.id)
      initialCache.current = entries
      setDaysCache([...days])
      setInitialCacheFetchDone(true)
    }

    cacheFetch()
    syncPendingDeletedEntries()

    const hasNewDayCome = setInterval(() => {
      let realToday = dayjs().format('YYYY-MM-DD')
      if (today.current != realToday) {
        logger(`${today.current} != ${realToday}`)
        logger(`New day has come ${realToday} !!!`)
        today.current = realToday
        window.electronAPI.cache.getDays(session.user.id).then((days) => setDaysCache([...days]))
        window.electronAPI.capture({
          distinctId: session.user.id,
          event: 'entry new-day-overnight',
        })
      }
    }, 1000)

    return () => {
      clearInterval(hasNewDayCome)
    }
  }, [])

  useEffect(() => {
    if (pendingDeletedEntries) {
      setTimeout(() => {
        setPendingDeletedEntries(false)
        syncPendingDeletedEntries()
      }, 5000)
    }
  }, [pendingDeletedEntries])

  const cacheAddOrUpdateEntry = async (query: any) => {
    await window.electronAPI.cache.addOrUpdateEntry(query)
  }

  const cacheUpdateEntry = async (set: any, where: any) => {
    await window.electronAPI.cache.updateEntry(set, where)
  }

  const cacheUpdateEntryProperty = async (set: any, where: any) => {
    await window.electronAPI.cache.updateEntryProperty(set, where)
  }

  const cacheCreateNewEntry = async (day: string) => {
    let now = serverTimeNow()
    let entry = {
      user_id: session.user.id,
      day,
      created_at: now,
      modified_at: now,
      content: JSON.stringify(defaultContent) as any,
    }
    await window.electronAPI.cache.addOrUpdateEntry(entry)
    let days = await window.electronAPI.cache.getDays(session.user.id)
    entry.content = defaultContent
    initialCache.current.push(entry)
    setDaysCache([...days])
    logger(`Added day ${day}`)
  }

  const removeCachedDay = async (day: string) => {
    let user_id = session.user.id
    let { error } = await supabase
      .from('journals')
      .delete({ returning: 'minimal' })
      .match({ user_id, day })
    if (error) {
      logger(error)
      setPendingDeletedEntries(true)
      await window.electronAPI.cache.markPendingDeleteEntry({ user_id, day })
      if (isUnauthorized(error)) signOut()
    } else {
      await window.electronAPI.cache.deleteEntry({ user_id, day })
    }

    let days = await window.electronAPI.cache.getDays(user_id)
    initialCache.current = initialCache.current.filter((item) => item.day !== day)
    setDaysCache([...days])
    // setDaysCache((prev) => prev.filter((d) => d !== day))
    logger(`Removed day ${day}`)

    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'entry remove',
    })
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
    daysWithNoContent,
    setDaysWithNoContent,
    cacheCreateNewEntry,
    removeCachedDay,
    setScrollToDay,
    clearScrollToDay,
    shouldScrollToDay,
    cacheAddOrUpdateEntry,
    cacheUpdateEntry,
    cacheUpdateEntryProperty,
  }
  return (
    <EntriesContext.Provider value={state}>
      {initialCacheFetchDone && children}
    </EntriesContext.Provider>
  )
}

export function useEntriesContext() {
  return useContext(EntriesContext)
}
