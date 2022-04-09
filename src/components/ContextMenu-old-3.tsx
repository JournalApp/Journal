import React, { ReactPortal, useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import { FormatToolbar } from 'components'
import { theme } from 'themes'
// import { useFloating, shift, offset } from '@floating-ui/react-dom'
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
import { usePlateEditorRef } from '@udecode/plate'
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
  background-color: ${theme('color.neutral.popper')};
  animation-name: ${showDropdown};
  animation-duration: ${theme('animation.time.normal')};
  -webkit-app-region: no-drag;
`

const Item = styled.button`
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

const Divider = styled.div`
  background-color: ${theme('color.neutral.border')};
  height: 1px;
  margin: 8px 12px;
`

interface ContextMenuProps {
  focused: boolean
  children: any
  setContextMenuVisible: (val: any) => void
}

export const ContextMenu = ({ children, focused, setContextMenuVisible }: ContextMenuProps) => {
  const [spellSuggections, setSpellSuggections] = useState([])
  const [visible, setVisible] = useState(false)
  const { x, y, reference, floating, strategy, refs } = useFloating({
    placement: 'right-start',
    middleware: [offset({ mainAxis: 5, alignmentAxis: 4 }), flip(), shift()],
  })

  useEffect(() => {
    console.log(`contextMenuVisible: ${visible}`)
  }, [visible])

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

  const done = () => {
    // Transforms.insertText(editor, 'Yay!')
    console.log('done')
    setVisible(false)
  }

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

  const ContextMenu2 = () => {}

  return (
    <>
      <div ref={reference} onContextMenu={setOpen}>
        {children}
      </div>
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
                <Item key={i} onMouseDown={done}>
                  <ItemTitle>{suggestion}</ItemTitle>
                </Item>
              ))}

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
        )}
      </FloatingPortal>
    </>
  )
}
