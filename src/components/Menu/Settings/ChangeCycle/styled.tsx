import React, { useState, useEffect, useRef } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { Icon } from 'components'
import { CardElement } from '@stripe/react-stripe-js'

const FormStyled = styled.form`
  width: 280px;
  padding-right: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const TextStyled = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
`

const CheckoutModalStyled = styled.div`
  background-color: ${theme('color.popper.surface')};
  display: flex;
  position: relative;
  padding: 0;
  padding: 40px 40px 32px 32px;
  margin: 48px 8px 8px 8px;
  border-radius: 8px;
  -webkit-app-region: no-drag;
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
  display: flex;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  width: fit-content;
  transition: box-shadow ${theme('animation.time.normal')} ease;
  &:hover,
  &:focus {
    box-shadow: 0 0 0 2px ${theme('color.popper.main', 0.15)};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`

const TableStyled = styled.div`
  letter-spacing: -0.03em;
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  color: ${theme('color.popper.main')};
  & em {
    font-weight: 500;
    font-size: 16px;
    font-style: normal;
  }
`

interface RowStyledProps {
  padding?: string
}

const RowStyled = styled.div<RowStyledProps>`
  display: flex;
  padding: ${(props) => (props.padding ? props.padding : '0')};
`

interface CellFillStyledProps {
  opacity?: string
}

const CellFillStyled = styled.div<CellFillStyledProps>`
  flex: 1;
  opacity: ${(props) => (props.opacity ? props.opacity : '0.8')};
`

const Divider = styled.div`
  height: 1px;
  margin: 8px 0;
  background-color: ${theme('color.popper.border')};
`

const CellStyled = styled.div``

export {
  TextStyled,
  CheckoutModalStyled,
  ButtonStyled,
  RowStyled,
  CellFillStyled,
  CellStyled,
  TableStyled,
  Divider,
  FormStyled,
}
