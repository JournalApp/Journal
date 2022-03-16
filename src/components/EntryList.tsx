import React, { useState, useEffect, useRef, forwardRef } from 'react'
import styled from 'styled-components'
import { Entry } from './'
import { useEventEditorSelectors } from '@udecode/plate'
import { shallowEqual } from '../utils'
import { useEntriesContext } from '../context'

const BeforeEntries = styled.div`
  text-align: center;
  padding: 64px 0;
`

const PostEntries = styled.div`
  min-height: 80vh;
`

const Wrapper = styled.div`
  display: flex;
  flex-flow: column;
  flex-direction: column-reverse;
`

const Stats = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  background-color: white;
  padding: 8px;
`

type myref = {
  [id: string]: number
}

function EntryList() {
  const [entries, setEntries] = useState([])
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const { initialCache, indexCache, setCachedIndexes } = useEntriesContext()
  const listRef = useRef(null)
  const entriesHeight: myref = {} //useRef<myref>(null)
  const itemsRef = useRef<Array<HTMLDivElement | null>>([])
  var element: HTMLElement | null

  interface EntriesState {
    date: number
    _id: string
    loadedFromServer: boolean
    loadedFromServerAt: Date // maybe?
    saveToServerError: boolean
    saveToServerErrorAt: Date //  maybe?
    modifiedAt: Date // server time
  }

  const focusedEditorId = useEventEditorSelectors.focus?.()

  useEffect(() => {
    initialFetch()
  }, [])

  useEffect(() => {
    console.log(entries)
    console.log('Entries updated')
  }, [entries])

  const areEntriesIDsEqual = (local: any, server: any) => {
    if (!Array.isArray(local)) {
      return false
    }
    if (!Array.isArray(server)) {
      return false
    }
    if (local.length != server.length) {
      return false
    }

    for (let i = 0; i < local.length; i++) {
      if (shallowEqual(local[i], server[i]) == false) return false
    }
    return true
  }

  const setEntryHeight = (id: string, height: number) => {
    if (!element) {
      element = document.getElementById('621603e69709a97c2f1d313d-entry')
    }
    element.scrollIntoView()

    // if (id == '6226752be089a49a5c4ddd78') {
    //   entriesHeight[id] = 0
    // } else {
    //   entriesHeight[id] = height
    // }

    // // TODO which objects are above, which below?
    // // TODO exact target scroll position of Today (not all - 1000 px)
    // let sum = Object.values(entriesHeight).reduce((a, b) => a + b)

    // window.scrollTo(0, sum + 156)
  }

  const initialFetch = async () => {
    console.log('initialFetch indexes')

    const cached = indexCache.current
    if (cached) {
      setEntries([...cached])
      setInitialFetchDone(true)
    }

    try {
      let headers = {
        'Content-Type': 'application/json',
      }
      const res = await fetch('https://www.journal.local/api/1/entriesids', {
        headers,
        method: 'GET',
      })
      if (res.status == 200) {
        const json = await res.json()
        if (!areEntriesIDsEqual(cached, json)) {
          setCachedIndexes(json)
          setEntries([...json])
        }
        setInitialFetchDone(true)
      } else {
        throw new Error()
      }
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Wrapper ref={listRef}>
      <PostEntries></PostEntries>
      {initialFetchDone &&
        entries
          .slice(0)
          .reverse()
          .map((entry, i) => (
            <Entry
              key={entry._id}
              entryId={entry._id}
              entryDay={entry.day}
              entryDayCount={i + 1}
              cached={initialCache.current[entry._id]}
              isFocused={focusedEditorId == entry._id}
              setEntryHeight={setEntryHeight}
            />
          ))}
      <BeforeEntries>This is the beginning...</BeforeEntries>
    </Wrapper>
  )
}

export { EntryList }
