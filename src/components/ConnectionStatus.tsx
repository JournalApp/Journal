import React from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { useUserContext, useEntriesContext } from 'context'
import { logger } from 'utils'

const Status = styled.button`
  position: fixed;
  bottom: 8px;
  left: 50%;
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

function ConnectionStatus() {
  const { isOnline } = useUserContext()
  return <Status id='ConnectionStatus'>{isOnline ? 'Online' : 'Offline'}</Status>
}

export { ConnectionStatus }
