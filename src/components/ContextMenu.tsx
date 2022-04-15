import React, { ReactPortal, useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import { FormatToolbar } from 'components'
import { theme } from 'themes'
import {
  offset,
  shift,
  flip,
  useFloating,
  FloatingPortal,
  FloatingOverlay,
  useInteractions,
  useClick,
} from '@floating-ui/react-dom-interactions'
import { getSelectionText } from '@udecode/plate'
import { usePlateEditorState, useEventPlateId } from '@udecode/plate-core'
import { Transforms, Editor as SlateEditor } from 'slate'
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
interface MenuProps {
  posX?: string
  posY?: string
  pos?: string
}

const Dropdown = styled.div<MenuProps>`
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

const Item = styled.button`
  display: flex;
  border: 0;
  gap: 24px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  background-color: ${theme('color.popper.surface')};
  align-items: center;
  transition: ${theme('animation.time.normal')};
  &:hover {
    background-color: ${theme('color.popper.hover')};
  }
`

const ItemTitle = styled.span`
  flex-grow: 1;
  color: ${theme('color.popper.main')};
  font-size: 14px;
  line-height: 20px;
  text-align: left;
`

const ItemShortcut = styled.span`
  font-size: 14px;
  color: ${theme('color.popper.main')};
  line-height: 20px;
  text-align: right;
  opacity: 0.3;
`

const Divider = styled.div`
  background-color: ${theme('color.popper.border')};
  height: 1px;
  margin: 8px 12px;
`

interface ContextMenuProps {
  focused: boolean
  setContextMenuVisible: (val: any) => void
  toggleContextMenu: any
}

export const ContextMenu = ({
  focused,
  setContextMenuVisible,
  toggleContextMenu,
}: ContextMenuProps) => {
  const editor = usePlateEditorState(useEventPlateId())
  const [spellSuggections, setSpellSuggections] = useState([])
  const [visible, setVisible] = useState(false)
  const selectionText = editor && getSelectionText(editor)
  const { x, y, reference, floating, strategy, refs } = useFloating({
    placement: 'right-start',
    middleware: [offset({ mainAxis: 5, alignmentAxis: 4 }), flip(), shift()],
  })

  const setOpen = (e: any) => {
    console.log('onContextMenu')
    if (!visible) {
      window.electronAPI.handleSpellCheck((event: any, value: any) => {
        console.log('handleSpellCheck')
        console.log(value)
        if (!!value.dictionarySuggestions) {
          setSpellSuggections([...value.dictionarySuggestions])
        }
      })
    }
    setVisible(!visible)

    reference({
      getBoundingClientRect() {
        return {
          x: e.clientX,
          y: e.clientY,
          width: 0,
          height: 0,
          top: e.clientY,
          right: e.clientX,
          bottom: e.clientY,
          left: e.clientX,
        }
      },
    })
  }

  const replaceWithSuggestion = (e: any, suggestion: string) => {
    Transforms.insertText(editor, suggestion)
    setVisible(false)
    e.preventDefault()
  }

  const clipboardCommand = (e: any, command: string) => {
    switch (command) {
      case 'copy':
        document.execCommand('copy')
        break
      case 'cut':
        document.execCommand('cut')
        break
      case 'paste':
        navigator.clipboard.read().then((result) => {
          for (let i = 0; i < result.length; i++) {
            if (result[i].types.includes('text/html')) {
              result[i].getType('text/html').then((blob) => {
                blob.text().then((res) => {
                  const dataTransfer = {
                    constructor: {
                      name: 'DataTransfer',
                    },
                    getData: (format: string) => format === 'text/html' && res,
                  } as any
                  // TODO Fix bullet lists pasting
                  editor.insertData(dataTransfer)
                  console.log(res)
                })
              })
            } else if (result[i].types.includes('text/plain')) {
              result[i].getType('text/plain').then((blob) => {
                blob.text().then((res) => {
                  Transforms.insertText(editor, res)
                })
              })
            }
          }
        })
        break
      default:
        break
    }
    setVisible(false)
    e.preventDefault()
  }

  useEffect(() => {
    // Assign function to parent's Ref
    toggleContextMenu.current = setOpen
  }, [])

  useEffect(() => {
    setContextMenuVisible(visible)
    if (visible) {
      console.log('addEventListener')
      window.addEventListener('click', () => setVisible(false), { once: true })
    }
  }, [visible])

  useEffect(() => {
    if (!focused) {
      setVisible(false)
    }
  }, [focused])

  return (
    <FloatingPortal>
      {visible && (
        <Dropdown
          ref={floating}
          posX={`${Math.floor(x)}px`}
          posY={`${Math.floor(y)}px`}
          pos={strategy}
        >
          {spellSuggections &&
            spellSuggections.map((suggestion, i) => (
              <Item key={i} onMouseDown={(e) => replaceWithSuggestion(e, suggestion)}>
                <ItemTitle>{suggestion}</ItemTitle>
              </Item>
            ))}
          {spellSuggections.length > 0 ? <Divider /> : ''}
          {selectionText && (
            <Item onMouseDown={(e) => clipboardCommand(e, 'cut')}>
              <ItemTitle>Cut</ItemTitle>
              <ItemShortcut>⌘X</ItemShortcut>
            </Item>
          )}
          {selectionText && (
            <Item onMouseDown={(e) => clipboardCommand(e, 'copy')}>
              <ItemTitle>Copy</ItemTitle>
              <ItemShortcut>⌘C</ItemShortcut>
            </Item>
          )}
          <Item onMouseDown={(e) => clipboardCommand(e, 'paste')}>
            <ItemTitle>Paste</ItemTitle>
            <ItemShortcut>⌘V</ItemShortcut>
          </Item>
        </Dropdown>
      )}
    </FloatingPortal>
  )
}
