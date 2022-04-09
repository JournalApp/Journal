import React, { ReactPortal, useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import * as ReactDOM from 'react-dom'
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
}

export const ContextMenu = ({ children, focused }: ContextMenuProps) => {
  const [isHidden, setIsHidden] = useState(true)
  const [spellSuggections, setSpellSuggections] = useState([])
  const { x, y, reference, floating, strategy, refs } = useFloating({
    placement: 'right-start',
    middleware: [offset({ mainAxis: 5, alignmentAxis: 4 }), flip(), shift()],
  })

  useEffect(() => {
    console.log(`isHidden: ${isHidden}`)
  }, [isHidden])

  const setOpen = (e: any) => {
    console.log('onContextMenu')
    if (isHidden) {
      window.electronAPI.handleSpellCheck((event: any, value: any) => {
        console.log('handleSpellCheck')
        console.log(value)
        if (!!value.dictionarySuggestions) {
          setSpellSuggections([...value.dictionarySuggestions])
        }
      })
    }
    setIsHidden(!isHidden)

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
    console.log('done')
    setIsHidden(true)
  }

  useEffect(() => {
    if (!isHidden) {
      console.log('addEventListener')
      window.addEventListener('click', () => setIsHidden(true), { once: true })
      // window.addEventListener('contextmenu', () => console.log('-->contextmenu'), { once: true })
    }

    return () => {
      // console.log('removeEventListener')
      // window.removeEventListener('click', () => setIsHidden(true))
      // window.removeEventListener('contextmenu', () => setIsHidden(true))
    }
  }, [isHidden])

  useEffect(() => {
    if (!focused) {
      setIsHidden(true)
    }
  }, [focused])

  return (
    <>
      <div ref={reference} onContextMenu={setOpen}>
        {children}
      </div>
      <FloatingPortal>
        {!isHidden && (
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
