import React, { useState, useEffect, useRef } from 'react'
import { theme } from 'themes'
import { logger } from 'utils'
import {
  useFloating,
  FloatingOverlay,
  useInteractions,
  useDismiss,
  useClick,
  FloatingFocusManager,
  useFloatingNodeId,
  FloatingNode,
  FloatingPortal,
} from '@floating-ui/react-dom-interactions'
import {
  IconCloseStyled,
  ModalStyled,
  ButtonDestructiveStyled,
  ButtonStyled,
  ButtonGhostStyled,
  TitleStyled,
  DescriptionStyled,
  ActionsWrapperStyled,
} from './styled'

interface ModalProps {
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>
  action: any
}

const Modal = ({ setOpenModal, action }: ModalProps) => {
  const [open, setOpen] = useState(true)
  const actionRef = useRef(null)
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
        setOpenModal(false)
      }
    }
  }

  useEffect(() => {
    logger('✅ addEventListener')
    document.addEventListener('keydown', handleCloseEsc)
    setTimeout(() => {
      actionRef.current.focus()
    }, 200)

    return () => {
      logger('❌ removeEventListener')
      document.removeEventListener('keydown', handleCloseEsc)
    }
  }, [])

  return (
    <FloatingNode id={nodeId}>
      <FloatingPortal>
        <FloatingOverlay
          lockScroll
          style={{
            display: 'grid',
            placeItems: 'center',
            background: theme('color.primary.surface', 0.8),
            zIndex: 1010,
          }}
        >
          <FloatingFocusManager context={context} initialFocus={0}>
            <ModalStyled ref={floating} {...getFloatingProps()}>
              <TitleStyled>Remove this entry permanently?</TitleStyled>
              <DescriptionStyled>This can't be undone.</DescriptionStyled>
              <ActionsWrapperStyled>
                <ButtonDestructiveStyled onClick={() => action()}>Remove</ButtonDestructiveStyled>
                <ButtonGhostStyled ref={actionRef} onClick={() => setOpenModal(false)}>
                  Close
                </ButtonGhostStyled>
              </ActionsWrapperStyled>
            </ModalStyled>
          </FloatingFocusManager>
        </FloatingOverlay>
      </FloatingPortal>
    </FloatingNode>
  )
}

export { Modal }
