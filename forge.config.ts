import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './assets/icons/journal-macos-icon.icns',
    protocols: [
      {
        name: 'Journal',
        schemes: ['journal'],
      },
    ],
    osxSign: {
      identity: '',
      optionsForFile: () => {
        return {
          entitlements: './entitlements.plist',
          hardenedRuntime: true,
          'entitlements-inherit': './entitlements.plist',
          signatureFlags: 'library',
        };
      },
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID as string,
      appleIdPassword: process.env.APPLE_ID_PASSWORD as string,
      teamId: process.env.TEAM_ID as string,
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'journal.do',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({
      options: {
        mimeType: ['x-scheme-handler/journal'],
      },
    }),
    new MakerDMG({
      background: './assets/background.tiff',
      icon: './assets/icons/journal-macos-icon.icns',
      format: 'ULFO',
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
      devContentSecurityPolicy:
        "connect-src 'self' https://svqgaylgvcivfbkuqlei.supabase.co https://hsbagpjhlxzabpiitqjw.supabase.co https://tnfdauoowyrpxqodomqn.supabase.co http://localhost:8000 ws://localhost:8000 https://supabase.journal.local:8443 wss://supabase.journal.local:8443 https://kms.journal.do https://kms.journal.local https://capture.journal.local https://capture.journal.do https://s.journal.local https://s.journal.do 'unsafe-eval'",
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
