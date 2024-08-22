type SyncStatus = 'synced' | 'pending_insert' | 'pending_update' | 'pending_delete';

type Day = `${number}-${number}-${number}`;

type Entry = {
  user_id: string
  day: Day
  journal_id?: number
  created_at: string
  modified_at: string
  content: any
  iv?: string
  revision?: number
  sync_status?: SyncStatus
};

export { Day, Entry };
