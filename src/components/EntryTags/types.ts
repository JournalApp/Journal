import { lightTheme, theme } from 'themes'

type SyncStatus = 'synced' | 'pending_update' | 'pending_delete'

type Tag = {
  id: string
  user_id?: string
  name: string
  color: keyof typeof lightTheme.color.tags
  created_at?: string
  modified_at?: string
  revision?: number
  sync_status?: SyncStatus
}

type EntryTag = {
  user_id?: string
  day: string
  journal_id?: number
  tag_id: string
  order_no: number
  created_at?: string
  modified_at?: string
  revision?: number
  sync_status?: SyncStatus
}

export { Tag, EntryTag }
