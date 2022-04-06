import React from 'react'
import { theme } from 'themes'
import styled, { keyframes } from 'styled-components'
import * as Menu from '@radix-ui/react-context-menu'

const showDropdown = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

const Dropdown = styled(Menu.Content)`
  padding: 4px;
  border-radius: 12px;
  box-shadow: ${theme('style.shadow')};
  background-color: ${theme('color.neutral.popper')};
  animation-name: ${showDropdown};
  animation-duration: ${theme('animation.time.normal')};
`

const Item = styled(Menu.Item)`
  display: flex;
  border: 0;
  gap: 8px;
  padding: 2px 12px 2px 4px;
  border-radius: 8px;
  cursor: pointer;

  background-color: ${theme('color.neutral.popper')};
  align-items: center;
  transition: ${theme('animation.time.normal')};
  &:hover {
    background-color: ${theme('color.neutral.hover')};
  }
`
type ItemCurrentProps = {
  current?: boolean
}

const ItemTitle = styled.span<ItemCurrentProps>`
  font-size: 14px;
  font-weight: ${(props) => (props.current ? '700' : 'normal')};
  line-height: 20px;
  text-align: left;
`

const Divider = styled(Menu.Separator)`
  background-color: ${theme('color.neutral.border')};
  height: 1px;
  margin: 8px 12px;
`

export const ContextMenu = (props: any) => (
  <Menu.Root>
    <Menu.Trigger>{props.children}</Menu.Trigger>

    <Dropdown>
      <Item>
        <ItemTitle>Bla</ItemTitle>
      </Item>
      <Divider />
      <Item>
        <ItemTitle>Cut</ItemTitle>
      </Item>
      <Item>
        <ItemTitle>Copy</ItemTitle>
      </Item>
      <Item>
        <ItemTitle>Paste</ItemTitle>
      </Item>
    </Dropdown>
  </Menu.Root>
)
