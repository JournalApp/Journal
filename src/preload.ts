import { contextBridge, ipcRenderer, clipboard } from 'electron'
import { EventMessage } from './services/analytics'
import type { Tag } from './components/EntryTags/types'

const electronAPI = {
  onPaste: (callback: any) => ipcRenderer.on('paste', callback),
  onCopy: (callback: any) => ipcRenderer.on('copy', callback),
  onUpdateDownloaded: (callback: any) => ipcRenderer.on('update-downloaded', callback),
  async capture({ distinctId, event, properties, type }: EventMessage) {
    await ipcRenderer.invoke('analytics-capture', { distinctId, event, properties, type })
  },
  cache: {
    async addOrUpdateEntry(query: any) {
      await ipcRenderer.invoke('cache-add-or-update-entry', query)
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
    async addUser(id: string) {
      await ipcRenderer.invoke('cache-add-user', id)
    },
    async getDays(user_id: string) {
      return await ipcRenderer.invoke('cache-get-days', user_id)
    },
    async getEntries(user_id: string) {
      return await ipcRenderer.invoke('cache-get-entries', user_id)
    },
    async getDeletedDays(user_id: string) {
      return await ipcRenderer.invoke('cache-get-deleted-days', user_id)
    },
    async getTags(user_id: string) {
      return await ipcRenderer.invoke('cache-get-tags', user_id)
    },
    async getDeletedTags(user_id: string) {
      return await ipcRenderer.invoke('cache-get-deleted-tags', user_id)
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
