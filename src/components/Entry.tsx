import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import dayjs from 'dayjs'
import { FormatToolbar } from './index'
// import { usePlateEditorRef } from '@udecode/plate'
import { countWords } from '../utils'
import { useEntriesContext } from '../context'
import { ContextMenu } from './ContextMenu'

import {
  createPlateUI,
  BalloonToolbar,
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
  entryDay: any
  entryDayCount: number
  isFocused: boolean
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
  color: var(--color-text-50);
  font-size: 12px;
  line-height: 20px;
`
const MainWrapper = styled.div`
  width: 100%;
  max-width: 75ch;
  font-size: 21px;
  font-weight: 500;
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
  isFocused,
  isFadedOut,
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

    resizeObserver.observe(editor.current)

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
    <Container isFadedOut={isFadedOut} ref={editor} id={`${entryDay}-entry`}>
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
              <FormatToolbar />
            </Plate>
          </ContextMenu>
        )}
      </MainWrapper>
      <Aside>
        {showDay(entryDay)}
        {wordCount} words, day {entryDayCount}
      </Aside>
    </Container>
  )
}

export { Entry }
