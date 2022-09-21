import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { useUserContext } from 'context'
import { electronAPIType } from '../preload'
import { defaultContent } from 'config'
import { supabase, isUnauthorized, logger, isArrayEmpty } from 'utils'
import { PlateEditor } from '@udecode/plate'
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
  cacheCreateNewEntry: (day: string) => Promise<void>
  removeCachedDay: (day: string) => Promise<void>
  cacheAddOrUpdateEntry: electronAPIType['cache']['addOrUpdateEntry']
  cacheUpdateEntry: electronAPIType['cache']['updateEntry']
  cacheUpdateEntryProperty: electronAPIType['cache']['updateEntryProperty']
  cacheAddOrUpdateTag: electronAPIType['cache']['addOrUpdateTag']
  cacheDeleteTag: electronAPIType['cache']['deleteTag']
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
  const syncTagsInterval = useRef<NodeJS.Timeout | null>(null)
  const initialTagsFetchDone = useRef(false)
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

  //////////////////////////
  // Tags functions
  //////////////////////////

  const syncPendingDeletedTags = async () => {
    const tags = await window.electronAPI.cache.getPendingDeleteTags(session.user.id)
    if (tags.length) {
      await Promise.all(
        tags.map(async (tag: Tag) => {
          const { data, error } = await supabase
            .from<Tag>('tags')
            .delete()
            .match({ id: tag.id, user_id: tag.user_id, revision: tag.revision })
          if (error) {
            logger('Delete error:')
            logger(error)
            if (isUnauthorized(error)) signOut()
            throw new Error(error.message)
          }
          if (data == null) {
            // null usually means offline
            logger('Data == null')
            throw new Error()
          } else {
            logger('Data not null')
          }
          logger('Delete tag return data:')
          logger(data)
          if (isArrayEmpty(data)) {
            logger('Tag not deleted, check whats in supabase:')
            // Fetch this tag from supabase
            const { data: tagOnServer, error } = await supabase
              .from<Tag>('tags')
              .select()
              .match({ id: tag.id, user_id: tag.user_id })
            if (error) {
              logger('Tag fetch error:')
              logger(error)
              if (isUnauthorized(error)) signOut()
              throw new Error(error.message)
            }
            if (!tagOnServer[0]) {
              logger('This tag is not in supabase, removing from cache too')
              await window.electronAPI.cache.deleteTag(tag.id)
              // TODO trigger tags refresh
            } else {
              if (tagOnServer[0].revision != tag.revision) {
                logger('Tag revision mismatch -> reverting to supabase version')
                cacheAddOrUpdateTag(tagOnServer[0])
                // TODO trigger tags refresh
              }
            }
          } else {
            logger('Deleting tag from cache')
            await window.electronAPI.cache.deleteTag(tag.id)
          }
        })
      )
    }
  }

  // Status: DONE
  const syncPendingUpdateTags = async () => {
    const tags = await window.electronAPI.cache.getPendingUpdateTags(session.user.id)
    if (tags.length) {
      await Promise.all(
        tags.map(async (tag: Tag) => {
          const { data, error } = await supabase
            .from<Tag>('tags')
            .update({
              name: tag.name,
              color: tag.color,
              modified_at: tag.modified_at,
              revision: tag.revision + 1,
            })
            .match({ id: tag.id, user_id: tag.user_id, revision: tag.revision })
          if (error) {
            // Supabase also throws error when 0 rows updated (404)
            // hence can't throw error just yet
            if (isUnauthorized(error)) signOut()
          }
          if (!data) {
            logger('Tag not updated, check whats in supabase:')
            // Fetch this tag from supabase
            const { data: tagOnServer, error } = await supabase
              .from<Tag>('tags')
              .select()
              .match({ id: tag.id, user_id: tag.user_id })
            if (error) {
              logger('Tag fetch error:')
              logger(error)
              if (isUnauthorized(error)) signOut()
              throw new Error(error.message)
            }
            if (!tagOnServer[0]) {
              logger('This tag is not in supabase, removing from cache too')
              await window.electronAPI.cache.deleteTag(tag.id)
              // TODO trigger tags refresh
            } else {
              if (tagOnServer[0].revision != tag.revision) {
                logger('Tag revision mismatch -> reverting to supabase version')
                cacheAddOrUpdateTag(tagOnServer[0])
                // TODO trigger tags refresh
              }
            }
          } else {
            logger('Marking tag as synced')
            await cacheUpdateTagProperty({ sync_status: 'synced' }, tag.id)
          }
        })
      )
    }
  }

  // Status: DONE
  const syncPendingCreateTags = async () => {
    const tags = await window.electronAPI.cache.getPendingCreateTags(session.user.id)
    if (tags.length) {
      await Promise.all(
        tags.map(async (tag: Tag) => {
          delete tag.sync_status
          const { error } = await supabase.from<Tag>('tags').insert(tag)
          if (error) {
            logger(error)
            if (isUnauthorized(error)) signOut()
            throw new Error(error.message)
          }
          await cacheUpdateTagProperty({ sync_status: 'synced' }, tag.id)
        })
      )
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

    // Tags

    // TODO feature flag check
    syncTagsInterval.current = setInterval(syncTags, 5000)
    syncTags()

    // TODO monitor if listener is not added more than once
    // if so, remove listener in useEffect return()
    window.electronAPI.onTagPending(() => {
      logger('onTagPending()')
      if (!syncTagsInterval.current) {
        syncTagsInterval.current = setInterval(syncTags, 5000)
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

  const cacheDeleteTag = async (tag_id: string) => {
    await window.electronAPI.cache.deleteTag(tag_id)
  }

  const cacheAddOrUpdateEntryTag = async (query: EntryTag) => {
    await window.electronAPI.cache.addOrUpdateEntryTag(query)
  }

  const cacheUpdateTagProperty = async (set: any, tag_id: string) => {
    await window.electronAPI.cache.updateTagProperty(set, tag_id)
  }

  //////////////////////////
  // Tags sync
  //////////////////////////

  const syncTags = async () => {
    logger('🏃 🏃 🏃 syncTags starts')
    try {
      // SYNC TO -->
      // 1. Sync pending_update
      await syncPendingCreateTags()

      // 2. Sync pending_update + or revert and update cache
      await syncPendingUpdateTags()

      // 3. Sync pendgin_delete + or revert and update cache
      await syncPendingDeletedTags()

      // SYNC FROM <-- (only at launch)
      if (!initialTagsFetchDone.current) {
        // 1. Fetch from supabase
        let { data: tagsSupabase, error } = await supabase
          .from<Tag>('tags')
          .select()
          .eq('user_id', session.user.id)
        if (error) {
          logger(error)
          if (isUnauthorized(error)) signOut()
          throw new Error(error.message)
        }

        // 2. Delete cached tags not present in supabase. Add not present in cache
        const tagsCache = await window.electronAPI.cache.getTags(session.user.id)
        await Promise.all(
          tagsSupabase.map(async (tag) => {
            if (!tagsCache.some((t) => t.id == tag.id)) {
              logger(`+ Adding tag '${tag.name}' to cache because it's in Supabase`)
              tag.sync_status = 'synced'
              await cacheAddOrUpdateTag(tag)
            }
          })
        )

        await Promise.all(
          tagsCache.map(async (tag) => {
            if (!tagsSupabase.some((t) => t.id == tag.id)) {
              logger(`- Deleting tag '${tag.name}' from cache because it's not in Supabase`)
              await window.electronAPI.cache.deleteTag(tag.id)
            }
          })
        )

        // 3. Update local state with tags (userTags.current)
        await cacheFetchTags()

        // IN_PROGRESS
        // 4. Notify EntryTags to update state
        // ...

        logger(`initialTagsFetchDone`)
        initialTagsFetchDone.current = true
      }
      logger('✋🏻 ✋🏻 ✋🏻 syncTags stops')
      if (syncTagsInterval.current) {
        clearInterval(syncTagsInterval.current)
        syncTagsInterval.current = null
      }
    } catch (err) {
      logger(err)
    }
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
    cacheCreateNewEntry,
    removeCachedDay,
    cacheAddOrUpdateEntry,
    cacheUpdateEntry,
    cacheUpdateEntryProperty,
    cacheAddOrUpdateTag,
    cacheAddOrUpdateEntryTag,
    cacheDeleteTag,
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
