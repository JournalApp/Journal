import React, { useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { Icon } from 'components'
import { theme } from 'themes'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Toolbar from '@radix-ui/react-toolbar'
import * as Dialog from '@radix-ui/react-dialog'

const showDropdown = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }`

interface MenuProps {
  posX?: string
  posY?: string
  pos?: string
}

const AppearanceToolbarWrapper = styled(Dialog.Content)`
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 9999;
`

const DialogTrigger = styled(Dialog.Trigger)`
  background-color: transparent;
  padding: 0;
  outline: none;
  border: 0;
  &:focus,
  &:hover {
    outline: none;
  }
`

const AppearanceToolbar = styled(Toolbar.Root)`
  padding: 4px;
  border-radius: 12px;
  display: flex;
  box-shadow: ${theme('style.shadow')};
  background-color: ${theme('color.popper.surface')};
  animation-name: ${showDropdown};
  animation-duration: ${theme('animation.time.normal')};
  -webkit-app-region: no-drag;
`

const Dropdown = styled(DropdownMenu.Content)<MenuProps>`
  position: ${(props) => (props.pos ? props.pos : 'absolute')};
  top: ${(props) => (props.posY ? props.posY : '')};
  left: ${(props) => (props.posX ? props.posX : '')};
  padding: 4px;
  border-radius: 12px;
  box-shadow: ${theme('style.shadow')};
  background-color: ${theme('color.popper.surface')};
  animation-name: ${showDropdown};
  animation-duration: ${theme('animation.time.normal')};
  -webkit-app-region: no-drag;
`

const Item = styled(DropdownMenu.Item)`
  display: flex;
  border: 0;
  gap: 16px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  background-color: ${theme('color.popper.surface')};
  align-items: center;
  transition: ${theme('animation.time.normal')};
  &:focus,
  &:hover {
    border: 0;
    outline: none;
    background-color: ${theme('color.popper.hover')};
  }
`

const ItemTitle = styled.span`
  flex-grow: 1;
  font-size: 14px;
  line-height: 20px;
  text-align: left;
  padding-right: 16px;
`

const MenuButton = styled(DropdownMenu.Trigger)`
  position: fixed;
  top: 8px;
  right: 8px;
  width: 40px;
  height: 24px;
  border-radius: 100px;
  border: 0;
  padding: 4px;
  transition: ${theme('animation.time.normal')};
  background-color: ${theme('color.secondary.surface')};
  &:focus,
  &:hover {
    outline: none;
    border: 0;
    background-color: ${theme('color.secondary.hover')};
    & * {
      transition: ${theme('animation.time.normal')};
      /* fill: ${theme('color.secondary.surface')}; */
    }
  }
`

const Divider = styled(DropdownMenu.Separator)`
  background-color: ${theme('color.popper.border')};
  height: 1px;
  margin: 8px 12px;
`

const Menu = () => {
  return (
    <Dialog.Root>
      <DropdownMenu.Root>
        <MenuButton>
          <Icon name='Menu' />
        </MenuButton>
        <Dropdown side='left' sideOffset={-40} align='end' alignOffset={30}>
          <DialogTrigger>
            <Item>
              <Icon name='Bucket' />
              <ItemTitle>Appearance</ItemTitle>
            </Item>
          </DialogTrigger>
          <Divider />
          <Item>
            <Icon name='Exit' />
            <ItemTitle>Logout</ItemTitle>
          </Item>
        </Dropdown>
      </DropdownMenu.Root>
      <Dialog.Portal>
        <AppearanceToolbarWrapper>
          <AppearanceToolbar>
            <Toolbar.ToggleGroup
              type='single'
              value='normal'
              onValueChange={(value) => {
                console.log(value)
              }}
            >
              <Toolbar.ToggleItem value='small'>A</Toolbar.ToggleItem>
              <Toolbar.ToggleItem value='normal'>AA</Toolbar.ToggleItem>
              <Toolbar.ToggleItem value='large'>AAA</Toolbar.ToggleItem>
            </Toolbar.ToggleGroup>
            <Toolbar.Separator />
            <Toolbar.ToggleGroup
              type='single'
              value='inter'
              onValueChange={(value) => {
                console.log(value)
              }}
            >
              <Toolbar.ToggleItem value='inter'>Inter</Toolbar.ToggleItem>
              <Toolbar.ToggleItem value='novella'>Novella</Toolbar.ToggleItem>
            </Toolbar.ToggleGroup>
          </AppearanceToolbar>
        </AppearanceToolbarWrapper>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { Menu }
