import React, { useState, useEffect, useRef } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { breakpoints } from 'utils'
import { CardElement } from '@stripe/react-stripe-js'

const TabsStyled = styled(Tabs.Root)`
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: 192px auto;
  background-color: ${theme('color.popper.surface')};
  width: -webkit-fill-available;
  max-width: 1000px;
  height: -webkit-fill-available;
  max-height: 600px;
  padding: 0;
  margin: 48px 8px 8px 8px;
  border-radius: 8px;
  -webkit-app-region: no-drag;
`

const ContentStyled = styled(Tabs.Content)`
  padding: 24px 32px;
  overflow: scroll;
  flex-grow: 1;
  outline: 0;
`

const Offline = styled.div`
  font-size: 14px;
  padding: 24px 32px;
  overflow: scroll;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  outline: 0;
  color: ${theme('color.popper.main', 0.6)};
  text-align: center;
`

const MenuItemStyled = styled(Tabs.Trigger)`
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  padding-right: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  border: 0;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: ${theme('color.popper.main')};
  transition: ${theme('animation.time.normal')};
  background-color: transparent;
  opacity: 0.5;
  &:focus,
  &:hover {
    border: 0;
    outline: none;
    opacity: 1;
  }
  &[data-state='active'] {
    opacity: 1;
    background-color: ${theme('color.popper.active')};
  }
`

const ListStyled = styled(Tabs.List)`
  display: flex;
  gap: 2px;
  padding: 8px;
  flex-direction: column;
  background-color: ${theme('color.popper.inverted')};
  border-radius: 8px 0 0 8px;
`

const SettingsTitleStyled = styled.div`
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  padding: 16px 12px;
`

const SectionTitleStyled = styled.div`
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 28px;
  padding: 0;
  margin-bottom: 24px;
  letter-spacing: -0.03em;
`

const LabelStyled = styled.div`
  margin-bottom: 8px;
  color: ${theme('color.primary.main')};
  opacity: 0.8;
  font-size: 12px;
  font-weight: 500;
  font-style: normal;
  line-height: 16px;
  white-space: nowrap;
  pointer-events: none;
`

interface CardElementProps {
  isFocused: boolean
  isReady: boolean
}

const CardElementStyled = styled(CardElement)<CardElementProps>`
  padding: 12px;
  box-sizing: border-box;
  height: 43px;
  background-color: ${theme('color.popper.pure', 0.8)};
  color: ${theme('color.primary.main')};
  border: ${(props) =>
    props.isFocused
      ? `1px solid ${theme('color.popper.main')}`
      : `1px solid ${theme('color.popper.border')}`};
  box-shadow: ${(props) =>
    props.isFocused ? `0 0 0 2px ${theme('color.popper.main', 0.1)}` : null};
  border-radius: 8px;
  outline: 0;
  opacity: ${(props) => (props.isReady ? 1 : 0.6)};
  transition: all ${theme('animation.time.normal')};
  &:hover {
    transition: all ${theme('animation.time.normal')};
    box-shadow: 0 0 0 2px ${theme('color.popper.main', 0.1)};
  }
  &::placeholder {
    opacity: 0.6;
  }
`

interface InputProps {
  borderRadius?: string
  hasError: boolean
}

const AddressInputStyled = styled.input<InputProps>`
  padding: 8px 12px;
  background-color: ${theme('color.popper.pure', 0.8)};
  color: ${(props) => (props.hasError ? theme('color.error.main') : theme('color.primary.main'))};
  border: 0;
  border-radius: ${(props) => (props.borderRadius ? props.borderRadius : '8px')};
  box-sizing: border-box;
  width: 100%;
  font-size: 14px;
  line-height: 24px;
  font-weight: 400;
  transition: all ${theme('animation.time.normal')};
  &:focus,
  &:active {
    background-color: ${theme('color.popper.pure')};
    outline: 0;
    transition: all ${theme('animation.time.normal')};
  }
  &:hover {
    background-color: ${theme('color.popper.pure', 0.9)};
  }
  &::placeholder {
    opacity: 0.6;
    color: ${(props) => (props.hasError ? theme('color.error.main') : theme('color.primary.main'))};
  }
`

const FormStyled = styled.form`
  width: 368px;
  padding-right: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const AddressStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`
const AddressInputsStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 7px;
  border: 1px solid ${theme('color.popper.border')};
  &:focus-within {
    border: 1px solid ${theme('color.popper.main')};
    box-shadow: 0 0 0 2px ${theme('color.popper.main', 0.1)};
    outline: 0;
    transition: all ${theme('animation.time.normal')};
  }
  &:hover {
    transition: all ${theme('animation.time.normal')};
    box-shadow: 0 0 0 2px ${theme('color.popper.main', 0.1)};
  }
`

const AddressRowStyled = styled.div`
  display: flex;
`

export {
  TabsStyled,
  ContentStyled,
  ListStyled,
  MenuItemStyled,
  SettingsTitleStyled,
  SectionTitleStyled,
  Offline,
  LabelStyled,
  AddressInputStyled,
  FormStyled,
  CardElementStyled,
  AddressStyled,
  AddressInputsStyled,
  AddressRowStyled,
}
