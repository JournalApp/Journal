import React from 'react'
import { supabase, isUnauthorized, logger, encryptEntry, decryptEntry } from 'utils'
import type { Tag, EntryTag, EntryTagProperty } from '../../components/EntryTags/types'
import type { Day, Entry } from '../../components/Entry/types'
import { Session } from '@supabase/supabase-js'

////////////////////////////////////////////////////
// Entries context functions
////////////////////////////////////////////////////

const cacheAddOrUpdateEntry = async (entry: Entry) => {
  await window.electronAPI.cache.addOrUpdateEntry(entry)
}

const cacheAddEntryIfNotExists = async (user_id: string, day: string) => {
  // const exists = await window.electronAPI.cache.doesEntryExist(user_id, day)
  // if (!exists) {
  //   logger(`Day ${day} doesnt exist, creating...`)
  //   await invokeForceSaveEntry.current[day]()
  // } else {
  //   logger(`Day already ${day} exists`)
  // }
}

const cacheUpdateEntry = async (set: any, where: any) => {
  await window.electronAPI.cache.updateEntry(set, where)
}

const cacheUpdateEntryProperty = async (set: object, where: object) => {
  await window.electronAPI.cache.updateEntryProperty(set, where)
}

const cacheCreateNewEntry = async (day: Day) => {
  // let now = serverTimeNow()
  // let entry = {
  //   user_id: session.user.id,
  //   day,
  //   created_at: now,
  //   modified_at: now,
  //   content: JSON.stringify(defaultContent) as any,
  // }
  // await window.electronAPI.cache.addOrUpdateEntry(entry)
  // let days = await window.electronAPI.cache.getDays(session.user.id)
  // entry.content = defaultContent
  // userEntries.current.push(entry)
  // setDaysCache([...days])
  // logger(`Added day ${day}`)
}

const deleteEntry = async (day: string) => {
  // let user_id = session.user.id
  // let { error } = await supabase
  //   .from('journals')
  //   .delete({ returning: 'minimal' })
  //   .match({ user_id, day })
  // if (error) {
  //   logger(error)
  //   setPendingDeletedEntries(true)
  //   await window.electronAPI.cache.markPendingDeleteEntry({ user_id, day })
  //   if (isUnauthorized(error)) signOut()
  // } else {
  //   await window.electronAPI.cache.deleteEntry({ user_id, day })
  // }
  // // Remove entryTags associated with this day
  // const entryTagsToDelete = await window.electronAPI.cache.getEntryTagsOnDay(user_id, day)
  // Promise.all(
  //   entryTagsToDelete.map(async (et) => {
  //     await window.electronAPI.cache.deleteEntryTag(user_id, et.tag_id, day)
  //   })
  // )
  // await cacheFetchEntryTags()
  // let days = await window.electronAPI.cache.getDays(user_id)
  // userEntries.current = userEntries.current.filter((item) => item.day !== day)
  // setDaysCache([...days])
  // logger(`Removed day ${day}`)
  // window.electronAPI.capture({
  //   distinctId: session.user.id,
  //   event: 'entry remove',
  // })
}

//////////////////////////
// Entries sync functions
//////////////////////////

interface syncTo {
  addDayToStateUpdateQueue?: (day: string) => void
  session: Session
  setDaysHaveChanged: (state: boolean) => void
  getSecretKey: () => Promise<CryptoKey>
  signOut: () => void
}

const syncPendingCreateEntries = async () => {}

const syncPendingUpdateEntries = async ({
  addDayToStateUpdateQueue,
  getSecretKey,
  setDaysHaveChanged,
  session,
  signOut,
}: syncTo) => {
  const entries = await window.electronAPI.cache.getPendingUpdateEntries(session.user.id)
  if (entries.length) {
    await Promise.all(
      entries.map(async (entry: Entry) => {
        const secretKey = await getSecretKey()
        const { contentEncrypted, iv } = await encryptEntry(
          JSON.stringify(entry.content),
          secretKey
        )

        const { data, error } = await supabase
          .from<Entry>('journals')
          .update({
            user_id: session.user.id,
            content: '\\x' + contentEncrypted,
            iv: '\\x' + iv,
            modified_at: entry.modified_at,
            revision: entry.revision + 1,
          })
          .match({ user_id: session.user.id, day: entry.day, revision: entry.revision })
        if (error) {
          // Supabase also throws error when 0 rows updated (404)
          // hence can't throw error just yet
          if (isUnauthorized(error)) signOut()
        }

        if (!data) {
          logger('Entry not updated, check whats in supabase:')
          // Fetch this entry from supabase
          const { data: entryOnServer, error } = await supabase
            .from<Entry>('journals')
            .select()
            .match({ user_id: session.user.id, day: entry.day })
            .single()
          if (error) {
            logger('Entry fetch error:')
            logger(error)
            if (isUnauthorized(error)) signOut()
            throw new Error(error.message)
          }
          if (!entryOnServer) {
            logger('This entry is not in supabase, removing from cache too')
            await window.electronAPI.cache.deleteEntry({ user_id: session.user.id, day: entry.day })
            setDaysHaveChanged(true)
          } else {
            if (entryOnServer.revision != entry.revision) {
              logger('Entry revision mismatch -> reverting to supabase version')
              const { contentDecrypted } = await decryptEntry(
                entryOnServer.content,
                entryOnServer.iv,
                secretKey
              )
              entryOnServer.content = JSON.parse(contentDecrypted)
              entryOnServer.sync_status = 'synced'
              cacheAddOrUpdateEntry(entryOnServer)
              addDayToStateUpdateQueue(entry.day)
            }
          }
        } else {
          logger('Marking entry as synced')
          logger(data)
          entry.sync_status = 'synced'
          entry.revision = entry.revision + 1
          await cacheAddOrUpdateEntry(entry)
        }
      })
    )
  }
}

const syncPendingDeletedEntries = async () => {}

//////////////////////////
// Entries sync
//////////////////////////

interface syncEntriesProps {
  initialEntriesFetchDone: React.MutableRefObject<boolean>
  syncEntriesInterval: React.MutableRefObject<NodeJS.Timeout | null>
  cacheFetchEntries: () => Promise<void>
  rerenderEntriesAndCalendar: () => Promise<void>
  rerenderEntry: (day: Day) => void
  session: Session
  signOut: () => void
  getSecretKey: () => Promise<CryptoKey>
}

const syncEntries = async ({
  initialEntriesFetchDone,
  syncEntriesInterval,
  cacheFetchEntries,
  rerenderEntriesAndCalendar,
  rerenderEntry,
  session,
  signOut,
  getSecretKey,
}: syncEntriesProps) => {
  logger('🗓 🗓 🗓 syncEntries starts')
  try {
    // init entriesToUpdateQueue
    let daysHaveChanged = false
    const setDaysHaveChanged = (state: boolean) => {
      daysHaveChanged = state
    }
    let newDaysToFetch: Day[] = []
    let entriesToUpdateQueue: Day[] = []
    const addDayToStateUpdateQueue = (day: Day) => {
      if (!entriesToUpdateQueue.some((entry) => entry == day)) {
        entriesToUpdateQueue.push(day)
      }
    }

    // SYNC TO -->
    await syncPendingCreateEntries()
    await syncPendingUpdateEntries({
      addDayToStateUpdateQueue,
      getSecretKey,
      setDaysHaveChanged,
      session,
      signOut,
    })
    await syncPendingDeletedEntries()

    // SYNC FROM <-- (only at launch)
    if (!initialEntriesFetchDone.current) {
      // Fetch from supabase

      let { data: daysSupabase, error } = await supabase
        .from<Entry>('journals')
        .select('day, revision')
        .eq('user_id', session.user.id)
        .order('day', { ascending: true })
      logger('daysSupabase:')
      logger(daysSupabase)
      if (error) {
        logger(error)
        if (isUnauthorized(error)) signOut()
        throw new Error(error.message)
      }

      // Delete cached Entries not present in supabase. Add Entries not present in cache
      const daysCache = await window.electronAPI.cache.getDays(session.user.id)
      logger('daysCache:')
      logger(daysCache)
      await Promise.all(
        daysSupabase.map(async (entry) => {
          const dayInCache = daysCache.find((e) => e.day == entry.day)
          if (dayInCache == undefined) {
            logger(`+ Adding day ${entry.day} to cache because it's in Supabase`)
            newDaysToFetch.push(entry.day)
            daysHaveChanged = true
          } else {
            // Update entries with lower revision than in supabase
            if (entry.revision > dayInCache.revision) {
              newDaysToFetch.push(entry.day)
              addDayToStateUpdateQueue(entry.day)
            }
          }
        })
      )

      await Promise.all(
        daysCache.map(async (entry) => {
          if (!daysSupabase.some((e) => e.day == entry.day)) {
            logger(`- Deleting day ${entry.day} from cache because it's not in Supabase`)
            daysHaveChanged = true
            await window.electronAPI.cache.deleteEntry({ user_id: session.user.id, day: entry.day })
          }
        })
      )

      // Fetch newDaysToFetch from Supabase
      if (newDaysToFetch.length) {
        let orString = newDaysToFetch.map((s) => `day.eq.${s}`).join()
        logger('orString:')
        logger(orString)
        let { data: additionalDaysSupabase, error: error2 } = await supabase
          .from<Entry>('journals')
          .select()
          .eq('user_id', session.user.id)
          .or(orString)
        logger('additionalDaysSupabase:')
        logger(additionalDaysSupabase)
        if (error2) {
          logger(error2)
          if (isUnauthorized(error2)) signOut()
          throw new Error(error2.message)
        }
        const secretKey = await getSecretKey()
        await Promise.all(
          additionalDaysSupabase.map(async (entry) => {
            const { contentDecrypted } = await decryptEntry(entry.content, entry.iv, secretKey)
            entry.content = contentDecrypted
            entry.sync_status = 'synced'
            await cacheAddOrUpdateEntry(entry)
          })
        )
      }

      // Mark initial fetch as done
      logger(`initialEntriesFetchDone`)
      initialEntriesFetchDone.current = true
    }

    // Update local state with tags (userTags.current)
    await cacheFetchEntries()

    // Rerender EntryList
    if (daysHaveChanged) {
      logger(`Invoking rerender bacuse days have changed`)
      await rerenderEntriesAndCalendar()
    }

    // Run entriesToUpdateQueue
    logger(`Invoking update Entries for ${entriesToUpdateQueue.length} days:`)
    logger(entriesToUpdateQueue)
    entriesToUpdateQueue.map((day) => {
      rerenderEntry(day)
    })

    logger('⏹ ⏹ ⏹ syncEntries stops')
    if (syncEntriesInterval.current) {
      clearInterval(syncEntriesInterval.current)
      syncEntriesInterval.current = null
    }
  } catch (err) {
    logger(err)
  }
}

export {
  syncEntries,
  cacheAddOrUpdateEntry,
  cacheAddEntryIfNotExists,
  cacheUpdateEntry,
  cacheUpdateEntryProperty,
  cacheCreateNewEntry,
  deleteEntry,
}
