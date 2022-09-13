import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { useUserContext } from 'context'
import { electronAPIType } from '../preload'
import { defaultContent } from 'config'
import { supabase, isUnauthorized, logger } from 'utils'
import { PlateEditor } from '@udecode/plate'
import { Entry } from 'components'

import type { Tag, EntryTag } from '../components/EntryTags/types'

interface EntriesContextInterface {
  initialCache: any
  initialDaysCache: any
  userTags: React.MutableRefObject<Tag[]>
  setDaysCache: (days: string[]) => void
  setDaysCacheEntriesList: any // TODO better type
  setDaysCacheCalendar: any // TODO better type
  setDaysCacheStreak: any // TODO better type
  setDaysWithNoContent: any // TODO better type
  syncPendingDeletedTags: (serverTags: Tag[]) => Promise<void>
  cacheCreateNewEntry: (day: string) => Promise<void>
  removeCachedDay: (day: string) => Promise<void>
  cacheAddOrUpdateEntry: electronAPIType['cache']['addOrUpdateEntry']
  cacheUpdateEntry: electronAPIType['cache']['updateEntry']
  cacheUpdateEntryProperty: electronAPIType['cache']['updateEntryProperty']
  cacheAddOrUpdateTag: electronAPIType['cache']['addOrUpdateTag']
  cacheAddOrUpdateEntryTag: electronAPIType['cache']['addOrUpdateEntryTag']
  editorsRef: any
}

const EntriesContext = createContext<EntriesContextInterface | null>(null)

export function EntriesProvider({ children }: any) {
  const { session, serverTimeNow, signOut } = useUserContext()
  const initialCache = useRef([])
  const initialDaysCache = useRef([])
  const userTags = useRef<Tag[]>([])
  const [initialCacheFetchDone, setInitialCacheFetchDone] = useState(false)
  const pendingDeletedEntries = useRef(false)
  const pendingDeletedEntriesInterval = useRef<NodeJS.Timeout | null>(null)
  const pendingDeletedTags = useRef(false)
  const pendingDeletedTagsInterval = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdateTags = useRef(false)
  const pendingUpdateTagsInterval = useRef<NodeJS.Timeout | null>(null)
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

  const setPendingDeletedTags = (setAs: boolean) => {
    logger(`setPendingDeletedTags -> ${setAs}`)
    pendingDeletedTags.current = setAs
    if (setAs == true) {
      if (!pendingDeletedTagsInterval.current) {
        pendingDeletedTagsInterval.current = setInterval(syncPendingDeletedTags, 5000)
      }
    }
    if (setAs == false) {
      if (pendingDeletedTagsInterval.current) {
        clearInterval(pendingDeletedTagsInterval.current)
        pendingDeletedTagsInterval.current = null
      }
    }
  }

  const syncPendingDeletedTags = async (serverTags: Tag[]) => {
    const tags = await window.electronAPI.cache.getDeletedTags(session.user.id)
    logger(`Tags to delete:`)
    logger(tags)
    if (tags.length) {
      await Promise.all(
        tags.map(async (tag: Tag) => {
          let serverTag = serverTags.find((t) => t.id == tag.id)
          if (tag.revision >= serverTag?.revision) {
            // Check if user had current revision when trying to delete tag
            let { error } = await supabase
              .from('tags')
              .delete({ returning: 'minimal' })
              .match({ id: tag.id })
            if (error) {
              logger(error)
              setPendingDeletedTags(true)
              if (isUnauthorized(error)) signOut()
            } else {
              logger(`Deleting: ${tag.name}`)
              await window.electronAPI.cache.deleteTag(tag.id)
            }
          } else {
            // Revert, user tried to delete tag while its newer revision was in supabase
            logger(`Reverting deletion of: ${tag.name}`)
            await cacheAddOrUpdateTag(serverTag)
            await cacheUpdateTagProperty({ sync_status: 'synced' }, tag.id)
            await cacheFetchTags()
          }
        })
      )
    } else {
      setPendingDeletedTags(false)
      logger('No tags to delete')
    }
  }

  const cacheFetchTags = async () => {
    const tags = await window.electronAPI.cache.getTags(session.user.id)
    userTags.current = tags
    logger('Cached Tags:')
    logger(tags)
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

    // TODO monifor if listener is not added more than once
    // if so, remove listener in useEffect return()
    window.electronAPI.onTagUpdated((event: any, tag: Tag) => {
      syncTag('updated', tag)
    })

    return () => {
      clearInterval(hasNewDayCome)
      if (pendingDeletedEntriesInterval.current) {
        clearInterval(pendingDeletedEntriesInterval.current)
      }
    }
  }, [])

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

  const cacheAddOrUpdateTag = async (query: Tag) => {
    await window.electronAPI.cache.addOrUpdateTag(query)
  }

  const cacheAddOrUpdateEntryTag = async (query: EntryTag) => {
    await window.electronAPI.cache.addOrUpdateEntryTag(query)
  }

  const cacheUpdateTagProperty = async (set: any, tag_id: string) => {
    await window.electronAPI.cache.updateTagProperty(set, tag_id)
  }

  const syncTag = (action: 'updated' | 'inserted' | 'deleted', tag: Tag) => {
    logger(`tag ${tag.id} ${action}`)
  }

  let state = {
    initialCache,
    initialDaysCache,
    userTags,
    setDaysCache,
    setDaysCacheEntriesList,
    setDaysCacheCalendar,
    setDaysCacheStreak,
    setDaysWithNoContent,
    syncPendingDeletedTags,
    cacheCreateNewEntry,
    removeCachedDay,
    cacheAddOrUpdateEntry,
    cacheUpdateEntry,
    cacheUpdateEntryProperty,
    cacheAddOrUpdateTag,
    cacheAddOrUpdateEntryTag,
    editorsRef,
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
