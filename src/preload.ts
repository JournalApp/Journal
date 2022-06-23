import { contextBridge, ipcRenderer, clipboard } from 'electron'
import { EventMessage } from 'posthog-node'

const electronAPI = {
  onPaste: (callback: any) => ipcRenderer.on('paste', callback),
  onCopy: (callback: any) => ipcRenderer.on('copy', callback),
  onUpdateDownloaded: (callback: any) => ipcRenderer.on('update-downloaded', callback),
  async capture({ distinctId, event, properties }: EventMessage) {
    await ipcRenderer.invoke('analytics-capture', { distinctId, event, properties })
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
  },
  preferences: {
    async set(user_id: string, set: object) {
      await ipcRenderer.invoke('preferences-set', user_id, set)
    },
    async deleteAll(user_id: string) {
      await ipcRenderer.invoke('preferences-delete-all', user_id)
    },
    getAll() {
      return ipcRenderer.sendSync('preferences-get-all')
    },
  },
  app: {
    async setKey(set: object) {
      ipcRenderer.invoke('app-set-key', set)
    },
    getKey(key: string) {
      return ipcRenderer.send('app-get-key', key)
    },
  },
  handleSpellCheck: (callback: any) => ipcRenderer.once('electron-handleSpellCheck', callback),
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
