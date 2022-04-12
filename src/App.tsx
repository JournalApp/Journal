import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { EntryList, Calendar, Menu } from 'components'
import { UserProvider, EntriesProvider } from './context'

declare global {
  interface Window {
    electronAPI?: any
    clipboardData?: any
  }
}

// window.electronAPI.onPaste((_event: any, value: any) => {
//   console.log('Paste')
//   console.log(window.clipboardData)
//   console.log(value)
// })

// window.electronAPI.onCopy((_event: any, value: any) => {
//   console.log('Copy')
// })

const Container = styled.div`
  min-height: 100vh;
`

function App() {
  return (
    <EntriesProvider>
      <UserProvider>
        <Container>
          <Menu />
          <EntryList />
          <Calendar />
        </Container>
      </UserProvider>
    </EntriesProvider>
  )
}

export { App }
