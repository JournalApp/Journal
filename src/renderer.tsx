import React from 'react'
import { render } from 'react-dom'
import './index.css'

import { App } from './App'

declare global {
  interface Window {
    electronAPI?: any
  }
}

window.electronAPI.handleOpenUrl((event: any, value: any) => {
  console.log('handleOpenUrl:')
  console.log(value)
})

function renderApp() {
  render(<App />, document.getElementById('app'))
}

renderApp()
