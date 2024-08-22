import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import {
  EntryList,
  Calendar,
  Menu,
  TrafficLightMenu,
  FadeOut,
  ScrollToToday,
  FeedbackWidget,
  Prompts,
  Splash,
} from '@/components';
import { AppearanceProvider, EntriesProvider, UserProvider } from '@/context';
import { theme } from '@/themes';
import { createCssVars, logger  } from '@/utils';
import {
  defaultUserPreferences,
  getColorTheme,
  ColorTheme,
  FontFace,
  FontSize,
  CalendarOpen,
  PromptsOpen,
  PromptSelectedId,
  SpellCheckEnabled,
  getBaseThemeWithOverrides,
} from '@/config';
import { electronAPIType } from './preload';
import { serializeError } from 'serialize-error';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

window.electronAPI.onTestSetDate((_event: any, date: Date) => {
  class TestDate extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(date);
      } else {
        // @ts-expect-error replacing ignore
        super(...args);
      }
    }

    static now() {
      return Date.now() + (date.getTime() - Date.now());
    }

    static parse(s: string) {
      return Date.parse(s);
    }

    static UTC(...args: any[]) {
      // @ts-expect-error replacing ignore
      return Date.UTC(...args);
    }

    static readonly [Symbol.species] = Date;
  }

  // Use the new TestDate class in your tests
  (global as any).TestDate = TestDate;
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

declare global {
  interface Window {
    electronAPI: electronAPIType
    clipboardData?: any
  }
}

const userPreferences = window.electronAPI.preferences.getAll();

const initialColorTheme: ColorTheme = userPreferences?.theme || defaultUserPreferences.theme;

const initialFontFace: FontFace = userPreferences?.fontFace || defaultUserPreferences.fontFace;

const initialFontSize: FontSize = userPreferences?.fontSize || defaultUserPreferences.fontSize;

const initialCalendarOpen: CalendarOpen =
  userPreferences?.calendarOpen || defaultUserPreferences.calendarOpen;

const initialPromptsOpen: PromptsOpen =
  userPreferences?.promptsOpen || defaultUserPreferences.promptsOpen;

if (userPreferences?.promptSelectedId && typeof userPreferences.promptSelectedId == 'string') {
  userPreferences.promptSelectedId = parseInt(userPreferences.promptSelectedId);
}
const initialPromptSelectedId: PromptSelectedId =
  userPreferences?.promptSelectedId || defaultUserPreferences.promptSelectedId;

const initialSpellCheckEnabled: SpellCheckEnabled =
  userPreferences?.spellCheckEnabled || defaultUserPreferences.spellCheckEnabled;

const GlobalStyle = createGlobalStyle`
:root {
  ${createCssVars(getColorTheme(initialColorTheme))};
  ${createCssVars(getBaseThemeWithOverrides(userPreferences))};
}

body {
  box-sizing: border-box;
  color: ${theme('color.primary.main')};
  background-color: ${theme('color.primary.surface')};
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -webkit-app-region: drag;
  user-select: none;
}

hr {
  background-color: ${theme('color.primary.main')}!important;
  height: 1px!important;
  opacity: 0.1;
}

button {
  -webkit-app-region: no-drag;
}

.slate-hand-strikethrough {
  background-image: ${theme('style.handStriketrough')};
  background-position: center;
  background-repeat: repeat-x;

}

/* * { border: 1px solid red} */

`;

const Container = styled.div`
  /* contain: paint; */
  overflow-x: clip;
`;

const NoDragScrollBars = styled.div`
  -webkit-app-region: no-drag;
  position: fixed;
  top: 0px;
  bottom: 0px;
  right: 0px;
  width: 12px;
`;

function App() {
  window.onerror = function (message, source, lineno, colno, error) {
    logger('window.onerror');
    const lastUser = window.electronAPI.app.getKey('lastUser');
    const serialized = serializeError(error);
    const name = serialized?.name ? ` ${serialized.name}` : 'error';
    window.electronAPI.capture({
      distinctId: lastUser,
      type: 'error',
      event: name,
      properties: serialized,
    });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyle />
      <Splash />
      <UserProvider>
        <EntriesProvider>
          <AppearanceProvider
            initialColorTheme={initialColorTheme}
            initialFontFace={initialFontFace}
            initialFontSize={initialFontSize}
            initialCalendarOpen={initialCalendarOpen}
            initialSpellCheckEnabled={initialSpellCheckEnabled}
          >
            <FadeOut />
            <Menu />
            <TrafficLightMenu />
            <Calendar />
            <ScrollToToday />
            <Prompts
              initialPromptsOpen={initialPromptsOpen}
              initialPromptSelectedId={initialPromptSelectedId}
            />
            <FeedbackWidget />
            <NoDragScrollBars />
            <Container>
              <EntryList />
            </Container>
          </AppearanceProvider>
        </EntriesProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export { App };
