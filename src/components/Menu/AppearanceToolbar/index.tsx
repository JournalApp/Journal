import React, { useState, useEffect, useRef } from 'react';
import { lightTheme, darkTheme, forestTheme, cappuccinoTheme } from '@/themes';
import { useAppearanceContext, AppearanceContextInterface, useUserContext } from '@/context';
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
import {
  AppearanceToolbarWrapperStyled,
  AppearanceToolbarStyled,
  ToggleButtonStyled,
  ToggleGroupStyled,
  ToggleFontAStyled,
  ToggleFontAAStyled,
  ToggleFontAAAStyled,
  ColorSwatchStyled,
  HorizontalDividerStyled,
} from './styled';

interface AppearanceToolbarProps {
  setOpenAppearanceToolbar: React.MutableRefObject<any>;
  returnFocus: React.MutableRefObject<HTMLButtonElement>;
}

const AppearanceToolbar = ({ setOpenAppearanceToolbar, returnFocus }: AppearanceToolbarProps) => {
  const [open, setOpen] = useState(false);
  const { session } = useUserContext();
  const firstRender = useRef(true);
  const initialFocus = useRef<HTMLDivElement>(null);
  const nodeId = useFloatingNodeId();
  const { fontSize, setFontSize, fontFace, setFontFace, colorTheme, setColorTheme } =
    useAppearanceContext();

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
    setOpenAppearanceToolbar.current = setOpen;

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
        document.documentElement.style.setProperty('--prompt-opacity', '0');
        setTimeout(() => {
          initialFocus.current.focus();
        }, 100);
      } else {
        document.documentElement.style.setProperty('--prompt-opacity', '1');
        setTimeout(() => {
          returnFocus.current.focus();
        }, 100);
      }
    }
    if (open) {
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'appearance open',
      });
    }
  }, [open]);

  return (
    <FloatingTree>
      <FloatingNode id={nodeId}>
        <FloatingPortal>
          {open && (
            <FloatingOverlay style={{ zIndex: 300 }}>
              <FloatingFocusManager context={context}>
                <AppearanceToolbarWrapperStyled ref={refs.setFloating} {...getFloatingProps()}>
                  <AppearanceToolbarStyled ref={initialFocus}>
                    <ToggleGroupStyled
                      type="single"
                      defaultValue={fontSize}
                      onValueChange={(value) => {
                        setFontSize(value as AppearanceContextInterface['fontSize']);
                      }}
                    >
                      <ToggleFontAStyled value="small" disabled={fontSize == 'small'}>
                        A
                      </ToggleFontAStyled>
                      <ToggleFontAAStyled value="normal" disabled={fontSize == 'normal'}>
                        A
                      </ToggleFontAAStyled>
                      <ToggleFontAAAStyled value="large" disabled={fontSize == 'large'}>
                        A
                      </ToggleFontAAAStyled>
                    </ToggleGroupStyled>
                    <HorizontalDividerStyled />
                    <ToggleGroupStyled
                      type="single"
                      defaultValue={colorTheme}
                      onValueChange={(value) => {
                        setColorTheme(value as AppearanceContextInterface['colorTheme']);
                      }}
                    >
                      <ToggleButtonStyled
                        value="light"
                        padding="8px"
                        disabled={colorTheme == 'light'}
                      >
                        <ColorSwatchStyled
                          fillColor={`rgba(${lightTheme.color.primary.surface},1)`}
                        />
                      </ToggleButtonStyled>
                      <ToggleButtonStyled
                        value="cappuccino"
                        padding="8px"
                        disabled={colorTheme == 'cappuccino'}
                      >
                        <ColorSwatchStyled
                          fillColor={`rgba(${cappuccinoTheme.color.primary.surface},1)`}
                        />
                      </ToggleButtonStyled>
                      <ToggleButtonStyled
                        value="forest"
                        padding="8px"
                        disabled={colorTheme == 'forest'}
                      >
                        <ColorSwatchStyled
                          fillColor={`rgba(${forestTheme.color.primary.surface},1)`}
                        />
                      </ToggleButtonStyled>
                      <ToggleButtonStyled
                        value="dark"
                        padding="8px"
                        disabled={colorTheme == 'dark'}
                      >
                        <ColorSwatchStyled
                          fillColor={`rgba(${darkTheme.color.primary.surface},1)`}
                        />
                      </ToggleButtonStyled>
                      {/* <ToggleGroupNestedStyled>
                        <ToggleButtonSmallStyled
                          value='cappuccino'
                          padding='8px'
                          disabled={colorTheme == 'cappuccino'}
                        >
                          <ColorSwatchSmallStyled
                            fillColor={`rgba(${cappuccinoTheme.color.primary.surface},1)`}
                          />
                        </ToggleButtonSmallStyled>
                        <ToggleButtonSmallStyled
                          value='forest'
                          padding='8px'
                          disabled={colorTheme == 'forest'}
                        >
                          <ColorSwatchSmallStyled
                            fillColor={`rgba(${forestTheme.color.primary.surface},1)`}
                          />
                        </ToggleButtonSmallStyled>
                      </ToggleGroupNestedStyled> */}
                    </ToggleGroupStyled>
                    <HorizontalDividerStyled />
                    <ToggleGroupStyled
                      type="single"
                      defaultValue={fontFace}
                      onValueChange={(value) => {
                        setFontFace(value as AppearanceContextInterface['fontFace']);
                      }}
                    >
                      <ToggleButtonStyled value="inter" disabled={fontFace == 'inter'}>
                        Inter
                      </ToggleButtonStyled>
                      <ToggleButtonStyled
                        value="novela"
                        fontName="Novela"
                        disabled={fontFace == 'novela'}
                      >
                        Novela
                      </ToggleButtonStyled>
                    </ToggleGroupStyled>
                  </AppearanceToolbarStyled>
                </AppearanceToolbarWrapperStyled>
              </FloatingFocusManager>
            </FloatingOverlay>
          )}
        </FloatingPortal>
      </FloatingNode>
    </FloatingTree>
  );
};

export { AppearanceToolbar };
