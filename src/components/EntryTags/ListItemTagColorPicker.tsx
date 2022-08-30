import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { theme, lightTheme } from 'themes'
import {
  useFloating,
  offset,
  FloatingTree,
  useListNavigation,
  useInteractions,
  useDismiss,
  FloatingFocusManager,
  useFocus,
  useFloatingNodeId,
  FloatingNode,
  FloatingPortal,
} from '@floating-ui/react-dom-interactions'
import {
  StyledEditTagColorPickerPopover,
  StyledEditTagColorPickerContainer,
  StyledColorPickerChevronIcon,
  StyledTagColorDot,
  StyledItem,
  StyledItemColorPicker,
} from './styled'
import type { Tag } from './types'
import { logger } from 'src/utils'

type ListItemTagColorPickerProps = {
  tag: Tag
  inputRef: React.MutableRefObject<HTMLInputElement>
  colorPickerOpen: boolean
  setColorPickerOpen: any
}

function ListItemTagColorPicker({
  tag,
  inputRef,
  colorPickerOpen,
  setColorPickerOpen,
}: ListItemTagColorPickerProps) {
  const { floating, strategy, reference, x, y, context } = useFloating<HTMLInputElement>({
    placement: 'left-start',
    open: colorPickerOpen,
    onOpenChange: setColorPickerOpen,
    middleware: [offset({ crossAxis: 0, mainAxis: 20 })],
  })

  const handleColorSelect = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    logger('handleColorSelect')
  }

  const toggleOpen = (e: any) => {
    e.stopPropagation()
    if (colorPickerOpen) {
      setColorPickerOpen(false)
      setTimeout(() => {
        inputRef.current.focus()
      }, 100)
    } else {
      setColorPickerOpen(true)
    }
  }

  return (
    <>
      <StyledEditTagColorPickerContainer ref={reference}>
        <StyledTagColorDot fillColor={theme(`color.tags.${tag.color}`)} />
        <StyledColorPickerChevronIcon
          type={colorPickerOpen ? 'up' : 'down'}
          onMouseDown={(e: any) => toggleOpen(e)}
        />
      </StyledEditTagColorPickerContainer>
      <FloatingPortal>
        {colorPickerOpen && (
          <FloatingFocusManager context={context} preventTabbing>
            <StyledEditTagColorPickerPopover
              ref={floating}
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
              }}
            >
              {Object.keys(lightTheme.color.tags).map(
                (color: keyof typeof lightTheme.color.tags, i) => (
                  <StyledItemColorPicker
                    key={`${i}-${color}`}
                    onMouseDown={(e) => handleColorSelect(e)}
                    isActive={color == tag.color}
                  >
                    <StyledTagColorDot size={16} fillColor={theme(`color.tags.${color}`)} />
                  </StyledItemColorPicker>
                )
              )}
            </StyledEditTagColorPickerPopover>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </>
  )
}

export { ListItemTagColorPicker }
