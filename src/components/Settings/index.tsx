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
} from '@floating-ui/react-dom-interactions'
import { Checkout } from './Checkout'
import { useIsOnline } from 'hooks'

const Root = styled(Tabs.Root)`
  display: flex;
  flex-direction: row;
  background-color: ${theme('color.popper.surface')};
  width: -webkit-fill-available;
  max-width: 1000px;
  height: -webkit-fill-available;
  max-height: 600px;
  padding: 8px;
  margin: 48px 8px 8px 8px;
  border-radius: 8px;
`

const Content = styled.div`
  padding: 32px;
`

const List = styled(Tabs.List)`
  display: flex;
  flex-direction: column;
`

interface SettingsDialogProps {
  setOpenSettings: React.MutableRefObject<any>
  returnFocus: React.MutableRefObject<HTMLButtonElement>
}

const SettingsDialog = ({ setOpenSettings, returnFocus }: SettingsDialogProps) => {
  const [open, setOpen] = useState(false)
  const firstRender = useRef(true)
  const initialFocus = useRef<HTMLButtonElement>(null)
  const nodeId = useFloatingNodeId()
  const isOnline = useIsOnline()

  const { floating, context, refs } = useFloating({
    open,
    onOpenChange: setOpen,
    nodeId,
  })

  const { getFloatingProps } = useInteractions([
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
    setOpenSettings.current = setOpen

    logger('✅ addEventListener')
    document.addEventListener('keydown', handleCloseEsc)
    return () => {
      logger('❌ removeEventListener')
      document.removeEventListener('keydown', handleCloseEsc)
    }
  }, [])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
    } else {
      if (open) {
        setTimeout(() => {
          initialFocus.current.focus()
        }, 100)
      } else {
        setTimeout(() => {
          returnFocus.current.focus()
        }, 100)
      }
    }
  }, [open])

  return (
    <FloatingTree>
      <FloatingNode id={nodeId}>
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
                  {isOnline ? (
                    <Root defaultValue='tab1' orientation='vertical'>
                      <List aria-label='tabs example'>
                        <Tabs.Trigger ref={initialFocus} value='tab1'>
                          Account
                        </Tabs.Trigger>
                        <Tabs.Trigger value='tab2'>Upgrade</Tabs.Trigger>
                        <Tabs.Trigger value='tab3'>Invoices</Tabs.Trigger>
                      </List>
                      <Content>
                        <Tabs.Content value='tab1'>
                          Tab one content
                          <Checkout />
                        </Tabs.Content>
                        <Tabs.Content value='tab2'>
                          <Upgrade />
                        </Tabs.Content>
                        <Tabs.Content value='tab3'>Tab three content</Tabs.Content>
                      </Content>
                    </Root>
                  ) : (
                    'offline'
                  )}
                </div>
              </FloatingFocusManager>
            </FloatingOverlay>
          )}
        </FloatingPortal>
      </FloatingNode>
    </FloatingTree>
  )
}

export { SettingsDialog }
