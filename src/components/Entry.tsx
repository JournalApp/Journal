import React, { useState, useEffect, useRef } from 'react'
import styled, { css } from 'styled-components'
import dayjs from 'dayjs'
import { usePlateEditorState, useEventPlateId, usePlateEditorRef } from '@udecode/plate-core'
import { countWords } from 'utils'
import { useEntriesContext } from 'context'
import { ContextMenu } from 'components'
import { FormatToolbar } from 'components'
import { createPluginFactory, getPlateActions } from '@udecode/plate'
import { Transforms, Node, Editor as SlateEditor } from 'slate'
import { ReactEditor } from 'slate-react'
import { CONFIG } from 'config'
import { theme } from 'themes'

import {
  createPlateUI,
  ELEMENT_H3,
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
} from '@udecode/plate'

type EntryBlockProps = {
  entryDay: string
  entryDayCount?: number
  entriesObserver: IntersectionObserver
  cachedEntry?: any
  ref?: any
  setEntryHeight: (id: string, height: number) => void
  setCachedEntry: (property: string, value: any) => void
  shouldScrollToDay: (day: string) => boolean
  clearScrollToDay: () => void
}

const Container = styled.div`
  display: flex;
  padding: 40px;
  word-break: break-word;
`

const Aside = styled.div`
  width: 200px;
  padding-top: 24px;
  display: flex;
  flex-direction: column;
`
const AsideItem = styled.p`
  padding: 16px 0 0 0;
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 14px;
  font-weight: 300;
  line-height: 20px;
`

const AsideDay = styled.p`
  padding: 0;
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
`

const AsideYear = styled.p`
  padding: 0;
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 14px;
  font-weight: 300;
  line-height: 20px;
`

const AsideStickyContainer = styled.div`
  position: sticky;
  top: 48px;
  text-align: end;
`

const MainWrapper = styled.div`
  width: 100%;
  padding: 0 80px 0 0;
  font-size: ${theme('appearance.fontSize')};
  font-family: ${theme('appearance.fontFace')};
  font-weight: 500;
  line-height: 30px;
  -webkit-app-region: no-drag;
  & > div:nth-child(2) > h1:first-child,
  & > div:nth-child(2) > h2:first-child,
  & > div:nth-child(2) > h3:first-child,
  & > div:nth-child(2) > div:first-child > h1:first-child,
  & > div:nth-child(2) > div:first-child > h2:first-child,
  & > div:nth-child(2) > div:first-child > h3:first-child {
    margin-block-start: 0;
  }
  & > * {
    max-width: 75ch;
    color: ${theme('color.primary.main')};
  }
`
const MiniDate = styled.div`
  padding: 0 0 8px 0;
  margin: 0;
  opacity: 0.3;
  visibility: ${theme('appearance.miniDatesVisibility')};
  color: ${theme('color.primary.main')};
  font-size: 12px;
  font-family: 'Inter var';
  line-height: 16px;
`

const isToday = (day: any) => {
  return day.toString() == dayjs().format('YYYYMMDD')
}

const fetchEntry = async (day: any) => {
  try {
    let headers = {
      'Content-Type': 'application/json',
    }
    let res = await fetch(`https://www.journal.local/api/1/entry/${day}`, {
      headers,
      method: 'GET',
    })
    if (res.status == 200) {
      let json = await res.json()
      return json
    } else {
      throw new Error()
    }
  } catch (err) {
    console.log(err)
  }
}

const countEntryWords = (content: any) => {
  if (Array.isArray(content)) {
    return countWords(content.map((n: any) => Node.string(n)).join(' '))
  } else {
    return 0
  }
}

const EntryComponent = ({
  entryDay,
  entryDayCount = 5,
  cachedEntry,
  setEntryHeight,
  entriesObserver,
  setCachedEntry,
  shouldScrollToDay,
  clearScrollToDay,
}: EntryBlockProps) => {
  const [wordCount, setWordCount] = useState(
    countEntryWords(cachedEntry ? cachedEntry.content : '')
  )
  const [needsSavingToServer, setNeedsSavingToServer] = useState(false)
  const [initialValue, setInitialValue] = useState([])
  const [focused, setFocused] = useState(false)
  const [shouldFocus, setShouldFocus] = useState(isToday(entryDay))
  const contextMenuVisible = useRef(false)
  const toggleContextMenu = useRef(null)
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const debugValue = useRef([])
  const editorRef = useRef(null)

  console.log(`Entry render`)

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

  const saveEntry = async (day: any, content: any) => {
    setCachedEntry(`${day}.content`, content)

    try {
      let headers = {
        'Content-Type': 'application/json',
      }
      let res = await fetch(`https://www.journal.local/api/1/entry/${day}`, {
        headers,
        body: JSON.stringify({ content }),
        method: 'POST',
      })
      if (res.status == 200) {
        setNeedsSavingToServer(false)
        console.log('saved')
        let json = await res.json()
        setCachedEntry(`${day}.modifiedAt`, json.modifiedAt)
        setCachedEntry(`${day}.needsSavingToServer`, false)
      } else {
        throw new Error()
      }
    } catch (err) {
      setNeedsSavingToServer(true)
      setCachedEntry(`${day}.needsSavingToServer`, true)
      console.log(err)
    }
  }

  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      setEntryHeight(entryDay, entry.borderBoxSize[0].blockSize)
    }
  })

  const initialFetch = async () => {
    resizeObserver.observe(editorRef.current)

    if (cachedEntry) {
      if (cachedEntry.needsSavingToServer) {
        await saveEntry(entryDay, cachedEntry.content)
      }
    }

    const init = await fetchEntry(entryDay)
    if (!cachedEntry) {
      setCachedEntry(entryDay, init)
      setInitialValue([...init.content])
    }
    if (cachedEntry && init && init.modifiedAt != cachedEntry.modifiedAt) {
      console.log(`${init.modifiedAt} != ${cachedEntry.modifiedAt}`)

      if (dayjs(init.modifiedAt).isAfter(dayjs(cachedEntry.modifiedAt))) {
        // Server entry is newer, save it to cache
        console.log('Server entry is newer, updating cache')
        setCachedEntry(entryDay, init)
        setInitialValue([...init.content])
      } else {
        // Cached entry is newer, push it to server
        console.log('Cached entry is newer, updating on server')
        saveEntry(entryDay, cachedEntry.content)
      }
    }
    if (!cachedEntry && !init) {
      setInitialValue([
        {
          children: [
            {
              text: '',
            },
          ],
          type: 'p',
        },
      ])
    }
    setInitialFetchDone(true)
  }

  const ShouldFocus = () => {
    const editor = usePlateEditorState(useEventPlateId())
    useEffect(() => {
      ReactEditor.focus(editor)
      setShouldFocus(false)
      console.log(`Focus set to ${entryDay}`)
    }, [])
    return <></>
  }

  useEffect(() => {
    console.log(`Entry mounted`)
    initialFetch()

    entriesObserver.observe(editorRef.current)

    if (shouldScrollToDay(entryDay)) {
      editorRef.current.scrollIntoView()
      clearScrollToDay()
    }

    // Remove observers
    return () => {
      entriesObserver.unobserve(editorRef.current)
    }
  }, [])

  useEffect(() => {
    if (initialFetch) {
      setTimeout(() => {
        resizeObserver.unobserve(editorRef.current)
      }, 2000)
    }
  }, [setInitialFetchDone])

  useEffect(() => {
    // console.log(`needsSaving: ${needsSavingToServer}`)
    if (needsSavingToServer) {
      setTimeout(() => {
        setNeedsSavingToServer(false)
        saveEntry(entryDay, debugValue.current)
      }, 5000)
    }
  }, [needsSavingToServer])

  const editableProps = {
    placeholder: "What's on your mind…",
    autoFocus: false,
  }

  // Plugin

  const createEventEditorPlugin = createPluginFactory({
    key: 'events-editor-for-toolbar',
    handlers: {
      onFocus: (editor) => () => {
        console.log('Focus')
        // Set cursor at the end, as a fix to multiple clicks
        if (!editor.selection) {
          Transforms.select(editor, SlateEditor.end(editor, []))
        }
        setFocused(true)
      },
      onBlur: (editor) => () => {
        console.log('Blur')
        // Transforms.deselect(editor)
        // Transforms.select(editor, SlateEditor.end(editor, []))
        // editor.selection = null
        setFocused(false)
      },
      onChange: (editor) => () => {
        console.log('Change')
        const isContentChange = editor.operations.some((op) => 'set_selection' !== op.type)
        if (isContentChange) {
          console.log('isContentChange')
          // Needs saving as it's an actual content change
          setNeedsSavingToServer(true)
          // Another way to access editor value:
          // console.log(editor.children)
        }
      },
      onContextMenu: () => (e) => {
        // Invoke function in ContextMenu using Ref
        toggleContextMenu.current(e)
      },
      // onPaste: () => (e) => {
      //   // navigator.clipboard.read().then((result) => {
      //   //   console.log(result)
      //   // })
      //   // console.log(e.clipboardData)
      // },
    },
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
      createResetNodePlugin(CONFIG.resetNode),
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
      }),
    }
  )

  const showDate = (day: any) => {
    if (isToday(day)) {
      return (
        <>
          <AsideDay>Today</AsideDay>
          <AsideYear>{dayjs(dayjs(day.toString(), 'YYYYMMDD')).format('D MMMM YYYY')}</AsideYear>
        </>
      )
    } else {
      return (
        <>
          <AsideDay>{dayjs(dayjs(day.toString(), 'YYYYMMDD')).format('D MMMM')}</AsideDay>
          <AsideYear>{dayjs(dayjs(day.toString(), 'YYYYMMDD')).format('YYYY')}</AsideYear>
        </>
      )
    }
  }

  const showMiniDate = (day: any) => {
    if (isToday(day)) {
      return 'Today'
    } else {
      return dayjs(dayjs(day.toString(), 'YYYYMMDD')).format('D MMM YYYY')
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
            initialValue={initialValue.length ? initialValue : cachedEntry.content}
            onChange={onChangeDebug}
            plugins={plugins}
          >
            {shouldFocus && <ShouldFocus />}
            <ContextMenu
              focused={focused}
              setContextMenuVisible={setContextMenuVisible}
              toggleContextMenu={toggleContextMenu}
            />
            <FormatToolbar focused={focused} isContextMenuVisible={isContextMenuVisible} />
          </Plate>
        )}
      </MainWrapper>
      <Aside>
        <AsideStickyContainer>
          {showDate(entryDay)}
          <AsideItem>
            {wordCount} words, day {entryDayCount}
          </AsideItem>
        </AsideStickyContainer>
      </Aside>
    </Container>
  )
}

function areEqual(prevProps: any, nextProps: any) {
  console.log(`Comparing memo`)
  return true
}

export const Entry = React.memo(EntryComponent, areEqual)
