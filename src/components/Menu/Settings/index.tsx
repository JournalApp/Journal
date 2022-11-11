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
import { BillingTabContent } from './Billing'
import { EarnTabContent } from './Earn'
import { useIsOnline } from 'hooks'
import { Icon } from 'components'
import {
  TabsStyled,
  ContentStyled,
  ListStyled,
  MenuItemStyled,
  SettingsTitleStyled,
  Offline,
} from './styled'

interface SettingsDialogProps {
  setOpenSettings: React.MutableRefObject<any>
  returnFocus: React.MutableRefObject<HTMLButtonElement>
}

const SettingsDialog = ({ setOpenSettings, returnFocus }: SettingsDialogProps) => {
  const [open, setOpen] = useState(true)
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
                    {
                      // TODO hide Upgrade tab if user has Writer plan
                    }
                    <MenuItemStyled ref={initialFocus} value='tab1'>
                      Upgrade
                    </MenuItemStyled>
                    <MenuItemStyled value='tab2'>Earn credit</MenuItemStyled>
                    <MenuItemStyled value='tab3'>Billing</MenuItemStyled>
                  </ListStyled>
                  {isOnline ? (
                    <>
                      <ContentStyled value='tab1'>
                        <UpgradeTabContent />
                      </ContentStyled>
                      <ContentStyled value='tab2'>
                        <EarnTabContent />{' '}
                      </ContentStyled>
                      <ContentStyled value='tab3'>
                        <BillingTabContent />
                      </ContentStyled>
                    </>
                  ) : (
                    <Offline>
                      <Icon name='Offline' tintColor={theme('color.popper.main', 0.2)} /> Please go
                      online to manage your settings.
                    </Offline>
                  )}
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
