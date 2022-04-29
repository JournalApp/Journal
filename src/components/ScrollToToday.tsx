import React from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import dayjs from 'dayjs'

const ScrollToTodayButton = styled.button`
  position: fixed;
  bottom: 8px;
  left: 32px;
  margin-bottom: -32px;
  margin-left: ${theme('appearance.entriesOffset')};
  transition-duration: ${theme('animation.time.normal')};
  transition-timing-function: ${theme('animation.timingFunction.dynamic')};
  animation-duration: ${theme('animation.time.normal')};
  font-size: 12px;
  background-color: transparent;
  border: 0;
  color: ${theme('color.primary.main')};
  z-index: 100;
  opacity: 0.3;
  outline: 0;
  cursor: pointer;
  &:hover {
    opacity: 0.7;
  }
`

const scrollToToday = () => {
  let today = dayjs().format('YYYYMMDD')
  let entry = document.getElementById(`${today}-entry`)
  if (entry) {
    entry.scrollIntoView()
  }
}

// TODO When app is opened overningt, Today is not created, thus cant scroll to it
function ScrollToToday() {
  return (
    <ScrollToTodayButton id='ScrollToToday' onClick={() => scrollToToday()}>
      ↓ Back to Today
    </ScrollToTodayButton>
  )
}

export { ScrollToToday }