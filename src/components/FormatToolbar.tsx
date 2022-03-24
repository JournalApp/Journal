import React, { ReactPortal } from 'react'
import ReactDOM from 'react-dom'
import * as Toolbar from '@radix-ui/react-toolbar'
import * as Select from '@radix-ui/react-select'
import * as Toggle from '@radix-ui/react-toggle'
import { Icon } from './Icon'
import { FormatBold } from '@styled-icons/material/FormatBold'
import {
  MARK_BOLD,
  ELEMENT_H1,
  MarkToolbarButton,
  usePlateEditorRef,
  getPluginType,
} from '@udecode/plate'
import {
  getPreventDefaultHandler,
  someNode,
  toggleNodeType,
  toggleMark,
  useEventPlateId,
  usePlateEditorState,
  withPlateEventProvider,
} from '@udecode/plate-core'
import styled from 'styled-components'

const StyledToolbar = styled(Toolbar.Root)`
  display: flex;
  padding: 10px;
  width: 100%;
  min-width: max-content;
  border-radius: 6px;
  background-color: white;
`

const StyledToggle = styled(Toggle.Root)`
  border-radius: 6px;
  border: 0;
  background-color: white;
  &[data-state='on'] {
    background-color: silver;
  }
`

const BlockTypeSelect = () => {
  return (
    <Select.Root>
      <Select.Trigger onMouseDown={(e) => console.log('Select.Trigger')}>
        <Select.Value onMouseDown={(e) => console.log('Select.Value')} />
        <Select.Icon onMouseDown={(e) => console.log('Select.Icon')} />
      </Select.Trigger>

      <Select.Content>
        <Select.Viewport>
          <Select.Item value='1'>
            <Select.ItemText>Text</Select.ItemText>
            <Select.ItemIndicator />
          </Select.Item>
          <Select.Item value='2'>
            <Select.ItemText>Header 1</Select.ItemText>
            <Select.ItemIndicator />
          </Select.Item>
          <Select.Item value='3'>
            <Select.ItemText>Header 2</Select.ItemText>
            <Select.ItemIndicator />
          </Select.Item>
        </Select.Viewport>
      </Select.Content>
    </Select.Root>
  )
}

export const FormatToolbar = () => {
  const editorRef = usePlateEditorRef()

  const Toggle = withPlateEventProvider(() => {
    const id = useEventPlateId()
    const editor = usePlateEditorState(id)
    const type = getPluginType(editorRef, MARK_BOLD)

    const onPressedChange = (pressed: boolean) => {
      console.log(`Pressed: ${pressed}`)
    }

    const onMouseDown = (e: any) => {
      if (editor) {
        getPreventDefaultHandler(toggleMark, editor, { key: type, clear: '' })(e)
      }
    }

    return (
      <StyledToggle onPressedChange={onPressedChange} onMouseDown={onMouseDown}>
        <Icon name='check24' />
      </StyledToggle>
    )
  })

  return (
    <StyledToolbar>
      <BlockTypeSelect />
      <Toggle />
      <Toolbar.Button />
      <MarkToolbarButton
        type={getPluginType(editorRef, MARK_BOLD)}
        icon={<Icon name='check24' />}
      />
    </StyledToolbar>
  )
}
