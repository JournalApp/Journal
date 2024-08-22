import { ipcMain, dialog } from 'electron';
import { logger } from '../utils';
import fs from 'fs';

ipcMain.handle('journal-export', async (event, data: string, format: 'txt' | 'json') => {
  logger('journal-export');
  const options = {
    title: 'Save file',
    defaultPath: 'Journal',
    buttonLabel: 'Save',

    filters: [
      { name: format, extensions: [format] },
      { name: 'All Files', extensions: ['*'] },
    ],
  };

  dialog.showSaveDialog(null, options).then(({ filePath }) => {
    if (filePath) {
      try {
        fs.writeFileSync(filePath, data, 'utf8');
      } catch (error) {
        dialog.showMessageBox({
          message: 'Failed to save the file!',
          type: 'error',
        });
      }
    }
  });
});
