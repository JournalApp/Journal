import React, { useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { Icon } from 'components'

const IconCloseStyled = styled((props) => <Icon name='Cross' {...props} />)`
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0.8;
  cursor: pointer;
  &:hover {
    opacity: 1;
    color: ${theme('color.primary.main')};
  }
`

const ModalStyled = styled.div`
  background-color: ${theme('color.popper.surface')};
  display: flex;
  position: relative;
  padding: 0;
  padding: 40px 32px 32px 32px;
  margin: 48px 8px 8px 8px;
  border-radius: 8px;
  -webkit-app-region: no-drag;
`

export { IconCloseStyled, ModalStyled }
