import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import dayjs from 'dayjs'
import { ToolbarButtons } from './index'
// import { usePlateEditorRef } from '@udecode/plate'
import { countWords } from '../utils'
import { useEntriesContext } from '../context'

import {
  createPlateUI,
  HeadingToolbar,
  Plate,
  ELEMENT_H1,
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
  createPlugins,
  useEventEditorSelectors,
  usePlateStore,
  usePlateEditorRef,
} from '@udecode/plate'

type EntryBlockProps = {
  entryId: any
  entryDay: any
  entryDayCount: number
  isFocused: boolean
  cached?: any
  ref?: any
  setEntryHeight: (id: string, height: number) => void
}

interface ContainerProps {
  readonly isFocused: boolean
}

const Container = styled.div<ContainerProps>`
  display: flex;
  padding: 40px;
  opacity: ${(props) => (props.isFocused ? '1' : '0.5')};
`

const Aside = styled.div`
  width: 150px;
  color: var(--color-text-50);
  font-size: 12px;
  line-height: 20px;
`
const MainWrapper = styled.div`
  width: 100%;
  font-size: 20px;
  line-height: 30px;
  -webkit-app-region: no-drag;
`

const FloatingToolar = styled.div`
  position: fixed;
  top: 24px;
  border: 0;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 9000;
  & > * {
    border: 0;
    border-radius: 16px;
    padding: 0px 8px;
    background-color: white;
  }
`

const showDay = (day: any) => {
  if (day.toString() == dayjs().format('YYYYMMDD')) {
    return 'Today'
  } else {
    return dayjs(dayjs(day.toString(), 'YYYYMMDD')).format('D MMM YYYY')
  }
}

const fetchEntry = async (id: any) => {
  try {
    let headers = {
      'Content-Type': 'application/json',
    }
    let res = await fetch(`https://www.journal.local/api/1/entry/${id}`, {
      headers,
      method: 'GET',
    })
    if (res.status == 200) {
      let json = await res.json()
      // console.log(json[0].content)
      return json[0]
    } else {
      throw new Error()
    }
  } catch (err) {
    console.log(err)
  }
}

const Entry = ({
  entryId,
  entryDay,
  entryDayCount,
  isFocused,
  cached,
  setEntryHeight,
}: EntryBlockProps) => {
  const [wordCount, setWordCount] = useState(0)
  const [needsSavingToServer, setNeedsSavingToServer] = useState(false)
  const [initialValue, setInitialValue] = useState([])
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const debugValue = useRef([])
  const editor = useRef(null)
  const { setCachedEntry } = useEntriesContext()

  const onChangeDebug = (newValue: any) => {
    debugValue.current = newValue
    setNeedsSavingToServer(true)
  }

  const saveEntry = async (id: any, content: any) => {
    setCachedEntry(`${id}.content`, content)

    try {
      let headers = {
        'Content-Type': 'application/json',
      }
      let res = await fetch(`https://www.journal.local/api/1/entry/${id}`, {
        headers,
        body: JSON.stringify({ content }),
        method: 'POST',
      })
      if (res.status == 200) {
        setNeedsSavingToServer(false)
        console.log('saved')
        let json = await res.json()
        setCachedEntry(`${id}.modifiedAt`, json.modifiedAt)
        setCachedEntry(`${id}.needsSavingToServer`, false)
      } else {
        throw new Error()
      }
    } catch (err) {
      setNeedsSavingToServer(true)
      setCachedEntry(`${id}.needsSavingToServer`, true)
      console.log(err)
    }
  }

  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      // console.log(entry)
      setEntryHeight(entryId, entry.borderBoxSize[0].blockSize)
    }
  })

  const initialFetch = async () => {
    // console.log(`initialFetch for ${entryId}`)

    resizeObserver.observe(editor.current)

    if (cached) {
      console.log('Cached')

      if (cached.needsSavingToServer) {
        await saveEntry(entryId, cached.content)
      }
    }

    const init = await fetchEntry(entryId)
    if (!cached) {
      setCachedEntry(entryId, init)
      setInitialValue([...init.content])
    }
    if (cached && init && init.modifiedAt != cached.modifiedAt) {
      console.log(`${init.modifiedAt} != ${cached.modifiedAt}`)
      // TODO if cached is newer, push it to server
      // if from server is nerwer, save it to cache

      if (dayjs(init.modifiedAt).isAfter(dayjs(cached.modifiedAt))) {
        // Server entry is newer
        console.log('Server entry is newer, updating cache')
        setCachedEntry(entryId, init)
        setInitialValue([...init.content])
      } else {
        // Cached entry is newer
        console.log('Cached entry is newer, updating on server')
        saveEntry(entryId, cached.content)
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
        resizeObserver.unobserve(editor.current)
      }, 2000)
    }
  }, [setInitialFetchDone])

  useEffect(() => {
    console.log(`needsSaving: ${needsSavingToServer}`)
    if (needsSavingToServer) {
      setTimeout(() => {
        setNeedsSavingToServer(false)
        saveEntry(entryId, debugValue.current)
      }, 5000)
    }
  }, [needsSavingToServer])

  const editableProps = {
    placeholder: "What's on your mind…",
  }

  const plugins = createPlugins(
    [
      // elements
      createParagraphPlugin(), // paragraph element
      createBlockquotePlugin(), // blockquote element
      createCodeBlockPlugin(), // code block element
      createHeadingPlugin(), // heading elements
      createListPlugin(),

      // marks
      createBoldPlugin(), // bold mark
      createItalicPlugin(), // italic mark
      createUnderlinePlugin(), // underline mark
      createStrikethroughPlugin(), // strikethrough mark
      createCodePlugin(), // code mark
    ],
    {
      // Plate components
      components: createPlateUI(),
    }
  )

  // const st = usePlateStore(entryId)

  return (
    <Container isFocused={isFocused} ref={editor} id={`${entryId}-entry`}>
      <Aside>{showDay(entryDay)}</Aside>
      <MainWrapper>
        {initialFetchDone && (
          <Plate
            id={entryId}
            editableProps={editableProps}
            initialValue={initialValue.length ? initialValue : cached.content}
            onChange={onChangeDebug}
            plugins={plugins}
          >
            {isFocused && (
              <FloatingToolar>
                <HeadingToolbar>
                  <ToolbarButtons />
                </HeadingToolbar>
              </FloatingToolar>
            )}
          </Plate>
        )}
      </MainWrapper>
      <Aside>
        {wordCount} words, day {entryDayCount}
      </Aside>
    </Container>
  )
}

export { Entry }
