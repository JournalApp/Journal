import { contextBridge, ipcRenderer, clipboard } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onPaste: (callback: any) => ipcRenderer.on('paste', callback),
  onCopy: (callback: any) => ipcRenderer.on('copy', callback),
  storeIndex: {
    get(val: any) {
      return ipcRenderer.sendSync('electron-storeIndex-get', val)
    },
    set(property: any, val: any) {
      ipcRenderer.send('electron-storeIndex-set', property, val)
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
})
