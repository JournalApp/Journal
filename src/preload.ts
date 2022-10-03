import { contextBridge, ipcRenderer, clipboard } from 'electron'
import { EventMessage } from './services/analytics'
import type { Tag, EntryTag, EntryTagProperty } from './components/EntryTags/types'
import type { Day, Entry } from './components/Entry/types'

const electronAPI = {
  onPaste: (callback: any) => ipcRenderer.on('paste', callback),
  onCopy: (callback: any) => ipcRenderer.on('copy', callback),
  onUpdateDownloaded: (callback: any) => ipcRenderer.on('update-downloaded', callback),
  onEntryPending: (callback: any) => ipcRenderer.on('sqlite-entry-event', callback),
  onTagPending: (callback: any) => ipcRenderer.on('sqlite-tag-event', callback),
  async capture({ distinctId, event, properties, type }: EventMessage) {
    await ipcRenderer.invoke('analytics-capture', { distinctId, event, properties, type })
  },
  cache: {
    // Entry
    async addOrUpdateEntry(entry: Entry) {
      await ipcRenderer.invoke('cache-add-or-update-entry', entry)
    },
    async deleteEntry(query: any) {
      await ipcRenderer.invoke('cache-delete-entry', query)
    },
    async markPendingDeleteEntry(query: any) {
      await ipcRenderer.invoke('cache-mark-deleted-entry', query)
    },
    async deleteAll(user_id: string) {
      await ipcRenderer.invoke('cache-delete-all', user_id)
    },
    async updateEntry(set: any, where: any) {
      await ipcRenderer.invoke('cache-update-entry', set, where)
    },
    async updateEntryProperty(set: any, where: any) {
      await ipcRenderer.invoke('cache-update-entry-property', set, where)
    },
    async getDays(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-days', user_id)) as Entry[]
    },
    async getEntries(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-entries', user_id)) as Entry[]
    },
    async getDeletedDays(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-deleted-days', user_id)) as Day[]
    },
    async doesEntryExist(user_id: string, day: string) {
      return await ipcRenderer.invoke('cache-does-entry-exist', user_id, day)
    },

    // Tags
    async getTags(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-tags', user_id)) as Tag[]
    },
    async getDaysWithTag(tag_id: string) {
      return (await ipcRenderer.invoke('cache-get-days-with-tag', tag_id)) as string[]
    },
    async getTag(id: string) {
      return (await ipcRenderer.invoke('cache-get-tag', id)) as Tag
    },
    async getPendingDeleteTags(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-pending-delete-tags', user_id)) as Tag[]
    },
    async getPendingUpdateTags(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-pending-update-tags', user_id)) as Tag[]
    },
    async getPendingInsertTags(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-pending-insert-tags', user_id)) as Tag[]
    },
    async deleteTag(tag_id: string) {
      await ipcRenderer.invoke('cache-delete-tag', tag_id)
    },
    async addOrUpdateTag(tag: Tag) {
      await ipcRenderer.invoke('cache-add-or-update-tag', tag)
    },
    async updateTagProperty(set: any, tag_id: string) {
      await ipcRenderer.invoke('cache-update-tag-property', set, tag_id)
    },

    // Entry tags
    async getEntryTags(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-entry-tags', user_id)) as EntryTag[]
    },
    async getEntryTagsOnDay(user_id: string, day: string) {
      return (await ipcRenderer.invoke('cache-get-entry-tags-on-day', user_id, day)) as EntryTag[]
    },
    async getPendingInsertEntryTags(user_id: string) {
      return (await ipcRenderer.invoke(
        'cache-get-pending-insert-entry-tags',
        user_id
      )) as EntryTag[]
    },
    async addOrUpdateEntryTag(entryTag: EntryTag) {
      await ipcRenderer.invoke('cache-add-or-update-entry-tag', entryTag)
    },
    async updateEntryTagProperty(
      set: EntryTagProperty,
      user_id: string,
      day: string,
      tag_id: string
    ) {
      await ipcRenderer.invoke('cache-update-entry-tag-property', set, user_id, day, tag_id)
    },
    async getPendingDeleteEntryTags(user_id: string) {
      return (await ipcRenderer.invoke(
        'cache-get-pending-delete-entry-tags',
        user_id
      )) as EntryTag[]
    },
    async deleteEntryTag(user_id: string, tag_id: string, day: string) {
      await ipcRenderer.invoke('cache-delete-entry-tag', user_id, tag_id, day)
    },
    async getPendingUpdateEntryTags(user_id: string) {
      return (await ipcRenderer.invoke(
        'cache-get-pending-update-entry-tags',
        user_id
      )) as EntryTag[]
    },

    // User
  },
  preferences: {
    async set(user_id: string, set: object) {
      await ipcRenderer.invoke('preferences-set', user_id, set)
    },
    async deleteAll(user_id: string) {
      await ipcRenderer.invoke('preferences-delete-all', user_id)
    },
    getAll(user_id?: string) {
      return ipcRenderer.sendSync('preferences-get-all', user_id)
    },
  },
  app: {
    async setKey(set: object) {
      ipcRenderer.invoke('app-set-key', set)
    },
    getKey(key: string) {
      return ipcRenderer.sendSync('app-get-key', key)
    },
  },
  user: {
    async saveSecretKey(user_id: string, secretKey: object) {
      await ipcRenderer.invoke('user-save-secret-key', user_id, secretKey)
    },
    async getSecretKey(user_id: string) {
      return await ipcRenderer.invoke('app-get-secret-key', user_id)
    },
    async add(id: string) {
      await ipcRenderer.invoke('cache-add-user', id)
    },
  },
  handleSpellCheck: (callback: any) => ipcRenderer.once('electron-handleSpellCheck', callback),
  disableSpellCheck: async () => {
    await ipcRenderer.invoke('electron-disableSpellCheck')
  },
  enableSpellCheck: async () => {
    await ipcRenderer.invoke('electron-enableSpellCheck')
  },
  handleOpenUrl: (callback: any) => ipcRenderer.on('open-url', callback),
  reloadWindow() {
    ipcRenderer.send('electron-reload')
  },
  quitAndInstall() {
    ipcRenderer.send('electron-quit-and-install')
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

type electronAPIType = typeof electronAPI
export { electronAPIType }
