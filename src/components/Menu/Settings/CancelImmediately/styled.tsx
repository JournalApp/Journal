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
  width: 330px;
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  position: relative;
  padding: 0;
  padding: 24px 24px 16px 24px;
  margin: 48px 8px 8px 8px;
  border-radius: 12px;
  -webkit-app-region: no-drag;
`

const ButtonDestructiveStyled = styled.button`
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  padding: 2px 8px;
  color: ${theme('color.error.main')};
  border: 1px solid ${theme('color.error.main')};
  border-radius: 6px;
  flex: 1;
  background: transparent;
  cursor: pointer;
  outline: 0;
  &:hover,
  &:focus {
    box-shadow: 0 0 0 3px ${theme('color.error.main', 0.2)};
    transition: box-shadow ${theme('animation.time.normal')} ease;
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`

const ButtonStyled = styled.button`
  background-color: ${theme('color.popper.main')};
  color: ${theme('color.popper.inverted')};
  outline: 0;
  border: 0;
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 6px;
  flex: 1;
  transition: box-shadow ${theme('animation.time.normal')} ease;
  &:hover,
  &:focus {
    box-shadow: 0 0 0 3px ${theme('color.popper.main', 0.15)};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`

const ButtonGhostStyled = styled.button`
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  padding: 2px 8px;
  color: ${theme('color.primary.main')};
  border: 0;
  border-radius: 6px;
  flex: 1;
  background: transparent;
  cursor: pointer;
  outline: 0;
  transition: ${theme('animation.time.normal')} ease;
  &:focus {
    box-shadow: 0 0 0 3px ${theme('color.popper.border')};
  }
  &:hover {
    box-shadow: 0 0 0 3px ${theme('color.popper.border')};
    background-color: ${theme('color.popper.border')};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`

const TitleStyled = styled.div`
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 28px;
  margin-bottom: 8px;
  letter-spacing: -0.03em;
`

const DescriptionStyled = styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 18px;
`

const ActionsWrapperStyled = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 32px;
  height: 38px;
`

export {
  IconCloseStyled,
  ModalStyled,
  ButtonDestructiveStyled,
  ButtonStyled,
  ButtonGhostStyled,
  TitleStyled,
  DescriptionStyled,
  ActionsWrapperStyled,
}
