import { ipcMain } from 'electron'
import { logger, isDev } from '../utils'
import { serialize } from 'next-mdx-remote/serialize'

ipcMain.handle('mdx-serialize', async (event, source: string) => {
  logger('mdx-serialize')
  try {
    return await serialize(source)
  } catch (error) {
    logger(`error`)
    logger(error)
    return await serialize('')
  }
})
