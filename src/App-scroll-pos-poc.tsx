import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'

type AppProps = {
  message?: string
}

const Entry = styled.div`
  height: 150px;
  background-color: silver;
  padding: 10px;
  margin: 10px;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 200vh;
`

const Stats = styled.div`
  position: fixed;
  bottom: 0;
  background-color: white;
  padding: 8px;
`

const EntryBlock = ({ entryData }: any) => {
  const [entryValue, setEntryValue] = useState('')
  const cellRef = useRef(null)
  let mystate = ''

  useEffect(() => {
    setEntryValue(entryData)
  }, [])

  // useEffect(() => {
  //   console.log(`entryValue: ${entryValue}`)
  //   // cellRef.current.innerHTML = entryValue
  // }, [entryValue])

  useEffect(() => {
    console.log(`mystate: ${mystate}`)
  }, [mystate])

  const onChange = (e: any) => {
    console.log('onChange')
  }

  const onInput = async (e: any) => {
    console.log('onInput')
    // console.log(e)
    // console.log(e.target.innerHTML)
    // setEntryValue(e.target.innerHTML)
    mystate = e.target.innerHTML
    console.log(`mystate: ${mystate}`)

    var res
    try {
      let headers = {
        'Content-Type': 'application/json',
      }
      res = await fetch('https://app.journal.local/api/1/entry', {
        headers,
        body: JSON.stringify({ mystate }),
        method: 'POST',
      })
    } catch (err) {}
  }

  return (
    <Entry
      contentEditable={true}
      suppressContentEditableWarning={true}
      spellCheck={true}
      ref={cellRef}
      onChange={(e) => onChange(e)}
      onInput={(e) => onInput(e)}
    ></Entry>
  )
}

function App({ message }: AppProps) {
  const [count, setCount] = useState([])
  const [scrollPos, setScrollPos] = useState(0)
  const [pageYstate, setPageYstate] = useState(0)
  const [buttonPos, setButtonPos] = useState(0)
  const elem = useRef(null)

  useEffect(() => {
    let newPos = window.pageYOffset + 190
    console.log(`scrollTo: ${window.pageYOffset} + ${scrollPos} = ${newPos}`)
    window.scrollTo(0, newPos)
  }, [count])

  useEffect(() => {
    initialFetch()
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        console.log(entry.contentRect.height)
      }
    })
    resizeObserver.observe(elem.current)
    window.addEventListener(
      'scroll',
      function (event) {
        setPageYstate(window.pageYOffset)
        setButtonPos(elem.current.getBoundingClientRect().top)
      },
      false
    )
  }, [])

  const initialFetch = async () => {
    console.log('initialFetch')

    var res
    try {
      let headers = {
        'Content-Type': 'application/json',
      }
      res = await fetch('https://app.journal.local/api/1/entries', {
        headers,
        method: 'GET',
      })
      console.log(res)
    } catch (err) {
      console.log(err)
    }
  }

  const add = (e: React.MouseEvent) => {
    e.preventDefault()
    setPageYstate(window.pageYOffset)
    setButtonPos(elem.current.getBoundingClientRect().top)

    console.log(`saved pos: ${window.pageYOffset}`)
    setCount((c) => {
      return ['Boom', ...c]
    })
  }

  window.addEventListener('resize', () => {
    console.log('Resize')
  })

  return (
    <Container>
      <div>Test</div>
      {count.map((k, i) => (
        <EntryBlock key={i} entryData={`${k} - ${i}`} />
      ))}
      <button ref={elem} onClick={(e) => add(e)}>
        Click me!
      </button>
      <Stats>
        pageYOffset: {pageYstate}
        <br />
        buttonTop: {buttonPos}
      </Stats>
    </Container>
  )
}

export { App }
