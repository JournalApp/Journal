import React from 'react'
import dayjs from 'dayjs'
import {
  supabase,
  isUnauthorized,
  isUniqueViolation,
  logger,
  encryptEntry,
  decryptEntry,
  isArrayEmpty,
} from 'utils'
import type { Day, Entry } from 'types'
import { Session } from '@supabase/supabase-js'

////////////////////////////////////////////////////
// Entries context functions
////////////////////////////////////////////////////

const cacheAddOrUpdateEntry = async (entry: Entry) => {
  await window.electronAPI.cache.addOrUpdateEntry(entry)
}

const cacheUpdateEntry = async (set: any, where: any) => {
  await window.electronAPI.cache.updateEntry(set, where)
}

const cacheUpdateEntryProperty = async (set: object, where: object) => {
  await window.electronAPI.cache.updateEntryProperty(set, where)
}

//////////////////////////
// Entries sync functions
//////////////////////////

interface syncTo {
  addDayToStateUpdateQueue?: (day: string) => void
  session: Session
  setDaysHaveChanged: (state: boolean) => void
  setEntryTagsHaveChanged: (state: boolean) => void
  forceSyncTags: () => void
  cacheFetchEntryTags: () => Promise<void>
  secretKey: CryptoKey
  signOut: () => void
}

const syncPendingCreateEntries = async ({
  addDayToStateUpdateQueue,
  secretKey,
  setEntryTagsHaveChanged,
  session,
  signOut,
}: syncTo) => {
  const entries = await window.electronAPI.cache.getPendingInsertEntries(session.user.id)
  if (entries.length) {
    await Promise.all(
      entries.map(async (entry: Entry) => {
        const { contentEncrypted, iv } = await encryptEntry(entry.content, secretKey)
        entry.content = '\\x' + contentEncrypted
        entry.iv = '\\x' + iv
        delete entry.sync_status
        const { error } = await supabase.from<Entry>('journals').insert(entry)
        logger('Inserting pending insert entry')
        if (error) {
          logger(error)
          if (isUnauthorized(error)) signOut()
          if (isUniqueViolation(error)) {
            logger('Entry is already in supabase, updating to supabase version')
            const { data: entryOnServer, error: error2 } = await supabase
              .from<Entry>('journals')
              .select()
              .match({ user_id: session.user.id, day: entry.day })
            if (error2) {
              logger('Entry fetch error:')
              logger(error)
              if (isUnauthorized(error)) signOut()
              throw new Error(error.message)
            }
            const { contentDecrypted } = await decryptEntry(
              entryOnServer[0].content,
              entryOnServer[0].iv,
              secretKey
            )
            entryOnServer[0].content = contentDecrypted
            entryOnServer[0].sync_status = 'synced'
            await cacheAddOrUpdateEntry(entryOnServer[0])
            addDayToStateUpdateQueue(entry.day)
            setEntryTagsHaveChanged(true)
          } else {
            throw new Error(error.message)
          }
        }
        cacheUpdateEntryProperty(
          { sync_status: 'synced' },
          { user_id: session.user.id, day: entry.day }
        )
      })
    )
  }
}

const syncPendingUpdateEntries = async ({
  addDayToStateUpdateQueue,
  secretKey,
  setDaysHaveChanged,
  cacheFetchEntryTags,
  session,
  signOut,
}: syncTo) => {
  const entries = await window.electronAPI.cache.getPendingUpdateEntries(session.user.id)
  if (entries.length) {
    await Promise.all(
      entries.map(async (entry: Entry) => {
        const { contentEncrypted, iv } = await encryptEntry(entry.content, secretKey)

        const { data, error } = await supabase
          .from<Entry>('journals')
          .update({
            user_id: session.user.id,
            content: '\\x' + contentEncrypted,
            iv: '\\x' + iv,
            modified_at: entry.modified_at,
            revision: entry.revision + 1,
          })
          .match({
            user_id: session.user.id,
            day: entry.day,
            created_at: entry.created_at,
            revision: entry.revision,
          })
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
          if (error) {
            logger('Entry fetch error:')
            logger(error)
            if (isUnauthorized(error)) signOut()
            throw new Error(error.message)
          }
          if (!entryOnServer[0]) {
            logger('This entry is not in supabase, removing from cache too')
            await window.electronAPI.cache.deleteEntry({ user_id: session.user.id, day: entry.day })
            // Refrsh tags
            cacheFetchEntryTags()
            setDaysHaveChanged(true)
          } else {
            if (dayjs(entryOnServer[0].created_at).isSame(entry.created_at)) {
              logger('Entry created_at are the same')
              if (entryOnServer[0].revision != entry.revision) {
                logger('Entry revision mismatch -> reverting to supabase version')
                const { contentDecrypted } = await decryptEntry(
                  entryOnServer[0].content,
                  entryOnServer[0].iv,
                  secretKey
                )
                entryOnServer[0].content = contentDecrypted
                entryOnServer[0].sync_status = 'synced'
                cacheAddOrUpdateEntry(entryOnServer[0])
                addDayToStateUpdateQueue(entry.day)
              }
            }
            if (dayjs(entryOnServer[0].created_at).isAfter(dayjs(entry.created_at))) {
              // User deleted it and added again or other device
              // Revisons may even be the same, but it's a different entry
              logger('Supabase created_at is newer, reverting to supabase version')
              const { contentDecrypted } = await decryptEntry(
                entryOnServer[0].content,
                entryOnServer[0].iv,
                secretKey
              )
              entryOnServer[0].content = contentDecrypted
              entryOnServer[0].sync_status = 'synced'
              cacheAddOrUpdateEntry(entryOnServer[0])
              addDayToStateUpdateQueue(entry.day)
            }
            if (dayjs(entry.created_at).isAfter(dayjs(entryOnServer[0].created_at))) {
              // User deleted entry and created it again while being offline
              logger('Cached created_at is newer, pushing to supabase')
              const { error: updateError } = await supabase
                .from<Entry>('journals')
                .update({
                  user_id: session.user.id,
                  content: '\\x' + contentEncrypted,
                  iv: '\\x' + iv,
                  created_at: entry.created_at,
                  modified_at: entry.modified_at,
                  revision: entry.revision,
                })
                .match({
                  user_id: session.user.id,
                  day: entry.day,
                })
              if (updateError) {
                logger('Entry update error:')
                logger(updateError)
                if (isUnauthorized(updateError)) signOut()
                throw new Error(updateError.message)
              }
              logger('Marking entry as synced')
              cacheUpdateEntryProperty(
                { sync_status: 'synced' },
                { user_id: session.user.id, day: entry.day }
              )
            }
          }
        } else {
          logger('Marking entry as synced')
          entry.sync_status = 'synced'
          entry.revision = entry.revision + 1
          await cacheAddOrUpdateEntry(entry)
        }
      })
    )
  }
}

const syncPendingDeletedEntries = async ({
  secretKey,
  setDaysHaveChanged,
  cacheFetchEntryTags,
  session,
  signOut,
}: syncTo) => {
  const entries = await window.electronAPI.cache.getPendingDeleteEntries(session.user.id)
  if (entries.length) {
    await Promise.all(
      entries.map(async (entry: Entry) => {
        const { data, error } = await supabase.from<Entry>('journals').delete().match({
          user_id: session.user.id,
          day: entry.day,
          created_at: entry.created_at,
          revision: entry.revision,
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
        logger('Delete entry return data:')
        logger(data)
        if (isArrayEmpty(data)) {
          logger('Entry not deleted, check whats in supabase:')
          // Fetch this entry from supabase
          const { data: entryOnServer, error } = await supabase
            .from<Entry>('journals')
            .select()
            .match({ user_id: session.user.id, day: entry.day })
          if (error) {
            logger('Entry fetch error:')
            logger(error)
            if (isUnauthorized(error)) signOut()
            throw new Error(error.message)
          }
          if (!entryOnServer[0]) {
            logger('This entry is not in supabase, removing from cache too')
            await window.electronAPI.cache.deleteEntry({ user_id: session.user.id, day: entry.day })
            // Refrsh tags
            cacheFetchEntryTags()
          } else {
            let created_at_same = dayjs(entryOnServer[0].created_at).isSame(entry.created_at)
            let revisions_missmatch = entryOnServer[0].revision != entry.revision
            const revertToSupabaseVersion = async () => {
              logger('Reverting to supabase version')
              const { contentDecrypted } = await decryptEntry(
                entryOnServer[0].content,
                entryOnServer[0].iv,
                secretKey
              )
              entryOnServer[0].content = contentDecrypted
              entryOnServer[0].sync_status = 'synced'
              cacheAddOrUpdateEntry(entryOnServer[0])
              setDaysHaveChanged(true)
            }
            if (created_at_same && revisions_missmatch) {
              logger('Entry created_at are the same, but revision missmatch')
              await revertToSupabaseVersion()
            }
            if (!created_at_same) {
              logger('Entry created_at different')
              await revertToSupabaseVersion()
            }
          }
        } else {
          logger('Deleting Entry from cache')
          await window.electronAPI.cache.deleteEntry({ user_id: session.user.id, day: entry.day })
          // Refrsh tags
          cacheFetchEntryTags()
        }
      })
    )
  }
}

//////////////////////////
// Entries sync
//////////////////////////

interface syncEntriesProps {
  initialEntriesFetchDone: React.MutableRefObject<boolean>
  syncEntriesInterval: React.MutableRefObject<NodeJS.Timeout | null>
  cacheFetchEntries: () => Promise<void>
  rerenderEntriesAndCalendar: () => void
  rerenderEntry: (day: Day) => void
  forceSyncTags: () => void
  cacheFetchEntryTags: () => Promise<void>
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
  forceSyncTags,
  cacheFetchEntryTags,
  session,
  signOut,
  getSecretKey,
}: syncEntriesProps) => {
  logger('🗓 🗓 🗓 syncEntries starts')
  try {
    const secretKey = await getSecretKey()
    // init things to update at the end of sync
    let daysHaveChanged = false
    const setDaysHaveChanged = (state: boolean) => {
      daysHaveChanged = state
    }
    let entryTagsHaveChanged = false
    const setEntryTagsHaveChanged = (state: boolean) => {
      entryTagsHaveChanged = state
    }
    let newDaysToFetch: Day[] = []
    let entriesToUpdateQueue: Day[] = []
    const addDayToStateUpdateQueue = (day: Day) => {
      if (!entriesToUpdateQueue.some((entry) => entry == day)) {
        entriesToUpdateQueue.push(day)
      }
    }

    // SYNC TO -->
    const syncArgs = {
      addDayToStateUpdateQueue,
      secretKey,
      setDaysHaveChanged,
      setEntryTagsHaveChanged,
      forceSyncTags,
      cacheFetchEntryTags,
      session,
      signOut,
    }
    await syncPendingCreateEntries(syncArgs)
    await syncPendingUpdateEntries(syncArgs)
    await syncPendingDeletedEntries(syncArgs)

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
        // if >200 'or' statements, there is an error:
        // (502) An invalid response was received from the upstream server
        // Fetch from supabase in chunks of 50 days:
        newDaysToFetch.reverse()
        const daysInChunk = 50
        let numberOfChunks = Math.ceil(newDaysToFetch.length / daysInChunk)
        const chunks = Array(numberOfChunks).fill(0)

        await Promise.all(
          chunks.map(async (v, i) => {
            logger(`Fetching chunk ${i + 1} of ${numberOfChunks}`)

            let cursor = i * daysInChunk
            let chunk = newDaysToFetch.slice(cursor, cursor + daysInChunk)

            let orString = chunk.map((s) => `day.eq.${s}`).join()
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
          })
        )
      }

      // Mark initial fetch as done
      logger(`initialEntriesFetchDone`)
      initialEntriesFetchDone.current = true
    }

    // Update local state with tags (userEntries.current)
    await cacheFetchEntries()

    // Rerender EntryList
    if (daysHaveChanged) {
      logger(`Invoking rerender bacuse days have changed`)
      await rerenderEntriesAndCalendar()
    }

    // Force sync Tags and EntryTags
    if (entryTagsHaveChanged) {
      forceSyncTags()
    }

    // Run entriesToUpdateQueue
    logger(`Invoking update Entries for ${entriesToUpdateQueue.length} days:`)
    logger(entriesToUpdateQueue)
    entriesToUpdateQueue.map((day) => {
      rerenderEntry(day)
    })

    logger('✋🏻 ✋🏻 ✋🏻 syncEntries stops')
    if (syncEntriesInterval.current) {
      clearInterval(syncEntriesInterval.current)
      syncEntriesInterval.current = null
    }
  } catch (err) {
    logger(err)
  }
}

export { syncEntries, cacheAddOrUpdateEntry, cacheUpdateEntry, cacheUpdateEntryProperty }
