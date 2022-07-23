import React, { useState, useEffect, useRef } from 'react'
import styled, { css } from 'styled-components'
import dayjs from 'dayjs'
import { usePlateEditorState, useEventPlateId } from '@udecode/plate'
import { ContextMenu, FormatToolbar, EntryAside } from 'components'
import { createPluginFactory, useOnClickOutside, deselectEditor } from '@udecode/plate'
import { select, deselect, getNodeString } from '@udecode/plate'
import { focusEditor, usePlateEditorRef } from '@udecode/plate'
import { CONFIG, defaultContent } from 'config'
import { countWords, isUnauthorized, encryptEntry, decryptEntry } from 'utils'
import { supabase, logger } from 'utils'
import { useUserContext, useEntriesContext } from 'context'
import { Container, MainWrapper, MiniDate } from './styled'
import { electronAPIType } from '../../preload'
import { theme } from 'themes'
import { resetBlockTypePlugin } from '../../config/resetBlockTypePlugin'

import {
  createPlateUI,
  ELEMENT_H3,
  MARK_HIGHLIGHT,
  withProps,
  StyledElement,
  Plate,
  createBlockquotePlugin,
  createBoldPlugin,
  createCodeBlockPlugin,
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
} from '@udecode/plate'

const MARK_HAND_STRIKETHROUGH = 'hand-strikethrough'

type EntryBlockProps = {
  entryDay: string
  entryDayCount?: number
  entriesObserver: IntersectionObserver
  cachedEntry?: any
  ref?: any
  setEntryHeight: () => void
  shouldScrollToDay: (day: string) => boolean
  clearScrollToDay: () => void
  cacheAddOrUpdateEntry: electronAPIType['cache']['addOrUpdateEntry']
  cacheUpdateEntry: electronAPIType['cache']['updateEntry']
  cacheUpdateEntryProperty: electronAPIType['cache']['updateEntryProperty']
}

const isToday = (day: any) => {
  return day.toString() == dayjs().format('YYYY-MM-DD')
}

const countEntryWords = (content: any) => {
  if (Array.isArray(content)) {
    return countWords(content.map((n: any) => getNodeString(n)).join(' '))
  } else {
    return 0
  }
}

const Entry = ({
  entryDay,
  cachedEntry,
  setEntryHeight,
  entriesObserver,
  shouldScrollToDay,
  clearScrollToDay,
  cacheAddOrUpdateEntry,
  cacheUpdateEntry,
  cacheUpdateEntryProperty,
}: EntryBlockProps) => {
  const [wordCount, setWordCount] = useState(
    countEntryWords(cachedEntry ? cachedEntry.content : '')
  )
  const [needsSavingToServer, setNeedsSavingToServer] = useState(false)
  const [needsSavingToServerModifiedAt, setNeedsSavingToServerModifiedAt] = useState('')
  const [initialValue, setInitialValue] = useState(cachedEntry?.content ?? [])
  const [shouldFocus, setShouldFocus] = useState(isToday(entryDay))
  const contextMenuVisible = useRef(false)
  const toggleContextMenu = useRef(null)
  const setEditorFocusedContextMenu = useRef(null)
  const setEditorFocusedFormatToolbar = useRef(null)
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const debugValue = useRef(cachedEntry?.content ?? [])
  const editorRef = useRef(null)
  const { session, signOut, getSecretKey, serverTimeNow } = useUserContext()
  const { editorsRef } = useEntriesContext()
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  logger(`Entry render`)

  const setEditorFocused = (focused: boolean) => {
    if (setEditorFocusedContextMenu.current) {
      setEditorFocusedContextMenu.current(focused)
    }
    if (setEditorFocusedFormatToolbar.current) {
      setEditorFocusedFormatToolbar.current(focused)
    }
  }

  const setContextMenuVisible = (val: boolean) => {
    contextMenuVisible.current = val
  }

  const isContextMenuVisible = () => {
    return contextMenuVisible.current
  }

  const onChangeDebug = (newValue: any) => {
    setWordCount(countEntryWords(newValue))
    debugValue.current = newValue
  }

  const fetchEntry = async (day: any) => {
    try {
      const secretKey = await getSecretKey()
      let { data, error } = await supabase
        .from('journals')
        .select()
        .match({ user_id: session.user.id, day })
        .single()
      if (!data) {
        if (!isToday(day)) {
          const { contentEncrypted, iv } = await encryptEntry(
            JSON.stringify(defaultContent),
            secretKey
          )
          let now = serverTimeNow()
          let { data, error } = await supabase
            .from('journals')
            .insert([
              {
                user_id: session.user.id,
                day,
                modified_at: now,
                created_at: now,
                content: '\\x' + contentEncrypted,
                iv: '\\x' + iv,
              },
            ])
            .single()
          if (error) {
            logger(error)
            if (isUnauthorized(error)) signOut()
            throw new Error(error.message)
          }
          const { contentDecrypted } = await decryptEntry(data.content, data.iv, secretKey)
          data.content = JSON.parse(contentDecrypted)
          return data
        }
      }
      if (error) {
        logger(error)
        if (isUnauthorized(error)) signOut()
        throw new Error(error.message)
      }
      // TODO if modified_at is the same is in cache skip decryption
      const { contentDecrypted } = await decryptEntry(data.content, data.iv, secretKey)
      data.content = JSON.parse(contentDecrypted)
      return data
    } catch (err) {
      logger(err)
    }
  }

  const saveEntry = async (day: string, content: any, modified_at: string) => {
    logger(`Save entry day: ${day}, modified_at: ${modified_at}`)
    cacheAddOrUpdateEntry({
      user_id: session.user.id,
      day,
      created_at: modified_at, // not added when upsert
      modified_at, // when needsSaving... keep same date in cache
      content: JSON.stringify(content),
    })

    if (content == undefined) {
      logger(`Undefined content on day: ${day}`)
    }

    try {
      const secretKey = await getSecretKey()
      const { contentEncrypted, iv } = await encryptEntry(JSON.stringify(content), secretKey)

      const { error } = await supabase
        .from('journals')
        .upsert(
          {
            user_id: session.user.id,
            day,
            content: '\\x' + contentEncrypted,
            iv: '\\x' + iv,
            modified_at,
          },
          { returning: 'minimal' }
        )
        .single()

      if (error) {
        logger(error)
        if (isUnauthorized(error)) signOut()
        throw new Error(error.message)
      }

      setNeedsSavingToServer(false)
      cacheUpdateEntryProperty({ needs_saving_to_server: 0 }, { day, user_id: session.user.id })
      logger('saved')
    } catch (err) {
      if (!needsSavingToServerModifiedAt) {
        setNeedsSavingToServerModifiedAt(modified_at)
      }
      setNeedsSavingToServer(true)
      cacheUpdateEntryProperty({ needs_saving_to_server: 1 }, { day, user_id: session.user.id })
      logger(err)
    }
  }

  // const resizeObserver = new ResizeObserver((entries) => {
  //   for (let entry of entries) {
  //     logger(`scrollIntoView ${entryDay}`)
  //     // setEntryHeight()
  //   }
  // })

  const initialFetch = async () => {
    // resizeObserver.observe(editorRef.current)

    if (cachedEntry) {
      if (cachedEntry.needs_saving_to_server) {
        await saveEntry(entryDay, cachedEntry.content, cachedEntry.modified_at)
      }
    }

    const init = await fetchEntry(entryDay)
    if (!cachedEntry && init) {
      const { user_id, day, created_at, modified_at, content } = init
      cacheAddOrUpdateEntry({
        user_id,
        day,
        created_at,
        modified_at,
        content: JSON.stringify(content),
      })
      setInitialValue([...init.content])
    }
    if (cachedEntry && init && !dayjs(init.modified_at).isSame(cachedEntry.modified_at)) {
      logger(`${init.modified_at} != ${cachedEntry.modified_at}`)

      if (dayjs(init.modified_at).isAfter(dayjs(cachedEntry.modified_at))) {
        // Server entry is newer, save it to cache
        logger('Server entry is newer, updating cache')

        const { user_id, day, modified_at, content } = init
        let set = { modified_at, content: JSON.stringify(content) }
        let where = { day, user_id }
        cacheUpdateEntry(set, where)

        setInitialValue([...init.content])
      } else {
        // Cached entry is newer, push it to server
        logger('Cached entry is newer, updating on server')
        saveEntry(entryDay, cachedEntry.content, cachedEntry.modified_at)
      }
    }
    setInitialFetchDone(true)
  }

  const ShouldFocus = () => {
    const editor = usePlateEditorState(useEventPlateId())
    useEffect(() => {
      focusEditor(editor)
      select(editor, {
        path: [0, 0],
        offset: 0,
      })
      setShouldFocus(false)
      logger(`Focus set to ${entryDay}`)
    }, [])
    return <></>
  }

  const EditorRefAssign = () => {
    const editor = usePlateEditorState(useEventPlateId())
    if (editor) {
      editorsRef.current[entryDay] = editor
    }
    return <></>
  }

  useEffect(() => {
    logger(`Entry mounted`)
    initialFetch()

    entriesObserver.observe(editorRef.current)

    if (shouldScrollToDay(entryDay)) {
      editorRef.current.scrollIntoView()
      clearScrollToDay()
    }

    // Remove observers
    return () => {
      logger('Entry unmounted')
      if (editorRef.current) {
        entriesObserver.unobserve(editorRef.current)
        // resizeObserver.unobserve(editorRef.current)
      }
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    setEntryHeight()
    if (initialFetchDone) {
      setTimeout(() => {
        if (editorRef.current) {
          logger(`----> unobserve ${entryDay}`)
          // resizeObserver.unobserve(editorRef.current)
        }
      }, 2000)
    }
  }, [setInitialFetchDone])

  useEffect(() => {
    // logger(`needsSaving: ${needsSavingToServer}`)
    if (needsSavingToServer) {
      saveTimer.current = setTimeout(() => {
        setNeedsSavingToServer(false)
        saveEntry(entryDay, debugValue.current, needsSavingToServerModifiedAt)
      }, 5000)
    }
  }, [needsSavingToServer])

  useEffect(() => {
    debugValue.current = initialValue
    setWordCount(countEntryWords(initialValue))
  }, [initialValue])

  const editableProps = {
    placeholder: "What's on your mind…",
    autoFocus: false,
  }

  // Plugin

  const createEventEditorPlugin = createPluginFactory({
    key: 'events-editor-for-toolbar',
    handlers: {
      onFocus: (editor) => (e) => {
        logger('Focus')
        setEditorFocused(true)
      },
      onBlur: (editor) => () => {
        logger('Blur')
        setEditorFocused(false)
        // Deselect to avoid 2 context menus visible on separate entries
        deselectEditor(editor)
        // deselect(editor)
      },
      onChange: (editor) => () => {
        logger('Change')
        const isContentChange = editor.operations.some((op) => 'set_selection' !== op.type)
        if (isContentChange) {
          // logger('isContentChange')
          // Needs saving as it's an actual content change
          setNeedsSavingToServerModifiedAt(serverTimeNow())
          setNeedsSavingToServer(true)
          // Another way to access editor value:
          // logger(editor.children)
        }
      },
      onContextMenu: () => (e) => {
        // Invoke function in ContextMenu using Ref
        toggleContextMenu.current(e)
      },
    },
  })

  const createHandStrikethroughPlugin = createPluginFactory({
    key: MARK_HAND_STRIKETHROUGH,
  })

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
        [MARK_HIGHLIGHT]: withProps(StyledElement, {
          as: 'mark',
          styles: {
            root: css`
              background-color: ${theme('color.highlight.surface')};
              color: ${theme('color.highlight.main')};
              border-radius: 100px;
              padding: 3px 5px;
              margin: -5px;
              mix-blend-mode: ${theme('color.highlight.blendMode')};
            `,
          },
        }),
      }),
    }
  )

  const showMiniDate = (day: any) => {
    if (isToday(day)) {
      return 'Today'
    } else {
      return dayjs(dayjs(day.toString(), 'YYYY-MM-DD')).format('D MMMM YYYY')
    }
  }

  return (
    <Container ref={editorRef} id={`${entryDay}-entry`}>
      <MainWrapper>
        <MiniDate>{showMiniDate(entryDay)}</MiniDate>
        {(initialFetchDone || cachedEntry) && (
          <Plate
            id={`${entryDay}-editor`}
            editableProps={editableProps}
            initialValue={
              initialValue.length ? initialValue : cachedEntry?.content || defaultContent
            }
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

      <EntryAside wordCount={wordCount} date={entryDay} />
    </Container>
  )
}

// function areEqual(prevProps: any, nextProps: any) {
//   logger(`Comparing memo`)
//   return true
// }

// export const Entry = React.memo(EntryComponent, areEqual)

export { Entry }
