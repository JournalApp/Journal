import { lightTheme, theme } from 'themes'

type Tag = {
  id: string
  user_id?: string
  name: string
  color: keyof typeof lightTheme.color.tags
  created_at?: string
  modified_at?: string
  revision?: number
  sync_status?: 'synced' | 'pending_update' | 'pending_delete'
}

export { Tag }
