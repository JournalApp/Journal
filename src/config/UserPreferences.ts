import { lightTheme, darkTheme, forestTheme, cappuccinoTheme } from '@/themes';

const fontSizeMap = {
  small: 18,
  normal: 21,
  large: 23,
};
type FontSize = keyof typeof fontSizeMap;

const fontFaceMap = {
  inter: 'Inter var',
  novela: 'Novela',
};
type FontFace = keyof typeof fontFaceMap;

const colorThemeMap = {
  light: lightTheme,
  dark: darkTheme,
  forest: forestTheme,
  cappuccino: cappuccinoTheme,
};
type ColorTheme = keyof typeof colorThemeMap;

const spellCheckMap = {
  true: 'true',
  false: 'false',
};
type SpellCheckEnabled = keyof typeof spellCheckMap;

const calendarOpenMap = {
  opened: { entriesOffset: 200, miniDatesVisibility: 'visible' },
  closed: { entriesOffset: 0, miniDatesVisibility: 'hidden' },
};
type CalendarOpen = keyof typeof calendarOpenMap;

type PromptsOpen = 'opened' | 'closed';

type PromptSelectedId = number;

const defaultUserPreferences = {
  fontSize: 'normal' as FontSize,
  fontFace: 'inter' as FontFace,
  theme: 'light' as ColorTheme,
  calendarOpen: 'closed' as CalendarOpen,
  spellCheckEnabled: 'true' as SpellCheckEnabled,
  promptsOpen: 'closed' as PromptsOpen,
  promptSelectedId: 1 as PromptSelectedId,
};

const baseTheme = {
  appearance: {
    fontFace: 'Inter var',
    fontSize: '21px',
    entriesOffset: '0',
    miniDatesVisibility: 'hidden',
  },
  animation: {
    time: {
      veryFast: '50ms',
      fast: '100ms',
      normal: '200ms',
      long: '400ms',
    },
    timingFunction: {
      dynamic: 'cubic-bezier(0.31, 0.3, 0.17, 0.99)',
    },
  },
};

const getFontSize = (name: FontSize) => {
  return fontSizeMap[name] ? fontSizeMap[name] : fontSizeMap['normal'];
};

const getFontFace = (name: FontFace) => {
  return fontFaceMap[name] ? fontFaceMap[name] : fontFaceMap['inter'];
};

const getColorTheme = (name: ColorTheme) => {
  return colorThemeMap[name] ? colorThemeMap[name] : colorThemeMap['light'];
};

const getSpellCheckIsEnabled = (name: SpellCheckEnabled) => {
  return spellCheckMap[name] ? spellCheckMap[name] : spellCheckMap['true'];
};

const getCalendarIsOpen = (state: CalendarOpen) => {
  return calendarOpenMap[state] ? calendarOpenMap[state] : calendarOpenMap['closed'];
};

const getBaseThemeWithOverrides = (overrides: any) => {
  const theme = { ...baseTheme };

  if (overrides && overrides.fontFace) {
    theme.appearance.fontFace = getFontFace(overrides.fontFace);
  }

  if (overrides && overrides.fontSize) {
    theme.appearance.fontSize = getFontSize(overrides.fontSize) + 'px';
  }

  if (overrides && overrides.calendarOpen) {
    theme.appearance.entriesOffset = getCalendarIsOpen(overrides.calendarOpen).entriesOffset + 'px';
    theme.appearance.miniDatesVisibility = getCalendarIsOpen(
      overrides.calendarOpen
    ).miniDatesVisibility;
  }

  return theme;
};

export {
  baseTheme,
  getBaseThemeWithOverrides,
  getFontSize,
  getFontFace,
  getColorTheme,
  getCalendarIsOpen,
  getSpellCheckIsEnabled,
  defaultUserPreferences,
  ColorTheme,
  FontSize,
  FontFace,
  CalendarOpen,
  SpellCheckEnabled,
  PromptsOpen,
  PromptSelectedId,
};
