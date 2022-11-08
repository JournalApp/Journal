import React from 'react'
import { supabase, isUnauthorized, logger, isArrayEmpty } from 'utils'
import type { Tag, EntryTag, EntryTagProperty } from 'types'
import { Session } from '@supabase/supabase-js'

////////////////////////////////////////////////////
// Tags & EntryTags context functions
////////////////////////////////////////////////////

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
// Tags functions
//////////////////////////

interface syncTo {
  addDayToStateUpdateQueue?: (day: string) => void
  session: Session
  signOut: () => void
}

const syncPendingDeletedTags = async ({ addDayToStateUpdateQueue, session, signOut }: syncTo) => {
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

const syncPendingUpdateTags = async ({ addDayToStateUpdateQueue, session, signOut }: syncTo) => {
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

const syncPendingCreateTags = async ({ session, signOut }: syncTo) => {
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

const syncPendingUpdateEntryTags = async ({
  addDayToStateUpdateQueue,
  session,
  signOut,
}: syncTo) => {
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

const syncPendingCreateEntryTags = async ({ session, signOut }: syncTo) => {
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

const syncPendingDeletedEntryTags = async ({
  addDayToStateUpdateQueue,
  session,
  signOut,
}: syncTo) => {
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
// Tags sync
//////////////////////////

interface syncTagsProps {
  initialTagsFetchDone: React.MutableRefObject<boolean>
  initialEntryTagsFetchDone: React.MutableRefObject<boolean>
  invokeRerenderEntryTags: React.MutableRefObject<any>
  userTags: React.MutableRefObject<Tag[]>
  cacheFetchTags: () => Promise<void>
  cacheFetchEntryTags: () => Promise<void>
  syncTagsInterval: React.MutableRefObject<NodeJS.Timeout | null>
  session: Session
  signOut: () => void
}

const syncTags = async ({
  initialTagsFetchDone,
  initialEntryTagsFetchDone,
  invokeRerenderEntryTags,
  userTags,
  cacheFetchTags,
  cacheFetchEntryTags,
  syncTagsInterval,
  session,
  signOut,
}: syncTagsProps) => {
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
    await syncPendingCreateTags({ session, signOut })

    // 2. Sync pending_update + or revert and update cache
    await syncPendingUpdateTags({ addDayToStateUpdateQueue, session, signOut })

    // 3. Sync pendgin_delete + or revert and update cache
    await syncPendingDeletedTags({ addDayToStateUpdateQueue, session, signOut })

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
    await syncPendingCreateEntryTags({ session, signOut })
    await syncPendingUpdateEntryTags({ addDayToStateUpdateQueue, session, signOut })
    await syncPendingDeletedEntryTags({ addDayToStateUpdateQueue, session, signOut })

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
              t.user_id == entryTag.user_id && t.day == entryTag.day && t.tag_id == entryTag.tag_id
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
            // Update entryTags with lower revision than in supabase
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
      if (!!invokeRerenderEntryTags.current[day]) {
        invokeRerenderEntryTags.current[day]()
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

export {
  cacheAddOrUpdateTag,
  cacheDeleteTag,
  cacheUpdateTagProperty,
  cacheAddOrUpdateEntryTag,
  cacheUpdateEntryTagProperty,
  syncPendingDeletedTags,
  syncPendingUpdateTags,
  syncPendingCreateTags,
  syncPendingUpdateEntryTags,
  syncPendingCreateEntryTags,
  syncPendingDeletedEntryTags,
  syncTags,
  syncTagsProps,
}
