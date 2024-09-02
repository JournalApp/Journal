import React, { useState, useEffect, useRef } from 'react';
import { css } from 'styled-components';
import dayjs from 'dayjs';
import {
  usePlateEditorState,
  useEventPlateId,
  createPluginFactory,
  deselectEditor,
  select,
  focusEditor,
  isEditorFocused,
  usePlateActions,
  withPlate,
  createTEditor,
  createPlateUI,
  ELEMENT_H3,
  MARK_HIGHLIGHT,
  MARK_CODE,
  withProps,
  StyledElement,
  Plate,
  createBoldPlugin,
  createCodePlugin,
  createHeadingPlugin,
  createItalicPlugin,
  createListPlugin,
  createParagraphPlugin,
  createStrikethroughPlugin,
  createUnderlinePlugin,
  createHorizontalRulePlugin,
  createPlugins,
  createAutoformatPlugin,
  createResetNodePlugin,
  createHighlightPlugin,
} from '@udecode/plate';
import { ContextMenu, FormatToolbar } from '@/components';
import { EntryAside } from './EntryAside';
import { CONFIG, defaultContent } from '@/config';
import { countEntryWords, logger, awaitTimeout } from '@/utils';
import { useUserContext, useEntriesContext } from '@/context';
import { Container, MainWrapper, MiniDate } from './styled';
import { theme } from '@/themes';
import { resetBlockTypePlugin } from '../../config/resetBlockTypePlugin';
import type { Entry, Day } from '@/types';
import * as Const from '@/constants';
import { LimitReached } from './LimitReached';

const MARK_HAND_STRIKETHROUGH = 'hand-strikethrough';

type EntryBlockProps = {
  entryDay: Day;
  entryDayCount?: number;
  entriesObserver: IntersectionObserver;
  cachedEntry?: any;
  ref?: any;
};

const isToday = (day: any) => {
  return day.toString() == dayjs().format('YYYY-MM-DD');
};

const EntryItem = ({ entryDay, cachedEntry, entriesObserver }: EntryBlockProps) => {
  const wordCount = useRef(countEntryWords(cachedEntry ? cachedEntry.content : ''));
  const [initialValue, setInitialValue] = useState(cachedEntry?.content ?? defaultContent);
  const [shouldFocus, setShouldFocus] = useState(isToday(entryDay));
  const [freePlanLimitReached, setFreePlanLimitReached] = useState(false);
  const contextMenuVisible = useRef(false);
  const toggleContextMenu = useRef(null);
  const setEditorFocusedContextMenu = useRef(null);
  const setEditorFocusedFormatToolbar = useRef(null);
  const debugValue = useRef(cachedEntry?.content ?? []);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const { session, subscription, serverTimeNow } = useUserContext();
  const {
    editorsRef,
    userEntries,
    invokeForceSaveEntry,
    invokeRerenderEntry,
    cacheAddOrUpdateEntry,
    cacheUpdateEntryProperty,
    rerenderCalendar,
  } = useEntriesContext();
  const saveDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const id = `${entryDay}-editor`;

  logger(`Entry render`);

  const setEditorFocused = (focused: boolean) => {
    if (setEditorFocusedContextMenu.current) {
      setEditorFocusedContextMenu.current(focused);
    }
    if (setEditorFocusedFormatToolbar.current) {
      setEditorFocusedFormatToolbar.current(focused);
    }
  };

  const setContextMenuVisible = (val: boolean) => {
    contextMenuVisible.current = val;
  };

  const isContextMenuVisible = () => {
    return contextMenuVisible.current;
  };

  const onChangeDebug = (newValue: any) => {
    debugValue.current = newValue;

    if (userEntries.current.some((entry) => entry.day == entryDay)) {
      const i = userEntries.current.findIndex((e) => e.day == entryDay);
      userEntries.current[i].content = newValue;
    }

    const previousWordCount = wordCount.current;
    const currentWordCount = countEntryWords(newValue);
    if (!!previousWordCount != !!currentWordCount) {
      logger('Changed to has content or to has no content');
      rerenderCalendar();
    }

    wordCount.current = currentWordCount;
  };

  const saveEntry = async (day: Day, contentJson: any) => {
    const user_id = session.user.id;
    const modified_at = serverTimeNow();
    const content = JSON.stringify(contentJson);
    logger(`Save entry day: ${day}, modified_at: ${modified_at}`);
    if (userEntries.current.some((entry) => entry.day == day)) {
      logger('Entry exists, updating...');
      cacheUpdateEntryProperty(
        { modified_at, content, sync_status: 'pending_update' },
        { user_id, day },
      );
    } else {
      logger('Entry doesnt exist, inserting...');
      const entryToInsert: Entry = {
        user_id,
        day,
        created_at: modified_at,
        modified_at,
        content,
        revision: 0,
        sync_status: 'pending_insert',
      };
      // Cache: save
      cacheAddOrUpdateEntry({ ...entryToInsert });

      // Local state: add entry
      entryToInsert.content = contentJson;
      userEntries.current.push({ ...entryToInsert });
    }
  };

  const forceSaveEntry = async () => {
    await saveEntry(entryDay, debugValue.current);
  };

  const ShouldFocus = () => {
    const editor = usePlateEditorState(useEventPlateId());
    useEffect(() => {
      focusEditor(editor);
      select(editor, {
        path: [0, 0],
        offset: 0,
      });
      setShouldFocus(false);
      logger(`Focus set to ${entryDay}`);
    }, []);
    return <></>;
  };

  const EditorRefAssign = () => {
    const editor = usePlateEditorState(useEventPlateId());
    if (editor) {
      editorsRef.current[entryDay] = editor;
    }
    return <></>;
  };

  const checkPlanLimits = async () => {
    await awaitTimeout(5000);
    logger('checkPlanLimits');
    if (isToday(entryDay) && subscription == null) {
      const limit = Const.entriesLimit;
      const count = await window.electronAPI.cache.getEntriesCount(session.user.id);
      if (count > limit) {
        setFreePlanLimitReached(true);
      }
    } else {
      setFreePlanLimitReached(false);
    }
  };

  //////////////////////////
  // ⛰ useEffect on mount
  //////////////////////////

  useEffect(() => {
    invokeForceSaveEntry.current[entryDay] = forceSaveEntry;
    invokeRerenderEntry.current[entryDay] = rerenderEntry;
    entriesObserver.observe(editorRef.current);

    // Scroll to entry if Today
    if (entryDay == dayjs().format('YYYY-MM-DD')) {
      editorRef.current.scrollIntoView({ block: 'start' });
    }

    // Plan limits
    checkPlanLimits();

    // Remove observers
    return () => {
      logger('Entry unmounted');
      if (editorRef.current) {
        entriesObserver.unobserve(editorRef.current);
        // resizeObserver.unobserve(editorRef.current)
      }
      if (saveDebounceTimer.current) {
        clearTimeout(saveDebounceTimer.current);
        saveDebounceTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    checkPlanLimits();
  }, [subscription]);

  const debounceSaveEntry = () => {
    clearTimeout(saveDebounceTimer.current);
    saveDebounceTimer.current = setTimeout(() => {
      saveEntry(entryDay, debugValue.current);
    }, 1000);
  };

  const editableProps = {
    placeholder: "What's on your mind…",
    autoFocus: false,
  };

  // Plugin

  const createEventEditorPlugin = createPluginFactory({
    key: 'events-editor-for-toolbar',
    handlers: {
      onFocus: (editor) => (e) => {
        logger('Focus');
        setEditorFocused(true);
      },
      onBlur: (editor) => () => {
        logger('Blur');
        setEditorFocused(false);
        // Deselect to avoid 2 context menus visible on separate entries
        deselectEditor(editor);
        // deselect(editor)
      },
      onChange: (editor) => () => {
        logger('Change');
        const isContentChange = editor.operations.some((op) => 'set_selection' !== op.type);
        if (isContentChange) {
          debounceSaveEntry();
        }
      },
      onContextMenu: () => (e) => {
        // Invoke function in ContextMenu using Ref
        toggleContextMenu.current(e);
      },
    },
  });

  const createHandStrikethroughPlugin = createPluginFactory({
    key: MARK_HAND_STRIKETHROUGH,
  });

  const plugins = createPlugins(
    [
      // elements
      createParagraphPlugin(), // paragraph element
      createHeadingPlugin({ options: { levels: 3 } }), // heading elements
      createListPlugin(),
      createHorizontalRulePlugin(),
      // marks
      createBoldPlugin(), // bold mark
      createItalicPlugin(), // italic mark
      createUnderlinePlugin(), // underline mark
      createStrikethroughPlugin(), // strikethrough mark
      createCodePlugin(), // code mark
      createEventEditorPlugin(),
      createAutoformatPlugin(CONFIG.autoformat),
      createResetNodePlugin(resetBlockTypePlugin),
      createHighlightPlugin(),
      createHandStrikethroughPlugin({
        key: MARK_HAND_STRIKETHROUGH,
        isLeaf: true,
        deserializeHtml: {
          rules: [
            {
              validNodeName: ['MARK'],
            },
          ],
        },
        options: {
          clear: MARK_HAND_STRIKETHROUGH,
        },
      }),
    ],
    {
      // Plate components
      // Override H3 color (#434343) provided by createPlateUI
      components: createPlateUI({
        [ELEMENT_H3]: withProps(StyledElement, {
          as: 'h3',
          styles: {
            root: css`
              margin: 1em 0 1px;
              font-size: 1.25em;
              font-weight: 500;
              line-height: 1.3;
            `,
          },
        }),
        [MARK_CODE]: withProps(StyledElement, {
          as: 'code',
          styles: {
            root: css`
              white-space: pre-wrap;
              font-size: 85%;
              font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
              background-color: ${theme('color.code.surface', 0.1)};
              color: ${theme('color.code.main')};
              border-radius: 3px;
              padding: 0.2em 0.4em;
              line-height: normal;
            `,
          },
        }),
        [MARK_HIGHLIGHT]: withProps(StyledElement, {
          as: 'mark',
          styles: {
            root: css`
              background-color: ${theme('color.highlight.surface')};
              color: ${theme('color.highlight.main')};
              border-radius: 100px;
              padding: 3px 5px;
              margin: -5px;
              mix-blend-mode: ${theme('style.highlightBlendMode')};
            `,
          },
        }),
      }),
    },
  );

  const rerenderEntry = () => {
    logger(`rerenderEntry on ${entryDay}`);
    if (editorsRef.current[entryDay]) {
      const isFocused = isEditorFocused(editorsRef.current[entryDay]);
      const entry = userEntries.current.find((e) => e.day == entryDay) as any;
      if (entry) {
        setInitialValue(entry.content);
        const newEditor = withPlate(createTEditor(), { id, plugins });
        usePlateActions(id).value(entry.content);
        usePlateActions(id).editor(newEditor);
        editorsRef.current[entryDay] = newEditor;
        if (isFocused) {
          setShouldFocus(true);
        }

        // Word count
        const previousWordCount = wordCount.current;
        const currentWordCount = countEntryWords(entry.content);
        if (!!previousWordCount != !!currentWordCount) {
          logger('Changed to has content or to has no content');
          rerenderCalendar();
        }
        wordCount.current = currentWordCount;
      }
    }
  };

  const showMiniDate = (day: any) => {
    if (isToday(day)) {
      return 'Today';
    } else {
      return dayjs(dayjs(day.toString(), 'YYYY-MM-DD')).format('D MMMM YYYY');
    }
  };

  return (
    <Container ref={editorRef} id={`${entryDay}-entry`}>
      <MainWrapper>
        <MiniDate>{showMiniDate(entryDay)}</MiniDate>
        {freePlanLimitReached ? (
          <LimitReached />
        ) : (
          <Plate
            data-testid={`${entryDay}-entry`}
            id={id}
            editableProps={editableProps}
            initialValue={initialValue}
            onChange={onChangeDebug}
            plugins={plugins}
          >
            <ContextMenu
              setIsEditorFocused={setEditorFocusedContextMenu}
              setContextMenuVisible={setContextMenuVisible}
              toggleContextMenu={toggleContextMenu}
            />
            <FormatToolbar
              setIsEditorFocused={setEditorFocusedFormatToolbar}
              isContextMenuVisible={isContextMenuVisible}
            />
            {shouldFocus && <ShouldFocus />}
            <EditorRefAssign />
          </Plate>
        )}
      </MainWrapper>
      <EntryAside
        freePlanLimitReached={freePlanLimitReached}
        wordCount={wordCount}
        date={entryDay}
      />
    </Container>
  );
};

export { EntryItem };
