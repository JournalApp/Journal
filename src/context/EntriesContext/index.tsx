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
  cacheAddEntryIfNotExists,
  cacheUpdateEntry,
  cacheUpdateEntryProperty,
  cacheCreateNewEntry,
  deleteEntry,
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
  cacheCreateNewEntry: (day: string) => Promise<void>
  cacheAddEntryIfNotExists: (user_id: string, day: string) => Promise<void>
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
  rerenderEntriesWithTag: (tag_id: string) => void
  rerenderCalendar: () => Promise<void>
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

  //////////////////////////
  // Entries functions
  //////////////////////////

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

  const rerenderEntries = async () => {
    if (!!invokeRerenderEntryList.current) {
      invokeRerenderEntryList.current()
    }
  }

  const rerenderCalendar = async () => {
    if (!!invokeRerenderCalendar.current) {
      invokeRerenderCalendar.current()
    }
  }

  const rerenderEntriesAndCalendar = async () => {
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
        // TODO invoke scroll to Today from here
        // ...
        window.electronAPI.capture({
          type: 'system',
          distinctId: session.user.id,
          event: 'entry new-day-overnight',
        })
      }
    }, 1000)

    // Entires
    const syncEntriesArgs = {
      initialEntriesFetchDone,
      syncEntriesInterval,
      cacheFetchEntries,
      rerenderEntriesAndCalendar,
      rerenderEntry,
      session,
      signOut,
      getSecretKey,
    }

    syncEntriesInterval.current = setInterval(syncEntries, 5000, syncEntriesArgs)
    syncEntries(syncEntriesArgs)

    window.electronAPI.onEntryPending(() => {
      syncEntries(syncEntriesArgs)
      logger('onEntryPending()')
      if (!syncEntriesInterval.current) {
        syncEntriesInterval.current = setInterval(syncEntries, 5000, syncEntriesArgs)
        logger('interval set')
      } else {
        logger('interval not set')
        logger(syncEntriesInterval.current)
      }
    })

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
    cacheCreateNewEntry,
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
    rerenderCalendar,
  }
  return (
    <EntriesContext.Provider value={state}>{cacheFetchDone && children}</EntriesContext.Provider>
  )
}

export function useEntriesContext() {
  return useContext(EntriesContext)
}
