import React, { useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { breakpoints } from 'utils'
import { Icon } from 'components'

interface PromptWindowStyledProps {
  isExpanded: boolean
}

const PromptWindowStyled = styled.div<PromptWindowStyledProps>`
  position: fixed;
  display: flex;
  flex-direction: column;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  overflow-y: ${(props) => (props.isExpanded ? 'scroll' : 'hidden')};
  background-color: ${theme('color.popper.surface')};
  height: fit-content;
  max-height: calc(100vh - 64px);
  padding: 8px;
  margin: 48px 4px 4px 4px;
  border-radius: 8px;
  box-shadow: ${theme('style.shadow')};
  -webkit-app-region: no-drag;
`

interface PromptStyledProps {
  isVisible: boolean
  isExpanded: boolean
}

const PromptStyled = styled.div<PromptStyledProps>`
  transition: all ${theme('animation.time.long')} cubic-bezier(0.17, 0.56, 0.18, 0.97);
  display: flex;
  padding: ${(props) => (props.isVisible ? '24px' : '0px 24px')};
  visibility: ${(props) => (props.isVisible ? 'visible' : 'hidden')};
  max-height: ${(props) => (props.isExpanded ? ' 400px' : props.isVisible ? '168px' : '0')};
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  overflow-y: ${(props) => (props.isExpanded ? 'visible' : 'scroll')};
  flex-direction: column;
  gap: 8px;
  border-radius: 6px;
  ${(props) => (props.isExpanded ? 'cursor: pointer;' : '')};
  &:hover {
    background-color: ${(props) =>
      props.isExpanded ? theme('color.popper.hover') : 'transparent'};
  }
`

const ChevronStyled = styled((props) => <Icon name='Chevron' size={16} {...props} />)`
  opacity: 0.8;
  cursor: pointer;
  transition: all ${theme('animation.time.fast')};
  &:hover {
    opacity: 1;
    color: ${theme('color.primary.main')};
  }
`

const PromptsButtonStyled = styled.div`
  position: fixed;
  bottom: 8px;
  right: 76px;
  padding: 2px 6px;
  line-height: 16px;
  border-radius: 100px;
  font-size: 12px;
  background-color: transparent;
  border: 0;
  color: ${theme('color.primary.main')};
  z-index: 100;
  opacity: 0.3;
  outline: 0;
  cursor: pointer;
  transition: all ${theme('animation.time.normal')};
  &:hover {
    opacity: 0.7;
    background-color: ${theme('color.primary.hover')};
  }
`

const PromptTitleStyled = styled.div<PromptStyledProps>`
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 400;
  width: fit-content;
  font-size: 12px;
  line-height: 18px;
  color: ${theme('color.primary.main')};
  transition: all ${theme('animation.time.normal')};
  opacity: 0.6;
  ${(props) => (!props.isExpanded && props.isVisible ? 'cursor: pointer;' : '')};
  &:hover {
    ${(props) => (!props.isExpanded && props.isVisible ? 'opacity: 1;' : '')};
    & > svg {
      transform: rotate(180deg);
    }
  }
`

const PromptContentStyled = styled.div<PromptStyledProps>`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  opacity: ${(props) => (props.isExpanded ? 0.9 : 0.7)};
`

export {
  PromptStyled,
  PromptsButtonStyled,
  PromptTitleStyled,
  PromptWindowStyled,
  PromptContentStyled,
  ChevronStyled,
}
