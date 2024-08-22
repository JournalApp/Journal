import React, { useState, useEffect, useRef } from 'react';
import { theme } from '@/themes';
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
} from '@floating-ui/react';
import { UpgradeTabContent } from './Upgrade';
import { BillingTabContent } from './Billing';
import { ImportExportTabContent } from './ImportExport';
import { useIsOnline } from '@/hooks';
import { Icon } from '@/components';
import {
  TabsStyled,
  ContentStyled,
  ListStyled,
  MenuItemStyled,
  SettingsTitleStyled,
  Offline,
} from './styled';
import { useUserContext } from '@/context';

interface SettingsDialogProps {
  returnFocus: React.MutableRefObject<HTMLButtonElement>;
}

const SettingsDialog = ({ returnFocus }: SettingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const firstRender = useRef(true);
  const initialFocus = useRef<HTMLButtonElement>(null);
  const nodeId = useFloatingNodeId();
  const isOnline = useIsOnline();
  const { session, subscription, invokeOpenSettings } = useUserContext();

  const { context, refs } = useFloating({
    open,
    onOpenChange: setOpen,
    nodeId,
  });

  const { getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context, {
      escapeKey: false,
    }),
  ]);

  const handleCloseEsc = (e: any) => {
    if (e.key == 'Escape') {
      if (refs.floating.current && refs.floating.current.contains(document.activeElement)) {
        setOpen(false);
      }
    }
  };

  useEffect(() => {
    invokeOpenSettings.current = setOpen;
    document.addEventListener('keydown', handleCloseEsc);
    return () => {
      document.removeEventListener('keydown', handleCloseEsc);
    };
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
    } else {
      if (open) {
        setTimeout(() => {
          initialFocus.current.focus();
        }, 100);
        window.electronAPI.capture({
          distinctId: session.user.id,
          event: 'settings open',
        });
      } else {
        setTimeout(() => {
          returnFocus.current.focus();
        }, 100);
      }
    }
  }, [open]);

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
                  ref={refs.setFloating}
                  {...getFloatingProps()}
                  defaultValue="tab1"
                  orientation="vertical"
                >
                  <ListStyled>
                    <SettingsTitleStyled>Settings</SettingsTitleStyled>
                    <MenuItemStyled ref={initialFocus} value="tab-upgrade">
                      {subscription == null ? 'Upgrade' : 'Plans'}
                    </MenuItemStyled>
                    {/* <MenuItemStyled value='tab2'>Earn credit</MenuItemStyled> */}
                    <MenuItemStyled value="tab-billing">Billing</MenuItemStyled>
                    <MenuItemStyled value="tab-importexport">Export</MenuItemStyled>
                  </ListStyled>
                  {isOnline ? (
                    <>
                      <ContentStyled value="tab-upgrade">
                        <UpgradeTabContent />
                      </ContentStyled>
                      {/* <ContentStyled value='tab2'>
                        <EarnTabContent />
                      </ContentStyled> */}
                      <ContentStyled value="tab-billing">
                        <BillingTabContent />
                      </ContentStyled>
                      <ContentStyled value="tab-importexport">
                        <ImportExportTabContent />
                      </ContentStyled>
                    </>
                  ) : (
                    <Offline>
                      <Icon name="Offline" tintColor={theme('color.popper.main', 0.2)} /> Please go
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
  );
};

export { SettingsDialog };
