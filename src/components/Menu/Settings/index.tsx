import React, { useState, useEffect, useRef } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { theme } from 'themes'
import { isDev, logger } from 'utils'
import {
  useFloating,
  FloatingTree,
  FloatingOverlay,
  useInteractions,
  useDismiss,
  useClick,
  FloatingFocusManager,
  useFloatingNodeId,
  FloatingNode,
  FloatingPortal,
} from '@floating-ui/react-dom-interactions'
import { Checkout } from './Checkout'
import { UpgradeTabContent } from './Upgrade'
import { useIsOnline } from 'hooks'
import {
  TabsStyled,
  ContentStyled,
  ListStyled,
  MenuItemStyled,
  SettingsTitleStyled,
} from './styled'

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

    document.addEventListener('keydown', handleCloseEsc)
    return () => {
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
                zIndex: 1000,
              }}
            >
              <FloatingFocusManager context={context}>
                <TabsStyled
                  ref={floating}
                  {...getFloatingProps()}
                  defaultValue='tab1'
                  orientation='vertical'
                >
                  <ListStyled>
                    <SettingsTitleStyled>Settings</SettingsTitleStyled>
                    <MenuItemStyled ref={initialFocus} value='tab1'>
                      Account
                    </MenuItemStyled>
                    <MenuItemStyled value='tab2'>Upgrade</MenuItemStyled>
                    <MenuItemStyled value='tab3'>Billing</MenuItemStyled>
                  </ListStyled>
                  <ContentStyled>
                    <Tabs.Content value='tab1'>
                      Tab one content
                      <Checkout />
                    </Tabs.Content>
                    <Tabs.Content value='tab2'>
                      <UpgradeTabContent />
                    </Tabs.Content>
                    <Tabs.Content value='tab3'>Tab three content</Tabs.Content>
                  </ContentStyled>
                </TabsStyled>
              </FloatingFocusManager>
            </FloatingOverlay>
          )}
        </FloatingPortal>
      </FloatingNode>
    </FloatingTree>
  )
}

export { SettingsDialog }
