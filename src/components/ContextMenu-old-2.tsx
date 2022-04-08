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
interface MenurProps {
  posX?: string
  posY?: string
  pos?: string
}

const Dropdown = styled.div<MenurProps>`
  position: ${(props) => (props.pos ? props.pos : 'absolute')};
  top: ${(props) => (props.posY ? props.posY : '')};
  left: ${(props) => (props.posX ? props.posX : '')};
  padding: 4px;
  border-radius: 12px;
  box-shadow: ${theme('style.shadow')};
  background-color: ${theme('color.neutral.popper')};
  animation-name: ${showDropdown};
  animation-duration: ${theme('animation.time.normal')};
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

export const ContextMenu = (props: any) => {
  const [isHidden, setIsHidden] = useState(true)
  const { x, y, reference, floating, strategy, refs } = useFloating({
    placement: 'right-start',
    middleware: [offset({ mainAxis: 5, alignmentAxis: 4 }), flip(), shift()],
  })

  useEffect(() => {
    console.log(`isHidden: ${isHidden}`)
  }, [isHidden])

  // useEffect(() => {

  //   refs.reference.current.addEventListener('contextmenu', (event) => {
  //     setOpen(event)
  //   })

  //   return () => {
  //     second
  //   }
  // }, [])

  const setOpen = (e: any) => {
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
    console.log('setOpen')
  }

  const done = () => {
    setIsHidden(true)
  }

  return (
    <>
      <div ref={reference}>{props.children}</div>
      <FloatingPortal>
        {!isHidden && (
          <FloatingOverlay lockScroll>
            <Dropdown
              ref={floating}
              posX={`${Math.floor(x)}px`}
              posY={`${Math.floor(y)}px`}
              pos={strategy}
            >
              <Item onMouseDown={done}>
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
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </>
  )
}
