import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { useUserContext } from 'context'
import { electronAPIType } from '../../preload'
import { defaultContent } from 'config'
import { supabase, isUnauthorized, logger, isArrayEmpty } from 'utils'
import { PlateEditor } from '@udecode/plate'
import type { Tag, EntryTag } from '../../components/EntryTags/types'

import {
  cacheAddOrUpdateTag,
  cacheDeleteTag,
  cacheUpdateTagProperty,
  cacheAddOrUpdateEntryTag,
  cacheUpdateEntryTagProperty,
  syncTags,
} from './syncTags'

interface EntriesContextInterface {
  initialCache: any
  initialDaysCache: any
  userTags: React.MutableRefObject<Tag[]>
  userEntryTags: React.MutableRefObject<EntryTag[]>
  setDaysCache: (days: string[]) => void
  setDaysCacheEntriesList: any // TODO better type
  setDaysCacheCalendar: any // TODO better type
  setDaysCacheStreak: any // TODO better type
  setDaysWithNoContent: any // TODO better type
  cacheCreateNewEntry: (day: string) => Promise<void>
  cacheAddEntryIfNotExists: (user_id: string, day: string) => Promise<void>
  removeCachedDay: (day: string) => Promise<void>
  cacheAddOrUpdateEntry: electronAPIType['cache']['addOrUpdateEntry']
  cacheUpdateEntry: electronAPIType['cache']['updateEntry']
  cacheUpdateEntryProperty: electronAPIType['cache']['updateEntryProperty']
  cacheAddOrUpdateTag: electronAPIType['cache']['addOrUpdateTag']
  cacheUpdateTagProperty: electronAPIType['cache']['updateTagProperty']
  cacheDeleteTag: electronAPIType['cache']['deleteTag']
  cacheAddOrUpdateEntryTag: electronAPIType['cache']['addOrUpdateEntryTag']
  cacheUpdateEntryTagProperty: electronAPIType['cache']['updateEntryTagProperty']
  invokeForceSaveEntry: React.MutableRefObject<any>
  invokeEntriesTagsInitialFetch: React.MutableRefObject<any>
  editorsRef: any
  triggerRerenderEntriesWithTag: (tag_id: string) => void
}

const EntriesContext = createContext<EntriesContextInterface | null>(null)

export function EntriesProvider({ children }: any) {
  const { session, serverTimeNow, signOut } = useUserContext()
  const initialCache = useRef([])
  const initialDaysCache = useRef([])
  const invokeForceSaveEntry = useRef<any | null>({})
  const invokeEntriesTagsInitialFetch = useRef<any | null>({})
  const userTags = useRef<Tag[]>([])
  const userEntryTags = useRef<EntryTag[]>([])
  const [initialCacheFetchDone, setInitialCacheFetchDone] = useState(false)
  const pendingDeletedEntries = useRef(false)
  const pendingDeletedEntriesInterval = useRef<NodeJS.Timeout | null>(null)
  const syncTagsInterval = useRef<NodeJS.Timeout | null>(null)
  const initialTagsFetchDone = useRef(false)
  const initialEntryTagsFetchDone = useRef(false)
  const today = useRef(dayjs().format('YYYY-MM-DD'))
  const setDaysCacheEntriesList = useRef(null)
  const setDaysCacheCalendar = useRef(null)
  const setDaysCacheStreak = useRef<Array<any | null>>([])
  const setDaysWithNoContent = useRef(null)
  const editorsRef = useRef<Array<PlateEditor | null>>([])

  const setDaysCache = (days: any) => {
    initialDaysCache.current = days
    if (setDaysCacheEntriesList.current) {
      logger(`invoking setDaysCacheEntriesList.current`)
      setDaysCacheEntriesList.current(days)
    } else {
      logger(`no setDaysCacheEntriesList in ref yet`)
    }
    if (setDaysCacheCalendar.current) {
      logger(`invoking setDaysCacheCalendar.current`)
      setDaysCacheCalendar.current(days)
    } else {
      logger(`no setDaysCacheCalendar in ref yet`)
    }
    setTimeout(() => {
      days.forEach((day: any, i: number) => {
        if (setDaysCacheStreak.current[day]) {
          setDaysCacheStreak.current[day](i + 1)
        }
      })
    }, 5000)
  }

  //////////////////////////
  // Entries functions
  //////////////////////////

  const setPendingDeletedEntries = (setAs: boolean) => {
    logger(`setPendingDeletedEntries -> ${setAs}`)
    pendingDeletedEntries.current = setAs
    if (setAs == true) {
      if (!pendingDeletedEntriesInterval.current) {
        pendingDeletedEntriesInterval.current = setInterval(syncPendingDeletedEntries, 5000)
      }
    }
    if (setAs == false) {
      if (pendingDeletedEntriesInterval.current) {
        clearInterval(pendingDeletedEntriesInterval.current)
        pendingDeletedEntriesInterval.current = null
      }
    }
  }

  const syncPendingDeletedEntries = async () => {
    const days = await window.electronAPI.cache.getDeletedDays(session.user.id)
    logger(`Days to delete:`)
    logger(days)
    if (days.length) {
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

  const triggerRerenderEntriesWithTag = async (tag_id: string) => {
    const days = await window.electronAPI.cache.getDaysWithTag(tag_id)
    days.map((day) => {
      if (!!invokeEntriesTagsInitialFetch.current[day]) {
        invokeEntriesTagsInitialFetch.current[day]()
      }
    })
  }

  const cacheFetchTags = async () => {
    const tags = await window.electronAPI.cache.getTags(session.user.id)
    userTags.current = tags
    logger('Cached Tags:')
    logger(tags)
  }

  const cacheFetchEntryTags = async () => {
    const cachedEntryTags = await window.electronAPI.cache.getEntryTags(session.user.id)
    userEntryTags.current = cachedEntryTags
  }

  const cacheFetchEntries = async () => {
    const entries = await window.electronAPI.cache.getEntries(session.user.id)
    initialCache.current = entries
  }

  const cacheFetchDays = async () => {
    const days = await window.electronAPI.cache.getDays(session.user.id)
    initialDaysCache.current = days
    setInitialCacheFetchDone(true) // Fires render of EntryList
    setDaysCache([...days])
  }

  useEffect(() => {
    const cacheFetchAll = async () => {
      await cacheFetchTags()
      await cacheFetchEntryTags()
      await cacheFetchEntries()
      await cacheFetchDays()
    }

    cacheFetchAll()
    syncPendingDeletedEntries()

    const hasNewDayCome = setInterval(() => {
      let realToday = dayjs().format('YYYY-MM-DD')
      if (today.current != realToday) {
        logger(`${today.current} != ${realToday}`)
        logger(`New day has come ${realToday} !!!`)
        today.current = realToday
        window.electronAPI.cache.getDays(session.user.id).then((days) => setDaysCache([...days]))
        window.electronAPI.capture({
          type: 'system',
          distinctId: session.user.id,
          event: 'entry new-day-overnight',
        })
      }
    }, 1000)

    // Tags

    const syncTagsArgs = {
      initialTagsFetchDone,
      initialEntryTagsFetchDone,
      invokeEntriesTagsInitialFetch,
      userTags,
      cacheFetchTags,
      cacheFetchEntryTags,
      syncTagsInterval,
      session,
      signOut,
    }
    // TODO feature flag check
    syncTagsInterval.current = setInterval(syncTags, 5000, syncTagsArgs)
    syncTags(syncTagsArgs)

    // TODO monitor if listener is not added more than once
    // if so, remove listener in useEffect return()
    window.electronAPI.onTagPending(() => {
      logger('onTagPending()')
      if (!syncTagsInterval.current) {
        syncTagsInterval.current = setInterval(syncTags, 5000, syncTagsArgs)
        logger('interval set')
      } else {
        logger('interval not set')
        logger(syncTagsInterval.current)
      }
    })

    return () => {
      clearInterval(hasNewDayCome)
      if (pendingDeletedEntriesInterval.current) {
        clearInterval(pendingDeletedEntriesInterval.current)
        pendingDeletedEntriesInterval.current = null
      }
      if (syncTagsInterval.current) {
        clearInterval(syncTagsInterval.current)
        syncTagsInterval.current = null
      }
    }
  }, [])

  const cacheAddOrUpdateEntry = async (query: any) => {
    await window.electronAPI.cache.addOrUpdateEntry(query)
  }

  const cacheAddEntryIfNotExists = async (user_id: string, day: string) => {
    const exists = await window.electronAPI.cache.doesEntryExist(user_id, day)
    if (!exists) {
      logger(`Day ${day} doesnt exist, creating...`)
      await invokeForceSaveEntry.current[day]()
    } else {
      logger(`Day already ${day} exists`)
    }
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

    // Remove entryTags associated with this day
    const entryTagsToDelete = await window.electronAPI.cache.getEntryTagsOnDay(user_id, day)
    Promise.all(
      entryTagsToDelete.map(async (et) => {
        await window.electronAPI.cache.deleteEntryTag(user_id, et.tag_id, day)
      })
    )
    await cacheFetchEntryTags()

    let days = await window.electronAPI.cache.getDays(user_id)
    initialCache.current = initialCache.current.filter((item) => item.day !== day)
    setDaysCache([...days])
    logger(`Removed day ${day}`)

    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'entry remove',
    })
  }

  let state = {
    initialCache,
    initialDaysCache,
    userTags,
    userEntryTags,
    setDaysCache,
    setDaysCacheEntriesList,
    setDaysCacheCalendar,
    setDaysCacheStreak,
    setDaysWithNoContent,
    cacheCreateNewEntry,
    cacheAddEntryIfNotExists,
    removeCachedDay,
    cacheAddOrUpdateEntry,
    cacheUpdateEntry,
    cacheUpdateEntryProperty,
    cacheAddOrUpdateTag,
    cacheUpdateTagProperty,
    cacheAddOrUpdateEntryTag,
    cacheDeleteTag,
    cacheUpdateEntryTagProperty,
    invokeForceSaveEntry,
    invokeEntriesTagsInitialFetch,
    editorsRef,
    triggerRerenderEntriesWithTag,
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
