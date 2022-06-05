import React from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'

const hide = keyframes`
 0% {
  opacity: 1;
}
  90% {
    opacity: 0;
  }
  100% {
    opacity: 0;
    visibility: hidden;
  }
`

const Splash = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
  background-color: ${theme('color.primary.surface')};
  animation-name: ${hide};
  animation-duration: ${theme('animation.time.normal')};
  animation-timing-function: cubic-bezier(0.17, 0.18, 0.41, 0.99);
  animation-fill-mode: forwards;
  animation-delay: ${theme('animation.time.long')};
`

export { Splash }
