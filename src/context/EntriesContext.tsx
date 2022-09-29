import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { useUserContext } from 'context'
import { electronAPIType } from '../preload'
import { defaultContent } from 'config'
import { supabase, isUnauthorized, logger, isArrayEmpty } from 'utils'
import { PlateEditor } from '@udecode/plate'
import type { Tag, EntryTag, EntryTagProperty } from '../components/EntryTags/types'

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

  //////////////////////////
  // Tags functions
  //////////////////////////

  interface syncTo {
    addDayToStateUpdateQueue: (day: string) => void
  }

  const syncPendingDeletedTags = async ({ addDayToStateUpdateQueue }: syncTo) => {
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
            } else {
              if (tagOnServer[0].revision != tag.revision) {
                logger('Tag revision mismatch -> reverting to supabase version')
                tagOnServer[0].sync_status = 'synced'
                cacheAddOrUpdateTag(tagOnServer[0])
                // Add days with tag to rerender queue
                const daysWithTag = await window.electronAPI.cache.getDaysWithTag(tag.id)
                daysWithTag.map((day) => addDayToStateUpdateQueue(day))
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

  const syncPendingUpdateTags = async ({ addDayToStateUpdateQueue }: syncTo) => {
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
            } else {
              if (tagOnServer[0].revision != tag.revision) {
                logger('Tag revision mismatch -> reverting to supabase version')
                tagOnServer[0].sync_status = 'synced'
                cacheAddOrUpdateTag(tagOnServer[0])
              }
            }
          } else {
            logger('Marking tag as synced')
            logger(data)
            tag.sync_status = 'synced'
            tag.revision = tag.revision + 1
            await cacheAddOrUpdateTag(tag)
          }
          // Add days with tag to rerender queue
          const daysWithTag = await window.electronAPI.cache.getDaysWithTag(tag.id)
          daysWithTag.map((day) => addDayToStateUpdateQueue(day))
        })
      )
    }
  }

  const syncPendingCreateTags = async () => {
    const tags = await window.electronAPI.cache.getPendingInsertTags(session.user.id)
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

  //////////////////////////
  // Entry Tags functions
  //////////////////////////

  const syncPendingUpdateEntryTags = async ({ addDayToStateUpdateQueue }: syncTo) => {
    const entryTags = await window.electronAPI.cache.getPendingUpdateEntryTags(session.user.id)
    if (entryTags.length) {
      await Promise.all(
        entryTags.map(async (entryTag: EntryTag) => {
          const { data, error } = await supabase
            .from<EntryTag>('entries_tags')
            .update({
              order_no: entryTag.order_no,
              modified_at: entryTag.modified_at,
              revision: entryTag.revision + 1,
            })
            .match({
              user_id: entryTag.user_id,
              tag_id: entryTag.tag_id,
              day: entryTag.day,
              revision: entryTag.revision,
            })
          if (error) {
            // Supabase also throws error when 0 rows updated (404)
            // hence can't throw error just yet
            if (isUnauthorized(error)) signOut()
          }
          if (!data) {
            logger('EntryTag not updated, check whats in supabase:')
            // Fetch this tag from supabase
            const { data: entryTagOnServer, error } = await supabase
              .from<EntryTag>('entries_tags')
              .select()
              .match({ user_id: entryTag.user_id, tag_id: entryTag.tag_id, day: entryTag.day })
            if (error) {
              logger('EntryTag fetch error:')
              logger(error)
              if (isUnauthorized(error)) signOut()
              throw new Error(error.message)
            }
            if (!entryTagOnServer[0]) {
              logger('This EntryTag is not in supabase, removing from cache too')
              await window.electronAPI.cache.deleteEntryTag(
                entryTag.user_id,
                entryTag.tag_id,
                entryTag.day
              )
              // Add day to rerender queue
              addDayToStateUpdateQueue(entryTag.day)
            } else {
              if (entryTagOnServer[0].revision != entryTag.revision) {
                logger('EntryTag revision mismatch -> reverting to supabase version')
                entryTagOnServer[0].sync_status = 'synced'
                cacheAddOrUpdateEntryTag(entryTagOnServer[0])
                // Add day to rerender queue
                addDayToStateUpdateQueue(entryTag.day)
              }
            }
          } else {
            logger('Marking EntryTag as synced')
            logger(data)
            entryTag.sync_status = 'synced'
            entryTag.revision = entryTag.revision + 1
            await cacheAddOrUpdateEntryTag(entryTag)
          }
        })
      )
    }
  }

  const syncPendingCreateEntryTags = async () => {
    const entryTags = await window.electronAPI.cache.getPendingInsertEntryTags(session.user.id)
    if (entryTags.length) {
      await Promise.all(
        entryTags.map(async (entryTag: EntryTag) => {
          delete entryTag.sync_status
          // NOTE using upsert in case entryTag alredy exist in Supabase (user added it form other device)
          const { error } = await supabase.from<EntryTag>('entries_tags').upsert(entryTag)
          if (error) {
            logger(error)
            if (isUnauthorized(error)) signOut()
            throw new Error(error.message)
          }
          await cacheUpdateEntryTagProperty(
            { sync_status: 'synced' },
            session.user.id,
            entryTag.day,
            entryTag.tag_id
          )
        })
      )
    }
  }

  const syncPendingDeletedEntryTags = async ({ addDayToStateUpdateQueue }: syncTo) => {
    const entryTags = await window.electronAPI.cache.getPendingDeleteEntryTags(session.user.id)
    if (entryTags.length) {
      await Promise.all(
        entryTags.map(async (entryTag: EntryTag) => {
          const { data, error } = await supabase.from<EntryTag>('entries_tags').delete().match({
            user_id: entryTag.user_id,
            tag_id: entryTag.tag_id,
            day: entryTag.day,
            revision: entryTag.revision,
          })
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
          logger('Delete entryTag return data:')
          logger(data)
          if (isArrayEmpty(data)) {
            logger('EntryTag not deleted, check whats in supabase:')
            // Fetch this tag from supabase
            const { data: entryTagOnServer, error } = await supabase
              .from<EntryTag>('entries_tags')
              .select()
              .match({ user_id: entryTag.user_id, tag_id: entryTag.tag_id, day: entryTag.day })
            if (error) {
              logger('EntryTag fetch error:')
              logger(error)
              if (isUnauthorized(error)) signOut()
              throw new Error(error.message)
            }
            if (!entryTagOnServer[0]) {
              logger('This entryTag is not in supabase, removing from cache too')
              await window.electronAPI.cache.deleteEntryTag(
                entryTag.user_id,
                entryTag.tag_id,
                entryTag.day
              )
            } else {
              if (entryTagOnServer[0].revision != entryTag.revision) {
                logger('EntryTag revision mismatch -> reverting to supabase version')
                entryTagOnServer[0].sync_status = 'synced'
                cacheAddOrUpdateEntryTag(entryTagOnServer[0])
                // Add day to rerender queue
                addDayToStateUpdateQueue(entryTag.day)
              }
            }
          } else {
            logger('Deleting EntryTag from cache')
            await window.electronAPI.cache.deleteEntryTag(
              entryTag.user_id,
              entryTag.tag_id,
              entryTag.day
            )
          }
        })
      )
    }
  }

  //////////////////////////

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

  const cacheAddOrUpdateTag = async (query: Tag) => {
    await window.electronAPI.cache.addOrUpdateTag(query)
  }

  const cacheDeleteTag = async (tag_id: string) => {
    await window.electronAPI.cache.deleteTag(tag_id)
  }

  const cacheUpdateTagProperty = async (set: EntryTagProperty, tag_id: string) => {
    await window.electronAPI.cache.updateTagProperty(set, tag_id)
  }

  const cacheAddOrUpdateEntryTag = async (entryTag: EntryTag) => {
    await window.electronAPI.cache.addOrUpdateEntryTag(entryTag)
  }

  const cacheUpdateEntryTagProperty = async (
    set: any,
    user_id: string,
    day: string,
    tag_id: string
  ) => {
    await window.electronAPI.cache.updateEntryTagProperty(set, user_id, day, tag_id)
  }

  //////////////////////////
  // Tags sync
  //////////////////////////

  const syncTags = async () => {
    logger('🏃 🏃 🏃 syncTags starts')
    try {
      let entriesToUpdateQueue: string[] = []
      const addDayToStateUpdateQueue = (day: string) => {
        if (!entriesToUpdateQueue.some((entry) => entry == day)) {
          entriesToUpdateQueue.push(day)
        }
      }

      // TAGS:
      // SYNC TO -->
      // 1. Sync pending_update
      await syncPendingCreateTags()

      // 2. Sync pending_update + or revert and update cache
      await syncPendingUpdateTags({ addDayToStateUpdateQueue })

      // 3. Sync pendgin_delete + or revert and update cache
      await syncPendingDeletedTags({ addDayToStateUpdateQueue })

      // SYNC FROM <-- (only at launch)
      if (!initialTagsFetchDone.current) {
        // 1. Fetch from supabase
        let { data: tagsSupabase, error } = await supabase
          .from<Tag>('tags')
          .select('*, entries_tags(day)')
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
            const tagInCache = tagsCache.find((t) => t.id == tag.id)
            if (tagInCache == undefined) {
              logger(`+ Adding tag '${tag.name}' to cache because it's in Supabase`)
              tag.sync_status = 'synced'
              await cacheAddOrUpdateTag(tag)
              // @ts-ignore
              tag.entries_tags.map((t) => addDayToStateUpdateQueue(t.day))
            } else {
              // Update tags with lower revision that in supabase
              if (tag.revision > tagInCache.revision) {
                tag.sync_status = 'synced'
                await cacheAddOrUpdateTag(tag)
                // @ts-ignore
                tag.entries_tags.map((t) => addDayToStateUpdateQueue(t.day))
              }
            }
          })
        )

        await Promise.all(
          tagsCache.map(async (tag) => {
            if (!tagsSupabase.some((t) => t.id == tag.id)) {
              logger(`- Deleting tag '${tag.name}' from cache because it's not in Supabase`)
              await window.electronAPI.cache.deleteTag(tag.id)
              // @ts-ignore
              tag.entries_tags.map((t) => addDayToStateUpdateQueue(t.day))
            }
          })
        )

        logger(`initialTagsFetchDone`)
        initialTagsFetchDone.current = true
      }

      // 3. Update local state with tags (userTags.current)
      await cacheFetchTags()

      // TAGS END

      // ENTRY TAGS:
      // SYNC TO -->
      await syncPendingCreateEntryTags()
      await syncPendingUpdateEntryTags({ addDayToStateUpdateQueue })
      await syncPendingDeletedEntryTags({ addDayToStateUpdateQueue })

      // SYNC FROM <-- (only at launch)
      if (!initialEntryTagsFetchDone.current) {
        // 1. Fetch from supabase
        let { data: entryTagsSupabase, error } = await supabase
          .from<EntryTag>('entries_tags')
          .select()
          .eq('user_id', session.user.id)
        if (error) {
          logger(error)
          if (isUnauthorized(error)) signOut()
          throw new Error(error.message)
        }

        // 2. Delete cached EntryTags not present in supabase. Add not present in cache
        const entryTagsCache = await window.electronAPI.cache.getEntryTags(session.user.id)
        await Promise.all(
          entryTagsSupabase.map(async (entryTag) => {
            const entryTagInCache = entryTagsCache.find(
              (t) =>
                t.user_id == entryTag.user_id &&
                t.day == entryTag.day &&
                t.tag_id == entryTag.tag_id
            )
            if (entryTagInCache == undefined) {
              logger(
                `+ Adding EntryTag '${
                  userTags.current.find((t) => t.id == entryTag.tag_id).name
                }' on ${entryTag.day} to cache because it's in Supabase`
              )
              entryTag.sync_status = 'synced'
              await cacheAddOrUpdateEntryTag(entryTag)
              addDayToStateUpdateQueue(entryTag.day)
            } else {
              // Update entryTags with lower revision that in supabase
              if (entryTag.revision > entryTagInCache.revision) {
                entryTag.sync_status = 'synced'
                await cacheAddOrUpdateEntryTag(entryTag)
                addDayToStateUpdateQueue(entryTag.day)
              }
            }
          })
        )

        await Promise.all(
          entryTagsCache.map(async (entryTag) => {
            if (
              !entryTagsSupabase.some(
                (t) =>
                  t.user_id == entryTag.user_id &&
                  t.day == entryTag.day &&
                  t.tag_id == entryTag.tag_id
              )
            ) {
              logger(
                `- Deleting tag '${userTags.current.find((t) => t.id == entryTag.tag_id)}' on ${
                  entryTag.day
                } from cache because it's not in Supabase`
              )
              await window.electronAPI.cache.deleteEntryTag(
                entryTag.user_id,
                entryTag.tag_id,
                entryTag.day
              )
              addDayToStateUpdateQueue(entryTag.day)
            }
          })
        )

        logger(`initialEntryTagsFetchDone`)
        initialEntryTagsFetchDone.current = true
      }

      // 3. Update local state with tags (userTags.current)
      await cacheFetchEntryTags()
      // ENTRY TAGS END

      logger(`Invoking update entryTags for ${entriesToUpdateQueue.length} days:`)
      logger(entriesToUpdateQueue)
      entriesToUpdateQueue.map((day) => {
        if (!!invokeEntriesTagsInitialFetch.current[day]) {
          invokeEntriesTagsInitialFetch.current[day]()
        }
      })

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
