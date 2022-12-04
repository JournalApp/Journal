import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme } from 'themes'

const HeaderStyled = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.03em;
  color: ${theme('color.popper.main')};
  margin-bottom: 8px;
  margin-top: 32px;
`

const TextStyled = styled.div`
  flex-grow: 1;
  font-weight: 400;
  font-size: 12px;
  line-height: 20px;
  & em {
    font-weight: 500;
    font-style: normal;
  }
  & strong {
    font-weight: 500;
    font-size: 14px;
    line-height: 24px;
  }
`

const ActionsStyled = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  align-self: flex-start;
  row-gap: 2px;
  gap: 4px;
`
type ActionStyledProps = {
  isHidden?: boolean
}

const ActionStyled = styled.button<ActionStyledProps>`
  ${(props) => (props.isHidden ? 'display: none;' : '')};
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  white-space: nowrap;
  text-align: right;
  padding: 4px 6px;
  height: fit-content;
  color: ${theme('color.primary.main')};
  opacity: 0.8;
  border: 0;
  border-radius: 100px;
  background: transparent;
  cursor: pointer;
  outline: 0;
  transition: ${theme('animation.time.normal')};
  &:hover,
  &:focus {
    background-color: ${theme('color.popper.hover')};
    opacity: 1;
  }
`

const ContentStyled = styled.div`
  display: flex;
`

const CardStyled = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  & em {
    font-weight: 500;
    font-style: normal;
  }
`

const ReceiptsTableStyled = styled.div`
  &:first-child {
    border-top: 1px solid ${theme('color.popper.border')};
  }
  > * {
    border-bottom: 1px solid ${theme('color.popper.border')};
  }
`

const ReceiptsRowStyled = styled.div`
  display: flex;
  padding: 8px 0;
  gap: 16px;
`

const ReceiptsCellStyled = styled.div`
  &:first-child {
    flex-grow: 1;
  }
`

const DownloadStyled = styled.a`
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  padding: 4px 6px;
  color: ${theme('color.primary.main')};
  opacity: 0.8;
  border: 0;
  border-radius: 100px;
  background: transparent;
  text-decoration: none;
  cursor: pointer;
  outline: 0;
  transition: ${theme('animation.time.normal')};
  &:hover,
  &:focus {
    background-color: ${theme('color.popper.hover')};
    opacity: 1;
  }
`

const Divider = styled.div`
  background-color: ${theme('color.popper.border')};
  height: 1px;
  margin: 32px 0;
`

export {
  HeaderStyled,
  TextStyled,
  ActionsStyled,
  ActionStyled,
  ContentStyled,
  CardStyled,
  ReceiptsRowStyled,
  ReceiptsTableStyled,
  ReceiptsCellStyled,
  Divider,
  DownloadStyled,
}
