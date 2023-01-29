import React from 'react'
import dayjs from 'dayjs'
import { supabase, logger } from 'utils'
import type { Entry, EntryTag, Tag } from 'types'
import { RealtimeSubscription } from '@supabase/supabase-js'

////////////////////////////////////////////////////
// Entries realtime
////////////////////////////////////////////////////

interface initRealtimeEntriesProps {
  userEntries: React.MutableRefObject<Entry[]>
  realtimeEntriesSub: React.MutableRefObject<RealtimeSubscription>
  user_id: string
  onUpdate: () => void
}

interface RealtimePayloadEntries {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: Entry
  old?: Entry
}

function initRealtimeEntries({
  userEntries,
  realtimeEntriesSub,
  user_id,
  onUpdate,
}: initRealtimeEntriesProps) {
  // Subscribe, keep connection alive
  async function connectAndKeepAlive() {
    // Connect if not connected
    if (realtimeEntriesSub.current == null || !realtimeEntriesSub.current.isJoined()) {
      // Try removeSubscription first
      if (realtimeEntriesSub.current) {
        try {
          await supabase.removeSubscription(realtimeEntriesSub.current)
          realtimeEntriesSub.current = null
        } catch {
          logger('Could not remove Subscription')
        }
      }
      // Skip reconnecting if mac is in sleep mode
      if (window.electronAPI.getSystemIdleState() != 'locked' && window.electronAPI.isOnline()) {
        logger(`🔄 🔄 🔄 realtimeEntriesSub connecting...`)
        realtimeEntriesSub.current = supabase
          .from(`journals_${user_id.replaceAll('-', '_')}`)
          .on('*', handleEntryUpdate)
          .subscribe()
      } else {
        logger('Skipping reconnecting, mac is offline or sleeping')
      }
    } else {
      let log = {
        isErrored: realtimeEntriesSub.current.isErrored(),
        state: realtimeEntriesSub.current.state,
        isJoined: realtimeEntriesSub.current.isJoined(),
      }
      logger(
        `${dayjs()} – connected, system state: ${window.electronAPI.getSystemIdleState()}, online: ${window.electronAPI.isOnline()}`
      )
      logger(log)
    }
  }
  setInterval(connectAndKeepAlive, 5000)

  function handleEntryUpdate(payload: RealtimePayloadEntries) {
    logger('🙋‍♂️ handleEntryUpdate')
    if (payload?.eventType == 'INSERT' || payload?.eventType == 'UPDATE') {
      const isSameCreatedAt = dayjs(payload.new.created_at).isSame(
        userEntries.current.find((e) => e.day == payload.new.day)?.created_at
      )
      const isSameRevision =
        payload.new.revision == userEntries.current.find((e) => e.day == payload.new.day)?.revision
      const isSame = isSameCreatedAt && isSameRevision
      if (!isSame) {
        logger('🎾 🎾 🎾 New updated, syncing...')
        onUpdate()
      } else {
        logger('🥱 🥱 🥱 Already up to date')
      }
    }
    if (payload?.eventType == 'DELETE') {
      if (userEntries.current.find((e) => e.day == payload.old.day)) {
        logger('Deleted entry exists syncing...')
        onUpdate()
      } else {
        logger('🥱 🥱 🥱 Already deleted')
      }
    }
  }
}

////////////////////////////////////////////////////
// Tags realtime
////////////////////////////////////////////////////

interface initRealtimeTagsProps {
  userTags: React.MutableRefObject<Tag[]>
  realtimeTagsSub: React.MutableRefObject<RealtimeSubscription>
  user_id: string
  onUpdate: () => void
}

interface RealtimePayloadTags {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: Tag
  old?: Tag
}

function initRealtimeTags({ userTags, realtimeTagsSub, user_id, onUpdate }: initRealtimeTagsProps) {
  // Subscribe, keep connection alive
  async function connectAndKeepAlive() {
    // Connect if not connected
    if (realtimeTagsSub.current == null || !realtimeTagsSub.current.isJoined()) {
      // Try removeSubscription first
      if (realtimeTagsSub.current) {
        try {
          await supabase.removeSubscription(realtimeTagsSub.current)
          realtimeTagsSub.current = null
        } catch {
          logger('Could not remove Subscription')
        }
      }
      // Skip reconnecting if mac is in sleep mode
      if (window.electronAPI.getSystemIdleState() != 'locked' && window.electronAPI.isOnline()) {
        logger(`🔄 🔄 🔄 realtimeTagsSub connecting...`)
        realtimeTagsSub.current = supabase.from(`tags`).on('*', handleTagsUpdate).subscribe()
      } else {
        logger('Skipping reconnecting, mac is offline or sleeping')
      }
    }
  }
  setInterval(connectAndKeepAlive, 5000)

  function handleTagsUpdate(payload: RealtimePayloadTags) {
    logger('🙋‍♂️ handleTagsUpdate')
    if (payload?.eventType == 'INSERT' || payload?.eventType == 'UPDATE') {
      const isSameCreatedAt = dayjs(payload.new.created_at).isSame(
        userTags.current.find((e) => e.id == payload.new.id)?.created_at
      )
      const isSameRevision =
        payload.new.revision == userTags.current.find((e) => e.id == payload.new.id)?.revision
      const isSame = isSameCreatedAt && isSameRevision
      if (!isSame) {
        logger('🎾 🎾 🎾 New updated, syncing...')
        onUpdate()
      } else {
        logger('🥱 🥱 🥱 Already up to date')
      }
    }
    if (payload?.eventType == 'DELETE') {
      if (userTags.current.find((e) => e.id == payload.old.id)) {
        logger('Deleted entry exists syncing...')
        onUpdate()
      } else {
        logger('🥱 🥱 🥱 Already deleted')
      }
    }
  }
}

////////////////////////////////////////////////////
// Entry tags realtime
////////////////////////////////////////////////////

interface initRealtimeEntryTagsProps {
  userEntryTags: React.MutableRefObject<EntryTag[]>
  realtimeEntryTagsSub: React.MutableRefObject<RealtimeSubscription>
  user_id: string
  onUpdate: () => void
}

interface RealtimePayloadEntryTags {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: EntryTag
  old?: EntryTag
}

function initRealtimeEntryTags({
  userEntryTags,
  realtimeEntryTagsSub,
  user_id,
  onUpdate,
}: initRealtimeEntryTagsProps) {
  // Subscribe, keep connection alive
  async function connectAndKeepAlive() {
    // Connect if not connected
    if (realtimeEntryTagsSub.current == null || !realtimeEntryTagsSub.current.isJoined()) {
      // Try removeSubscription first
      if (realtimeEntryTagsSub.current) {
        try {
          await supabase.removeSubscription(realtimeEntryTagsSub.current)
          realtimeEntryTagsSub.current = null
        } catch {
          logger('Could not remove Subscription')
        }
      }
      // Skip reconnecting if mac is in sleep mode
      if (window.electronAPI.getSystemIdleState() != 'locked' && window.electronAPI.isOnline()) {
        logger(`🔄 🔄 🔄 realtimeEntryTagsSub connecting...`)
        realtimeEntryTagsSub.current = supabase
          .from(`entries_tags_${user_id.replaceAll('-', '_')}`)
          .on('*', handleEntryTagsUpdate)
          .subscribe()
      } else {
        logger('Skipping reconnecting, mac is offline or sleeping')
      }
    }
  }
  setInterval(connectAndKeepAlive, 5000)

  function handleEntryTagsUpdate(payload: RealtimePayloadEntryTags) {
    logger('🙋‍♂️ handleEntryTagsUpdate')
    if (payload?.eventType == 'INSERT' || payload?.eventType == 'UPDATE') {
      const isSameCreatedAt = dayjs(payload.new.created_at).isSame(
        userEntryTags.current.find(
          (e) => e.day == payload.new.day && e.tag_id == payload.new.tag_id
        )?.created_at
      )
      const isSameRevision =
        payload.new.revision ==
        userEntryTags.current.find(
          (e) => e.day == payload.new.day && e.tag_id == payload.new.tag_id
        )?.revision
      const isSame = isSameCreatedAt && isSameRevision
      if (!isSame) {
        logger('🎾 🎾 🎾 New updated, syncing...')
        onUpdate()
      } else {
        logger('🥱 🥱 🥱 Already up to date')
      }
    }
    if (payload?.eventType == 'DELETE') {
      if (
        userEntryTags.current.find(
          (e) => e.day == payload.old.day && e.tag_id == payload.old.tag_id
        )
      ) {
        logger('Deleted entry exists syncing...')
        onUpdate()
      } else {
        logger('🥱 🥱 🥱 Already deleted')
      }
    }
  }
}

export { initRealtimeEntries, initRealtimeEntryTags, initRealtimeTags }
