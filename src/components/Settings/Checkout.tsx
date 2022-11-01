import React, { useState, useEffect, useRef } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import styled from 'styled-components'
import { theme } from 'themes'
import { isDev, logger } from 'utils'
import { Upgrade } from './Upgrade'
import {
  useFloating,
  offset,
  FloatingTree,
  FloatingOverlay,
  useListNavigation,
  useInteractions,
  useDismiss,
  useId,
  useClick,
  useRole,
  FloatingFocusManager,
  useFocus,
  useFloatingNodeId,
  useFloatingParentNodeId,
  FloatingNode,
  FloatingPortal,
  useFloatingTree,
} from '@floating-ui/react-dom-interactions'

const Checkout = () => {
  const [open, setOpen] = useState(false)
  const nodeId = useFloatingNodeId()

  const { reference, floating, context, refs } = useFloating({
    open,
    onOpenChange: setOpen,
    nodeId,
  })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context, {
      escapeKey: false,
    }),
  ])

  const handleCloseEsc = (e: any) => {
    if (e.key == 'Escape') {
      if (refs.floating.current && refs.floating.current.contains(document.activeElement)) {
        setOpen(false)
      }
    }
  }

  useEffect(() => {
    logger('✅ addEventListener')
    document.addEventListener('keydown', handleCloseEsc)
    return () => {
      logger('❌ removeEventListener')
      document.removeEventListener('keydown', handleCloseEsc)
    }
  }, [])

  return (
    <FloatingNode id={nodeId}>
      <button ref={reference} {...getReferenceProps()} onClick={() => setOpen(true)}>
        Open checkout
      </button>

      <FloatingPortal>
        {open && (
          <FloatingOverlay
            lockScroll
            style={{
              display: 'grid',
              placeItems: 'center',
              background: theme('color.primary.surface', 0.8),
            }}
          >
            <FloatingFocusManager context={context}>
              <div ref={floating} {...getFloatingProps()}>
                Checkout
                <button onClick={() => setOpen(false)}>Close</button>
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        )}
      </FloatingPortal>
    </FloatingNode>
  )
}

export { Checkout }
