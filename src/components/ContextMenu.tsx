import React from 'react'
import * as Menu from '@radix-ui/react-context-menu'

export const ContextMenu = (props: any) => (
  <Menu.Root>
    <Menu.Trigger>{props.children}</Menu.Trigger>

    <Menu.Content>
      <Menu.Item>Hello</Menu.Item>
    </Menu.Content>
  </Menu.Root>
)
