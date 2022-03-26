import React, { ReactPortal, useState, useEffect, useLayoutEffect } from 'react'
import * as ReactDOM from 'react-dom'
import * as Toolbar from '@radix-ui/react-toolbar'
import * as Select from '@radix-ui/react-select'
import * as Toggle from '@radix-ui/react-toggle'
import { useFloating, shift, flip } from '@floating-ui/react-dom'
import { BaseRange, BasePoint, Transforms, Editor as SlateEditor } from 'slate'
import { Icon } from './Icon'
import { FormatBold } from '@styled-icons/material/FormatBold'
// import { getSelectionText, isSelectionExpanded } from '@udecode/plate-common'
import {
  MARK_BOLD,
  ELEMENT_H1,
  MarkToolbarButton,
  usePlateEditorRef,
  getPluginType,
  getSelectionText,
  isSelectionExpanded,
} from '@udecode/plate'
import {
  getPreventDefaultHandler,
  someNode,
  toggleNodeType,
  toggleMark,
  useEventPlateId,
  usePlateEditorState,
  withPlateEventProvider,
  isMarkActive,
} from '@udecode/plate-core'
import styled from 'styled-components'
import { VirtualElement } from '@floating-ui/dom'

interface WrapperProps {
  posX?: string
  posY?: string
  pos?: string
}

const Wrapper = styled.div<WrapperProps>`
  position: ${(props) => (props.pos ? props.pos : 'absolute')};
  top: ${(props) => (props.posY ? props.posY : '')};
  left: ${(props) => (props.posX ? props.posX : '')};
  transition: 0.2s;
`

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

const getSelectionBoundingClientRect = () => {
  const domSelection = window.getSelection()
  if (!domSelection || domSelection.rangeCount < 1) return
  const domRange = domSelection.getRangeAt(0)
  return domRange.getBoundingClientRect()
}

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

interface FormatToolbarProps {
  focused: boolean
}

export const FormatToolbar = ({ focused }: FormatToolbarProps) => {
  const editorRef = usePlateEditorRef()
  const editor = usePlateEditorState(useEventPlateId())
  const [isHidden, setIsHidden] = useState(true)
  const selectionExpanded = editor && isSelectionExpanded(editor)
  const selectionText = editor && getSelectionText(editor)
  const { x, y, reference, floating, strategy, update, refs } = useFloating({
    placement: 'top',
    middleware: [shift()],
  })

  // TODO https://github.com/udecode/plate/issues/1352#issuecomment-1056975461
  // useEffect(() => {
  //   if (editor && !editor.selection) {
  //     Transforms.select(editor, SlateEditor.end(editor, []))
  //   }
  // }, [editor])

  useLayoutEffect(() => {
    reference({
      getBoundingClientRect() {
        const { top, right, bottom, left, width, height, x, y } = getSelectionBoundingClientRect()
        return { top, right, bottom, left, width, height, x, y }
      },
    })
    console.log('useLayoutEffect')
  }, [reference, selectionExpanded, selectionText])

  useEffect(() => {
    if (!focused) {
      setIsHidden(true)
    } else {
      if (!selectionText) {
        setIsHidden(true)
      } else if (selectionText && selectionExpanded) {
        setIsHidden(false)
      }
    }
  }, [selectionExpanded, selectionText, focused])

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
      <StyledToggle
        pressed={!!editor?.selection && isMarkActive(editor, type!)}
        onPressedChange={onPressedChange}
        onMouseDown={onMouseDown}
      >
        <Icon name='check24' />
      </StyledToggle>
    )
  })

  const Mark = withPlateEventProvider(() => {
    const id = useEventPlateId()
    const editor = usePlateEditorState(id)
    const type = getPluginType(editorRef, ELEMENT_H1)

    const onPressedChange = (pressed: boolean) => {
      console.log(`Pressed: ${pressed}`)
    }

    const onMouseDown = (e: any) => {
      if (editor) {
        getPreventDefaultHandler(toggleNodeType, editor, {
          activeType: type,
          inactiveType: '',
        })(e)
      }
    }

    return (
      <StyledToggle
        pressed={!!editor?.selection && someNode(editor, { match: { type } })}
        onPressedChange={onPressedChange}
        onMouseDown={onMouseDown}
      >
        <Icon name='check24' />
      </StyledToggle>
    )
  })

  return (
    !isHidden &&
    ReactDOM.createPortal(
      <Wrapper
        ref={floating}
        posX={`${Math.floor(x)}px`}
        posY={`${Math.floor(y)}px`}
        pos={strategy}
      >
        <StyledToolbar>
          <BlockTypeSelect />
          <Mark />
          <Toggle />
          <Toolbar.Button />
        </StyledToolbar>
      </Wrapper>,
      document.body
    )
  )
}
