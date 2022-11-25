import React, { useState, useEffect, useRef } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { breakpoints } from 'utils'

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

export {
  TabsStyled,
  ContentStyled,
  ListStyled,
  MenuItemStyled,
  SettingsTitleStyled,
  SectionTitleStyled,
  Offline,
}
