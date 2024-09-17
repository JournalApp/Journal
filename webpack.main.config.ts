import path from 'path';
import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  //target: 'electron-main',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins,
  resolve: {
    alias: { '@': path.join(__dirname, './src') },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json', '.sql'],
  },
};
