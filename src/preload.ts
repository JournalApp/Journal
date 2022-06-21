import { contextBridge, ipcRenderer, clipboard } from 'electron'

const electronAPI = {
  onPaste: (callback: any) => ipcRenderer.on('paste', callback),
  onCopy: (callback: any) => ipcRenderer.on('copy', callback),
  onUpdateDownloaded: (callback: any) => ipcRenderer.on('update-downloaded', callback),
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
  storeUserPreferences: {
    get(val: any) {
      return ipcRenderer.sendSync('electron-storeUserPreferences-get', val)
    },
    getAll() {
      return ipcRenderer.sendSync('electron-storeUserPreferences-get-all')
    },
    set(property: any, val: any) {
      ipcRenderer.send('electron-storeUserPreferences-set', property, val)
    },
    clearAll() {
      ipcRenderer.send('electron-storeUserPreferences-clear-all')
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
