import { contextBridge, ipcRenderer, clipboard } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onPaste: (callback: any) => ipcRenderer.on('paste', callback),
  onCopy: (callback: any) => ipcRenderer.on('copy', callback),
  storeIndex: {
    get() {
      return ipcRenderer.sendSync('electron-storeIndex-get')
    },
    set(val: any) {
      ipcRenderer.send('electron-storeIndex-set', val)
    },
  },
  storeEntries: {
    get(val: any) {
      return ipcRenderer.sendSync('electron-storeEntries-get', val)
    },
    getAll() {
      return ipcRenderer.sendSync('electron-storeEntries-get-all')
    },
    set(property: any, val: any) {
      ipcRenderer.send('electron-storeEntries-set', property, val)
    },
  },
  handleSpellCheck: (callback: any) => ipcRenderer.once('electron-handleSpellCheck', callback),
})
