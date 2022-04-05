import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import dayjs from 'dayjs'
import { FormatToolbar } from 'components'
import { usePlateEditorState, usePlateSelectors } from '@udecode/plate-core'
import { countWords } from 'utils'
import { useEntriesContext } from '../context'
import { ContextMenu } from 'components'
import { createPluginFactory, getPlateActions } from '@udecode/plate'
import { Transforms, Editor as SlateEditor } from 'slate'
import { CONFIG } from 'config'

import {
  createPlateUI,
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
  entryDay: any
  entryDayCount: number
  isFadedOut: boolean
  cached?: any
  ref?: any
  setEntryHeight: (id: string, height: number) => void
}

interface ContainerProps {
  readonly isFadedOut: boolean
}

const Container = styled.div<ContainerProps>`
  display: flex;
  padding: 40px;
  opacity: ${(props) => (props.isFadedOut ? '0.5' : '1')};
`

const Aside = styled.div`
  width: 150px;
  display: flex;
  flex-direction: column;
`
const AsideItem = styled.p`
  padding: 0;
  margin: 0;
  color: var(--color-text-50);
  font-size: 12px;
  line-height: 20px;
`

const MainWrapper = styled.div`
  width: 100%;
  padding: 0 80px 0 0;
  font-size: 21px;
  font-weight: 500;
  line-height: 30px;
  -webkit-app-region: no-drag;
  & > * {
    max-width: 75ch;
  }
`

const showDay = (day: any) => {
  if (day.toString() == dayjs().format('YYYYMMDD')) {
    return 'Today'
  } else {
    return dayjs(dayjs(day.toString(), 'YYYYMMDD')).format('D MMM YYYY')
  }
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
      //
      // console.log(`Fetching ${day}`)
      // console.log(json)
      return json
    } else {
      throw new Error()
    }
  } catch (err) {
    console.log(err)
  }
}

const Entry = ({
  entryDay,
  entryDayCount,
  isFadedOut,
  cached,
  setEntryHeight,
}: EntryBlockProps) => {
  const [wordCount, setWordCount] = useState(0)
  const [needsSavingToServer, setNeedsSavingToServer] = useState(false)
  const [initialValue, setInitialValue] = useState([])
  const [focused, setFocused] = useState(false)
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const debugValue = useRef([])
  const editorRef = useRef(null)
  const { setCachedEntry } = useEntriesContext()
  // const st = usePlateEditorState(`${entryDay}-editor`)

  const onChangeDebug = (newValue: any) => {
    // const isAstChange = editor.operations.some(
    //   op => 'set_selection' !== op.type
    // )
    // if (isAstChange) {
    //   // Save the value to Local Storage.
    //   const content = JSON.stringify(value)
    //   localStorage.setItem('content', content)
    // }
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
      // console.log(entry)
      setEntryHeight(entryDay, entry.borderBoxSize[0].blockSize)
    }
  })

  const initialFetch = async () => {
    // console.log(`initialFetch for ${entryId}`)

    resizeObserver.observe(editorRef.current)

    if (cached) {
      // console.log(`Cached day ${entryDay}`)

      if (cached.needsSavingToServer) {
        await saveEntry(entryDay, cached.content)
      }
    }

    const init = await fetchEntry(entryDay)
    if (!cached) {
      setCachedEntry(entryDay, init)
      setInitialValue([...init.content])
    }
    if (cached && init && init.modifiedAt != cached.modifiedAt) {
      console.log(`${init.modifiedAt} != ${cached.modifiedAt}`)

      if (dayjs(init.modifiedAt).isAfter(dayjs(cached.modifiedAt))) {
        // Server entry is newer, save it to cache
        console.log('Server entry is newer, updating cache')
        setCachedEntry(entryDay, init)
        setInitialValue([...init.content])
      } else {
        // Cached entry is newer, push it to server
        console.log('Cached entry is newer, updating on server')
        saveEntry(entryDay, cached.content)
      }
    }
    if (!cached && !init) {
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

  useEffect(() => {
    initialFetch()
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
    },
  })

  const plugins = createPlugins(
    [
      // elements
      createParagraphPlugin(), // paragraph element
      createBlockquotePlugin(), // blockquote element
      createCodeBlockPlugin(), // code block element
      createHeadingPlugin(), // heading elements
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
      components: createPlateUI(),
    }
  )

  // const st = usePlateStore(entryId)

  return (
    <Container isFadedOut={isFadedOut} ref={editorRef} id={`${entryDay}-entry`}>
      <MainWrapper>
        {(initialFetchDone || cached) && (
          <ContextMenu>
            <Plate
              id={`${entryDay}-editor`}
              editableProps={editableProps}
              initialValue={initialValue.length ? initialValue : cached.content}
              onChange={onChangeDebug}
              plugins={plugins}
            >
              <FormatToolbar focused={focused} />
            </Plate>
          </ContextMenu>
        )}
      </MainWrapper>
      <Aside>
        <AsideItem>{showDay(entryDay)}</AsideItem>
        <AsideItem>
          {wordCount} words, day {entryDayCount}
        </AsideItem>
      </Aside>
    </Container>
  )
}

export { Entry }
