import React from 'react'
import styled from 'styled-components'
import { theme } from 'themes'

const FadeTop = styled.div`
  position: fixed;
  pointer-events: none;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  z-index: 10;
  background: linear-gradient(
    180deg,
    ${theme('color.primary.surface')} 0%,
    ${theme('color.primary.surface')} 35%,
    ${theme('color.primary.surface0')} 100%
  );
`
// background: linear-gradient(180deg, #e0e0e0 0%, #e0e0e0 35%, rgba(224, 224, 224, 0) 100%);

const FadeDown = styled.div`
  position: fixed;
  pointer-events: none;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  z-index: 10;
  background: linear-gradient(
    0deg,
    ${theme('color.primary.surface')} 0%,
    ${theme('color.primary.surface')} 20%,
    ${theme('color.primary.surface0')} 100%
  );
`

function FadeOut() {
  return (
    <>
      <FadeTop />
      <FadeDown />
    </>
  )
}

export { FadeOut }
