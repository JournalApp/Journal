import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { EventMessage } from './services/analytics';
import type { Entry, Tag, EntryTag, EntryTagProperty, Subscription } from '@/types';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

type IpcRendererCallback = (event: IpcRendererEvent, ...args: any[]) => void;

const electronAPI = {
  onPaste: (callback: IpcRendererCallback) => ipcRenderer.on('paste', callback),
  onCopy: (callback: IpcRendererCallback) => ipcRenderer.on('copy', callback),
  onUpdateDownloaded: (callback: IpcRendererCallback) => ipcRenderer.on('update-downloaded', callback),
  onEntryPending: (callback: IpcRendererCallback) => ipcRenderer.on('sqlite-entry-event', callback),
  onPowerMonitorResume: (callback: IpcRendererCallback) => ipcRenderer.on('power-monitor-resume', callback),
  onTestSetDate: (callback: IpcRendererCallback) => ipcRenderer.on('test-set-date', callback),
  onTagPending: (callback: IpcRendererCallback) => ipcRenderer.on('sqlite-tag-event', callback),
  async capture({ distinctId, event, properties, type }: EventMessage) {
    await ipcRenderer.invoke('analytics-capture', { distinctId, event, properties, type });
  },
  mdxSerialize: async (source: string) => {
    return (await ipcRenderer.invoke('mdx-serialize', source)) as MDXRemoteSerializeResult;
  },
  saveFile: async (data: string, format: 'txt' | 'json') => {
    await ipcRenderer.invoke('journal-export', data, format);
  },
  cache: {
    // Entry
    async addOrUpdateEntry(entry: Entry) {
      await ipcRenderer.invoke('cache-add-or-update-entry', entry);
    },
    async deleteEntry(query: any) {
      await ipcRenderer.invoke('cache-delete-entry', query);
    },
    async deleteAll(user_id: string) {
      await ipcRenderer.invoke('cache-delete-all', user_id);
    },
    async updateEntry(set: any, where: any) {
      await ipcRenderer.invoke('cache-update-entry', set, where);
    },
    async updateEntryProperty(set: object, where: object) {
      await ipcRenderer.invoke('cache-update-entry-property', set, where);
    },
    async getDays(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-days', user_id)) as Entry[];
    },
    async getEntries(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-entries', user_id)) as Entry[];
    },
    async getPendingDeleteEntries(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-pending-delete-entries', user_id)) as Entry[];
    },
    async getPendingInsertEntries(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-pending-insert-entries', user_id)) as Entry[];
    },
    async getPendingUpdateEntries(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-pending-update-entries', user_id)) as Entry[];
    },
    async doesEntryExist(user_id: string, day: string) {
      return await ipcRenderer.invoke('cache-does-entry-exist', user_id, day);
    },
    async getEntriesCount(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-entries-count', user_id)) as number;
    },
    // Tags
    async getTags(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-tags', user_id)) as Tag[];
    },
    async getDaysWithTag(tag_id: string) {
      return (await ipcRenderer.invoke('cache-get-days-with-tag', tag_id)) as string[];
    },
    async getTag(id: string) {
      return (await ipcRenderer.invoke('cache-get-tag', id)) as Tag;
    },
    async getPendingDeleteTags(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-pending-delete-tags', user_id)) as Tag[];
    },
    async getPendingUpdateTags(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-pending-update-tags', user_id)) as Tag[];
    },
    async getPendingInsertTags(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-pending-insert-tags', user_id)) as Tag[];
    },
    async deleteTag(tag_id: string) {
      await ipcRenderer.invoke('cache-delete-tag', tag_id);
    },
    async addOrUpdateTag(tag: Tag) {
      await ipcRenderer.invoke('cache-add-or-update-tag', tag);
    },
    async updateTagProperty(set: any, tag_id: string) {
      await ipcRenderer.invoke('cache-update-tag-property', set, tag_id);
    },

    // Entry tags
    async getEntryTags(user_id: string) {
      return (await ipcRenderer.invoke('cache-get-entry-tags', user_id)) as EntryTag[];
    },
    async getEntryTagsOnDay(user_id: string, day: string) {
      return (await ipcRenderer.invoke('cache-get-entry-tags-on-day', user_id, day)) as EntryTag[];
    },
    async getPendingInsertEntryTags(user_id: string) {
      return (await ipcRenderer.invoke(
        'cache-get-pending-insert-entry-tags',
        user_id
      )) as EntryTag[];
    },
    async addOrUpdateEntryTag(entryTag: EntryTag) {
      await ipcRenderer.invoke('cache-add-or-update-entry-tag', entryTag);
    },
    async updateEntryTagProperty(
      set: EntryTagProperty,
      user_id: string,
      day: string,
      tag_id: string
    ) {
      await ipcRenderer.invoke('cache-update-entry-tag-property', set, user_id, day, tag_id);
    },
    async getPendingDeleteEntryTags(user_id: string) {
      return (await ipcRenderer.invoke(
        'cache-get-pending-delete-entry-tags',
        user_id
      )) as EntryTag[];
    },
    async deleteEntryTag(user_id: string, tag_id: string, day: string) {
      await ipcRenderer.invoke('cache-delete-entry-tag', user_id, tag_id, day);
    },
    async getPendingUpdateEntryTags(user_id: string) {
      return (await ipcRenderer.invoke(
        'cache-get-pending-update-entry-tags',
        user_id
      )) as EntryTag[];
    },

    // User
  },
  preferences: {
    async set(user_id: string, set: object) {
      await ipcRenderer.invoke('preferences-set', user_id, set);
    },
    async deleteAll(user_id: string) {
      await ipcRenderer.invoke('preferences-delete-all', user_id);
    },
    getAll(user_id?: string) {
      return ipcRenderer.sendSync('preferences-get-all', user_id);
    },
  },
  app: {
    async setKey(set: object) {
      ipcRenderer.invoke('app-set-key', set);
    },
    getKey(key: string) {
      return ipcRenderer.sendSync('app-get-key', key);
    },
  },
  user: {
    async saveSecretKey(user_id: string, secretKey: object) {
      await ipcRenderer.invoke('user-save-secret-key', user_id, secretKey);
    },
    async getSecretKey(user_id: string) {
      return await ipcRenderer.invoke('app-get-secret-key', user_id);
    },
    async saveSubscription(user_id: string, subscription: Subscription) {
      await ipcRenderer.invoke('user-save-subscription', user_id, subscription);
    },
    getSubscription(user_id: string) {
      return ipcRenderer.sendSync('user-get-subscription', user_id) as Subscription;
    },
    async add(id: string) {
      await ipcRenderer.invoke('cache-add-user', id);
    },
  },
  handleSpellCheck: (callback: IpcRendererCallback) => ipcRenderer.once('electron-handleSpellCheck', callback),
  disableSpellCheck: async () => {
    await ipcRenderer.invoke('electron-disableSpellCheck');
  },
  enableSpellCheck: async () => {
    await ipcRenderer.invoke('electron-enableSpellCheck');
  },
  handleOpenUrl: (callback: IpcRendererCallback) => ipcRenderer.on('open-url', callback),
  reloadWindow() {
    ipcRenderer.send('electron-reload');
  },
  quitAndInstall() {
    ipcRenderer.send('electron-quit-and-install');
  },
  isTesting() {
    return ipcRenderer.sendSync('is-testing') as boolean;
  },
  getSystemIdleState() {
    return ipcRenderer.sendSync('power-monitor-idle-state') as string;
  },
  isOnline() {
    return ipcRenderer.sendSync('net-is-online') as boolean;
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

type electronAPIType = typeof electronAPI;
export { electronAPIType };
