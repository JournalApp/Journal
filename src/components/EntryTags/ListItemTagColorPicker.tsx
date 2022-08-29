import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { theme } from 'themes'
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
} from './styled'
import type { Tag } from './types'

type ListItemTagColorPickerProps = {
  tag: Tag
}

function ListItemTagColorPicker({ tag }: ListItemTagColorPickerProps) {
  const [open, setOpen] = useState(false)

  const { floating, strategy, reference, x, y, context } = useFloating<HTMLInputElement>({
    placement: 'left-start',
    open,
    onOpenChange: setOpen,
    middleware: [offset({ crossAxis: 0, mainAxis: 20 })],
  })

  return (
    <>
      <StyledEditTagColorPickerContainer ref={reference}>
        <StyledTagColorDot fillColor={theme(`color.tags.${tag.color}`)} />
        <StyledColorPickerChevronIcon onClick={() => setOpen(true)} />
      </StyledEditTagColorPickerContainer>
      <FloatingPortal>
        {open && (
          <FloatingFocusManager context={context} preventTabbing>
            <StyledEditTagColorPickerPopover
              ref={floating}
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
              }}
            >
              123
            </StyledEditTagColorPickerPopover>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </>
  )
}

export { ListItemTagColorPicker }
