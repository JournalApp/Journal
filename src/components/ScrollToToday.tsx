import React from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import dayjs from 'dayjs'
import { useUserContext, useEntriesContext } from 'context'
import { select, focusEditor } from '@udecode/plate'
import { logger } from 'utils'

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

function ScrollToToday() {
  const { session } = useUserContext()
  const { editorsRef } = useEntriesContext()
  const scrollToToday = () => {
    let today = dayjs().format('YYYY-MM-DD')
    let entry = document.getElementById(`${today}-entry`)
    if (entry) {
      logger('scrollToToday')
      entry.scrollIntoView()
      const editor = editorsRef.current[today]
      if (editor) {
        focusEditor(editor)
        select(editor, {
          path: [0, 0],
          offset: 0,
        })
      }
    }
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'entry scroll-to-today',
    })
  }

  return (
    <ScrollToTodayButton id='ScrollToToday' onClick={() => scrollToToday()}>
      ↓ Back to Today
    </ScrollToTodayButton>
  )
}

export { ScrollToToday }
