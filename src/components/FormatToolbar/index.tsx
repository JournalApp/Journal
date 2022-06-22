import React, { ReactPortal, useState, useEffect, useLayoutEffect, forwardRef } from 'react'
import * as Toolbar from '@radix-ui/react-toolbar'
import * as Toggle from '@radix-ui/react-toggle'
import { offset, shift, useFloating, FloatingPortal } from '@floating-ui/react-dom-interactions'
import { BaseRange, BasePoint, Transforms, Editor as SlateEditor } from 'slate'
import { Icon } from 'components'
import { BlockTypeSelect } from './BlockTypeSelect'
import { theme } from 'themes'

import {
  MARK_BOLD,
  MARK_UNDERLINE,
  MARK_ITALIC,
  MARK_STRIKETHROUGH,
  MARK_CODE,
  MARK_HIGHLIGHT,
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
import styled, { keyframes } from 'styled-components'

interface WrapperProps {
  posX?: string
  posY?: string
  pos?: string
}

const showToolbar = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

const Wrapper = styled.div<WrapperProps>`
  position: ${(props) => (props.pos ? props.pos : 'absolute')};
  top: ${(props) => (props.posY ? props.posY : '')};
  left: ${(props) => (props.posX ? props.posX : '')};
  transition: ${theme('animation.time.fast')};
  animation-name: ${showToolbar};
  animation-duration: ${theme('animation.time.long')};
`

const StyledToolbar = styled(Toolbar.Root)`
  display: flex;
  padding: 4px;
  gap: 8px;
  box-shadow: ${theme('style.shadow')};
  min-width: max-content;
  border-radius: 12px;
  background-color: ${theme('color.popper.surface')};
`

interface StyledToggleProps {
  toggleOn: boolean
}

const ToggleGroup = styled.div`
  display: flex;
  flex-basis: row;
  border-radius: 8px;

  & > :first-child {
    border-radius: 8px 0 0 8px;
  }

  & > :last-child {
    border-radius: 0 8px 8px 0;
  }
`

const StyledToggle = styled.div<StyledToggleProps>`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: ${(props) =>
    props.toggleOn ? theme('color.popper.main') : theme('color.popper.inverted')};
  &:hover {
    background-color: ${(props) =>
      props.toggleOn ? theme('color.popper.main') : theme('color.popper.hoverInverted')};
  }
  transition: ${theme('animation.time.normal')};
`

const getSelectionBoundingClientRect = () => {
  const domSelection = window.getSelection()
  if (!domSelection || domSelection.rangeCount < 1) return
  const domRange = domSelection.getRangeAt(0)
  return domRange.getBoundingClientRect()
}

const options = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' },
]

interface FormatToolbarProps {
  focused: boolean
  isContextMenuVisible: any
}

export const FormatToolbar = ({ focused, isContextMenuVisible }: FormatToolbarProps) => {
  const editorRef = usePlateEditorRef()
  const editor = usePlateEditorState(useEventPlateId())
  const [isHidden, setIsHidden] = useState(true)
  const selectionExpanded = editor && isSelectionExpanded(editor)
  const selectionText = editor && getSelectionText(editor)
  const { x, y, reference, floating, strategy } = useFloating({
    placement: 'top-start',
    middleware: [shift(), offset({ mainAxis: 8 })],
  })

  // https://github.com/udecode/plate/issues/1352#issuecomment-1056975461
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
    // console.log('useLayoutEffect')
  }, [reference, selectionExpanded, selectionText, editor.children])

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

  const Toggle = withPlateEventProvider(({ markType, iconName }: any) => {
    const id = useEventPlateId()
    const editor = usePlateEditorState(id)
    const type = getPluginType(editorRef, markType)
    const state = !!editor?.selection && isMarkActive(editor, type!)

    const onMouseDown = (e: any) => {
      if (editor) {
        getPreventDefaultHandler(toggleMark, editor, { key: type, clear: '' })(e)
      }
    }

    return (
      <StyledToggle toggleOn={state} onMouseDown={onMouseDown}>
        <Icon
          name={iconName}
          tintColor={state ? theme('color.popper.inverted') : theme('color.popper.main')}
        />
      </StyledToggle>
    )
  })

  return (
    <FloatingPortal>
      {!isContextMenuVisible() && !isHidden && (
        <Wrapper
          ref={floating}
          posX={`${Math.floor(x)}px`}
          posY={`${Math.floor(y)}px`}
          pos={strategy}
        >
          <StyledToolbar>
            <BlockTypeSelect />
            <ToggleGroup>
              <Toggle markType={MARK_BOLD} iconName='FormatBold' />
              <Toggle markType={MARK_ITALIC} iconName='FormatItalic' />
              <Toggle markType={MARK_UNDERLINE} iconName='FormatUnderline' />
              <Toggle markType={MARK_STRIKETHROUGH} iconName='FormatStriketrough' />
              <Toggle markType={MARK_CODE} iconName='FormatCode' />
              <Toggle markType={MARK_HIGHLIGHT} iconName='FormatMark' />
            </ToggleGroup>
          </StyledToolbar>
        </Wrapper>
      )}
    </FloatingPortal>
  )
}
