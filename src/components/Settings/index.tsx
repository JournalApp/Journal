import React, { useState, useEffect, useRef } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import styled from 'styled-components'
import { theme } from 'themes'
import { Upgrade } from './Upgrade'

const Overlay = styled.div`
  position: fixed;
  z-index: 10;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: ${theme('color.primary.surface', 0.8)};
  display: grid;
  place-items: center;
`

const Root = styled(Tabs.Root)`
  display: flex;
  flex-direction: row;
  background-color: ${theme('color.popper.surface')};
  width: -webkit-fill-available;
  max-width: 1000px;
  height: -webkit-fill-available;
  max-height: 600px;
  padding: 8px;
  margin: 48px 8px 8px 8px;
  border-radius: 8px;
`

const Content = styled.div`
  padding: 32px;
`

const List = styled(Tabs.List)`
  display: flex;
  flex-direction: column;
`

const Settings = () => {
  return (
    <Overlay>
      <Root defaultValue='tab1' orientation='vertical'>
        <List aria-label='tabs example'>
          <Tabs.Trigger value='tab1'>Account</Tabs.Trigger>
          <Tabs.Trigger value='tab2'>Upgrade</Tabs.Trigger>
          <Tabs.Trigger value='tab3'>Invoices</Tabs.Trigger>
        </List>
        <Content>
          <Tabs.Content value='tab1'>Tab one content</Tabs.Content>
          <Tabs.Content value='tab2'>
            <Upgrade />
          </Tabs.Content>
          <Tabs.Content value='tab3'>Tab three content</Tabs.Content>
        </Content>
      </Root>
    </Overlay>
  )
}

export { Settings }
