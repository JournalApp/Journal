import React from 'react'
import { render } from 'react-dom'
import './index.css'

import { App } from './App'

function renderApp() {
  render(<App />, document.getElementById('app'))
}

renderApp()
