import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { useUserContext } from 'context'
import { electronAPIType } from '../../preload'
import { defaultContent } from 'config'
import { supabase, isUnauthorized, logger, isArrayEmpty } from 'utils'
import { PlateEditor } from '@udecode/plate'
import type { Tag, EntryTag } from '../../components/EntryTags/types'
import type { Day, Entry } from '../../components/Entry/types'
import {
  syncEntries,
  cacheAddOrUpdateEntry,
  cacheUpdateEntry,
  cacheUpdateEntryProperty,
} from './entries'
import {
  cacheAddOrUpdateTag,
  cacheDeleteTag,
  cacheUpdateTagProperty,
  cacheAddOrUpdateEntryTag,
  cacheUpdateEntryTagProperty,
  syncTags,
} from './tags'

interface EntriesContextInterface {
  userEntries: React.MutableRefObject<Entry[]>
  userTags: React.MutableRefObject<Tag[]>
  userEntryTags: React.MutableRefObject<EntryTag[]>
  cacheAddEntryIfNotExists: (day: string) => Promise<void>
  deleteEntry: (day: string) => Promise<void>
  cacheAddOrUpdateEntry: electronAPIType['cache']['addOrUpdateEntry']
  cacheUpdateEntry: electronAPIType['cache']['updateEntry']
  cacheUpdateEntryProperty: electronAPIType['cache']['updateEntryProperty']
  cacheAddOrUpdateTag: electronAPIType['cache']['addOrUpdateTag']
  cacheUpdateTagProperty: electronAPIType['cache']['updateTagProperty']
  cacheDeleteTag: electronAPIType['cache']['deleteTag']
  cacheAddOrUpdateEntryTag: electronAPIType['cache']['addOrUpdateEntryTag']
  cacheUpdateEntryTagProperty: electronAPIType['cache']['updateEntryTagProperty']
  invokeRerenderEntryList: React.MutableRefObject<any>
  invokeRerenderCalendar: React.MutableRefObject<any>
  invokeRerenderEntry: React.MutableRefObject<any>
  invokeForceSaveEntry: React.MutableRefObject<any>
  invokeRerenderEntryTags: React.MutableRefObject<any>
  editorsRef: any
  rerenderEntriesAndCalendar: () => void
  rerenderEntriesWithTag: (tag_id: string) => void
  rerenderCalendar: () => void
}

const EntriesContext = createContext<EntriesContextInterface | null>(null)

export function EntriesProvider({ children }: any) {
  const { session, serverTimeNow, signOut, getSecretKey } = useUserContext()
  const [cacheFetchDone, setCacheFetchDone] = useState(false)
  const today = useRef<Day>(dayjs().format('YYYY-MM-DD') as Day)
  const editorsRef = useRef<Array<PlateEditor | null>>([])
  const invokeRerenderCalendar = useRef<any | null>({})

  // Entries
  const userEntries = useRef<Entry[]>([])
  const invokeRerenderEntryList = useRef<any | null>({})
  const invokeRerenderEntryTags = useRef<any | null>({})
  const invokeRerenderEntry = useRef<any | null>({})
  const invokeForceSaveEntry = useRef<any | null>({})
  const initialEntriesFetchDone = useRef(false)
  const syncEntriesInterval = useRef<NodeJS.Timeout | null>(null)

  // Tags
  const userTags = useRef<Tag[]>([])
  const syncTagsInterval = useRef<NodeJS.Timeout | null>(null)
  const initialTagsFetchDone = useRef(false)

  // EntryTags
  const userEntryTags = useRef<EntryTag[]>([])
  const initialEntryTagsFetchDone = useRef(false)

  logger('EntriesContext render')

  //////////////////////////
  // Entries functions
  //////////////////////////

  const cacheAddEntryIfNotExists = async (day: string) => {
    const exists = await window.electronAPI.cache.doesEntryExist(session.user.id, day)
    if (!exists) {
      logger(`Day ${day} doesnt exist, creating...`)
      await invokeForceSaveEntry.current[day]()
    } else {
      logger(`Day already ${day} exists`)
    }
  }

  const deleteEntry = async (day: string) => {
    logger(`Removing day ${day}`)
    const i = userEntries.current.findIndex((e) => e.day == day)
    userEntries.current.splice(i, 1)
    rerenderEntriesAndCalendar()
    cacheUpdateEntryProperty({ sync_status: 'pending_delete' }, { user_id: session.user.id, day })
  }

  const rerenderEntriesWithTag = async (tag_id: string) => {
    const days = await window.electronAPI.cache.getDaysWithTag(tag_id)
    days.map((day) => {
      if (!!invokeRerenderEntryTags.current[day]) {
        invokeRerenderEntryTags.current[day]()
      }
    })
  }

  const rerenderEntry = (day: Day) => {
    if (!!invokeRerenderEntry.current[day]) {
      invokeRerenderEntry.current[day]()
    }
  }

  const rerenderEntries = () => {
    if (!!invokeRerenderEntryList.current) {
      invokeRerenderEntryList.current()
    }
  }

  const rerenderCalendar = () => {
    if (!!invokeRerenderCalendar.current) {
      invokeRerenderCalendar.current()
    }
  }

  const rerenderEntriesAndCalendar = () => {
    rerenderEntries()
    rerenderCalendar()
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
    userEntries.current = entries
  }

  const forceSyncTags = () => {
    initialTagsFetchDone.current = false
    initialEntryTagsFetchDone.current = false
    onTagPending()
  }

  // Entries
  const syncEntriesArgs = {
    initialEntriesFetchDone,
    syncEntriesInterval,
    cacheFetchEntries,
    rerenderEntriesAndCalendar,
    rerenderEntry,
    forceSyncTags,
    cacheFetchEntryTags,
    session,
    signOut,
    getSecretKey,
  }
  // Handeler for SQLite trigger
  const onEntryPending = () => {
    syncEntries(syncEntriesArgs)
    logger('onEntryPending()')
    if (!syncEntriesInterval.current) {
      syncEntriesInterval.current = setInterval(syncEntries, 5000, syncEntriesArgs)
      logger('interval set')
    } else {
      logger('interval not set')
      logger(syncEntriesInterval.current)
    }
  }

  // Tags
  const syncTagsArgs = {
    initialTagsFetchDone,
    initialEntryTagsFetchDone,
    invokeRerenderEntryTags,
    userTags,
    cacheFetchTags,
    cacheFetchEntryTags,
    syncTagsInterval,
    session,
    signOut,
  }
  // Handeler for SQLite trigger
  const onTagPending = () => {
    logger('onTagPending()')
    if (!syncTagsInterval.current) {
      syncTagsInterval.current = setInterval(syncTags, 5000, syncTagsArgs)
      logger('interval set')
    } else {
      logger('interval not set')
      logger(syncTagsInterval.current)
    }
  }

  //////////////////////////
  // ⛰ useEffect on mount
  //////////////////////////

  useEffect(() => {
    const cacheFetchAll = async () => {
      await cacheFetchTags()
      await cacheFetchEntryTags()
      await cacheFetchEntries()
      setCacheFetchDone(true)
      rerenderEntriesAndCalendar()
    }

    cacheFetchAll()

    const hasNewDayCome = setInterval(() => {
      let realToday = dayjs().format('YYYY-MM-DD') as Day
      if (today.current != realToday) {
        logger(`New day has come ${realToday} !!!`)
        today.current = realToday
        rerenderEntriesAndCalendar()
        window.electronAPI.capture({
          type: 'system',
          distinctId: session.user.id,
          event: 'entry new-day-overnight',
        })
      }
    }, 1000)

    // Sync Entires on mount
    syncEntriesInterval.current = setInterval(syncEntries, 5000, syncEntriesArgs)
    syncEntries(syncEntriesArgs)
    // Set handeler for SQLite trigger
    window.electronAPI.onEntryPending(onEntryPending)

    // Sync Tags on mount
    syncTagsInterval.current = setInterval(syncTags, 5000, syncTagsArgs)
    syncTags(syncTagsArgs)
    // Set handeler for SQLite trigger
    window.electronAPI.onTagPending(onTagPending)

    return () => {
      clearInterval(hasNewDayCome)
      if (syncEntriesInterval.current) {
        clearInterval(syncEntriesInterval.current)
        syncEntriesInterval.current = null
      }
      if (syncTagsInterval.current) {
        clearInterval(syncTagsInterval.current)
        syncTagsInterval.current = null
      }
    }
  }, [])

  let state = {
    userEntries,
    userTags,
    userEntryTags,
    cacheAddEntryIfNotExists,
    deleteEntry,
    cacheAddOrUpdateEntry,
    cacheUpdateEntry,
    cacheUpdateEntryProperty,
    cacheAddOrUpdateTag,
    cacheUpdateTagProperty,
    cacheAddOrUpdateEntryTag,
    cacheDeleteTag,
    cacheUpdateEntryTagProperty,
    invokeRerenderEntryList,
    invokeRerenderEntry,
    invokeRerenderCalendar,
    invokeRerenderEntryTags,
    invokeForceSaveEntry,
    editorsRef,
    rerenderEntriesWithTag,
    rerenderEntriesAndCalendar,
    rerenderCalendar,
  }
  return (
    <EntriesContext.Provider value={state}>{cacheFetchDone && children}</EntriesContext.Provider>
  )
}

export function useEntriesContext() {
  return useContext(EntriesContext)
}
