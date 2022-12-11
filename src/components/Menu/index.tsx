import React, { useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { Icon, SettingsDialog } from 'components'
import { AppearanceToolbar } from './AppearanceToolbar'
import { theme, lightTheme, darkTheme } from 'themes'
import { useAppearanceContext, AppearanceContextInterface } from 'context'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { isDev, logger } from 'utils'
import { useUserContext } from 'context'

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

const Dropdown = styled(DropdownMenu.Content)`
  z-index: 9999;
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
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  & em {
    opacity: 0.6;
    font-style: normal;
  }
`

interface MenuButtonProps {
  open: boolean
}

const MenuButton = styled(DropdownMenu.Trigger)<MenuButtonProps>`
  position: fixed;
  top: 8px;
  right: 8px;
  width: 40px;
  height: 24px;
  border-radius: 100px;
  border: 0;
  padding: 4px;
  z-index: 9999;
  -webkit-app-region: no-drag;
  box-shadow: ${theme('style.shadow')};
  transition: 0;
  background-color: ${(props) =>
    props.open ? theme('color.secondary.main') : theme('color.secondary.surface')};
  & * {
    fill: ${(props) =>
      props.open ? theme('color.secondary.surface') : theme('color.secondary.main')};
  }
  &:focus,
  &:hover {
    transition: background-color ${theme('animation.time.normal')};
    outline: none;
    border: 0;
    background-color: ${theme('color.secondary.hover')};
    & * {
      transition: ${theme('animation.time.normal')};
    }
  }
`

const Badge = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: ${theme('color.primary.main')};
  top: -4px;
  right: -4px;
  border-radius: 100px;
  border: 2px solid ${theme('color.primary.surface')};
`

const Divider = styled(DropdownMenu.Separator)`
  background-color: ${theme('color.popper.border')};
  height: 1px;
  margin: 4px 12px;
`

const Menu = () => {
  logger('Menu re-render')
  const [open, setOpen] = useState(false)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const { session, signOut, quitAndInstall, invokeOpenSettings } = useUserContext()
  const setOpenAppearanceToolbar = useRef<any | null>({})
  const returnFocus = useRef<HTMLButtonElement>(null)

  window.electronAPI.onUpdateDownloaded(() => {
    setUpdateDownloaded(true)
  })

  const signOutAndCapture = () => {
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'user signout',
    })
    signOut()
  }

  return (
    <>
      <DropdownMenu.Root onOpenChange={(open) => setOpen(open)}>
        <MenuButton open={open} ref={returnFocus}>
          <Icon name='Menu' />
          {updateDownloaded && <Badge />}
        </MenuButton>
        <Dropdown
          side='left'
          sideOffset={-40}
          align='start'
          alignOffset={30}
          avoidCollisions={false}
        >
          <Item onSelect={setOpenAppearanceToolbar.current}>
            <Icon name='Bucket' />
            <ItemTitle>Appearance</ItemTitle>
          </Item>
          <Divider />
          <Item onSelect={invokeOpenSettings.current}>
            <Icon name='Settings' />
            <ItemTitle>Settings</ItemTitle>
          </Item>
          <Item onSelect={() => signOutAndCapture()}>
            <Icon name='Exit' />
            <ItemTitle>
              Logout <em>{session.user.email}</em>
            </ItemTitle>
          </Item>
          {updateDownloaded && (
            <Item onSelect={() => quitAndInstall()}>
              <Icon name='UpdateNow' />
              <ItemTitle>Update now</ItemTitle>
            </Item>
          )}
          {isDev() && (
            <>
              <Divider />
              <Item>
                <ItemTitle>Development</ItemTitle>
              </Item>
            </>
          )}
        </Dropdown>
      </DropdownMenu.Root>
      <AppearanceToolbar
        returnFocus={returnFocus}
        setOpenAppearanceToolbar={setOpenAppearanceToolbar}
      />
      <SettingsDialog returnFocus={returnFocus} />
    </>
  )
}

export { Menu }
