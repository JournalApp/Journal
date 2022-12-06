import * as Dialog from '@radix-ui/react-dialog'
import React, { useRef } from 'react'
import styled from 'styled-components'
import { theme } from 'themes'

const Overlay = styled(Dialog.Overlay)`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: ${theme('color.primary.surface', 0.8)};
  display: grid;
  place-items: center;
`

const Content = styled(Dialog.Content)`
  -webkit-app-region: no-drag;
  position: fixed;
  color: ${theme('color.primary.main')};
  background-color: ${theme('color.popper.surface')};
  border-radius: 12px;
  box-shadow: ${theme('style.shadow')};
  padding: 24px;
  display: flex;
  flex-direction: column;
  width: 330px;
`

const Trigger = styled(Dialog.Trigger)`
  border: 0;
  outline: 0;
  background: transparent;
  padding: 0;
  margin: 0;
`

const Title = styled(Dialog.Title)`
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 28px;
  margin-bottom: 8px;
  letter-spacing: -0.03em;
`

const Description = styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
`
const Actions = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 32px;
`

const Close = styled.button`
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  padding: 8px;
  color: ${theme('color.primary.main')};
  border: 0;
  border-radius: 6px;
  flex-grow: 1;
  background: transparent;
  cursor: pointer;
  outline: 0;
  &:hover {
    box-shadow: 0 0 0 3px ${theme('color.popper.border')};
    transition: box-shadow ${theme('animation.time.normal')} ease;
  }
`

const Action = styled.button`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  padding: 8px;
  color: ${theme('color.error.main')};
  border: 1px solid ${theme('color.error.main')};
  border-radius: 6px;
  flex-grow: 1;
  background: transparent;
  cursor: pointer;
  outline: 0;
  &:hover {
    box-shadow: 0 0 0 3px ${theme('color.error.main', 0.2)};
    transition: box-shadow ${theme('animation.time.normal')} ease;
  }
`

interface ConfirmationModalProps {
  action: any
  children: any
  titleText: string
  descriptionText?: string
  confirmActionText?: string
  cancelActionText?: string
}

const ConfirmationModal = ({
  action,
  children,
  titleText,
  descriptionText = '',
  confirmActionText = 'Confirm',
  cancelActionText = 'Cancel',
}: any) => {
  const [open, setOpen] = React.useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const performAction = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    action()
    setOpen(false)
  }

  const close = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Trigger>{children}</Trigger>
      <Dialog.Portal>
        <Overlay>
          <Content>
            <Title>{titleText}</Title>
            <Description>{descriptionText}</Description>
            <Actions>
              <Action onMouseDown={(e) => performAction(e)}>{confirmActionText}</Action>
              <Close ref={closeRef} onMouseDown={(e) => close(e)}>
                {cancelActionText}
              </Close>
            </Actions>
          </Content>
        </Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { ConfirmationModal }
