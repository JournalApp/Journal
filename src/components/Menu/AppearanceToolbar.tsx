import React, { useState, useEffect, useRef } from 'react'
import * as Toolbar from '@radix-ui/react-toolbar'
import styled, { keyframes } from 'styled-components'
import { theme, lightTheme, darkTheme } from 'themes'
import { breakpoints, isDev, logger } from 'utils'
import { useAppearanceContext, AppearanceContextInterface } from 'context'
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

const reveal = keyframes`
  0% {
    margin-bottom: -24px;
    opacity: 0;
  }
  100% {
    margin-bottom: 0px;
    opacity: 1;
  }
`

interface ToggleButtonProps {
  padding?: string
  fontName?: string
}

const ToggleButton = styled(({ padding, fontName, ...props }) => (
  <Toolbar.ToggleItem {...props} />
))<ToggleButtonProps>`
  height: 48px;
  font-size: 14px;
  line-height: 14px;
  min-width: 48px;
  padding: ${(props) => (props.padding ? props.padding : '16px')};
  font-family: ${(props) => (props.fontName ? props.fontName : 'inherit')};
  border-radius: 100px;
  cursor: pointer;
  border: 1px solid ${theme('color.popper.border')};
  background-color: ${theme('color.popper.surface')};
  color: ${theme('color.popper.disabled')};
  transition: ${theme('animation.time.normal')};
  &:disabled {
    cursor: initial;
  }
  &:focus {
    outline: 0;
  }
  &:hover {
    border: 1px solid ${theme('color.popper.disabled')};
  }
  &[data-state='on'] {
    opacity: 1;
    border: 1px solid ${theme('color.popper.main')};
    border: 1px solid ${theme('color.popper.main')};
    color: ${theme('color.popper.main')};
  }
`

const AppearanceToolbarWrapper = styled.div`
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 9999;
  @media ${breakpoints.s} {
    transform: scale(0.9);
    bottom: 60px;
  }
  @media ${breakpoints.xs} {
    transform: scale(0.7);
    bottom: 40px;
  }
`

const AppearanceToolbarStyled = styled(Toolbar.Root)`
  padding: 12px;
  border-radius: 100px;
  gap: 8px;
  display: flex;
  box-shadow: ${theme('style.shadow')};
  background-color: ${theme('color.popper.surface')};
  transition: ${theme('animation.time.normal')};
  animation-name: ${reveal};
  animation-duration: ${theme('animation.time.normal')};
  animation-timing-function: ${theme('animation.timingFunction.dynamic')};
  animation-fill-mode: both;
  -webkit-app-region: no-drag;
`
const ToggleGroup = styled(Toolbar.ToggleGroup)`
  gap: 8px;
  display: flex;
`

const ToggleFontA = styled(ToggleButton)`
  font-size: 13px;
`

const ToggleFontAA = styled(ToggleButton)`
  font-size: 16px;
`

const ToggleFontAAA = styled(ToggleButton)`
  font-size: 22px;
`
interface ColorSwatchProps {
  fillColor: string
}

const ColorSwatch = styled.div<ColorSwatchProps>`
  height: 31px;
  width: 31px;
  border-radius: 100px;
  background-color: ${(props) => props.fillColor};
`

const HorizontalDivider = styled(Toolbar.Separator)`
  background-color: ${theme('color.popper.border')};
  width: 1px;
  margin: 4px 8px;
`

interface AppearanceToolbarProps {
  setOpenAppearanceToolbar: React.MutableRefObject<any>
  returnFocus: React.MutableRefObject<HTMLButtonElement>
}

const AppearanceToolbar = ({ setOpenAppearanceToolbar, returnFocus }: AppearanceToolbarProps) => {
  const [open, setOpen] = useState(false)
  const firstRender = useRef(true)
  const initialFocus = useRef<HTMLDivElement>(null)
  const nodeId = useFloatingNodeId()
  const { fontSize, setFontSize, fontFace, setFontFace, colorTheme, setColorTheme } =
    useAppearanceContext()

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
    setOpenAppearanceToolbar.current = setOpen

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
            <FloatingOverlay>
              <FloatingFocusManager context={context}>
                <AppearanceToolbarWrapper ref={floating} {...getFloatingProps()}>
                  <AppearanceToolbarStyled ref={initialFocus}>
                    <ToggleGroup
                      type='single'
                      defaultValue={fontSize}
                      onValueChange={(value) => {
                        setFontSize(value as AppearanceContextInterface['fontSize'])
                      }}
                    >
                      <ToggleFontA value='small' disabled={fontSize == 'small'}>
                        A
                      </ToggleFontA>
                      <ToggleFontAA value='normal' disabled={fontSize == 'normal'}>
                        A
                      </ToggleFontAA>
                      <ToggleFontAAA value='large' disabled={fontSize == 'large'}>
                        A
                      </ToggleFontAAA>
                    </ToggleGroup>
                    <HorizontalDivider />
                    <ToggleGroup
                      type='single'
                      defaultValue={colorTheme}
                      onValueChange={(value) => {
                        setColorTheme(value as AppearanceContextInterface['colorTheme'])
                      }}
                    >
                      <ToggleButton value='light' padding='8px' disabled={colorTheme == 'light'}>
                        <ColorSwatch fillColor={`rgba(${lightTheme.color.primary.surface},1)`} />
                      </ToggleButton>
                      <ToggleButton value='dark' padding='8px' disabled={colorTheme == 'dark'}>
                        <ColorSwatch fillColor={`rgba(${darkTheme.color.primary.surface},1)`} />
                      </ToggleButton>
                    </ToggleGroup>
                    <HorizontalDivider />
                    <ToggleGroup
                      type='single'
                      defaultValue={fontFace}
                      onValueChange={(value) => {
                        setFontFace(value as AppearanceContextInterface['fontFace'])
                      }}
                    >
                      <ToggleButton value='inter' disabled={fontFace == 'inter'}>
                        Inter
                      </ToggleButton>
                      <ToggleButton
                        value='novela'
                        fontName='Novela'
                        disabled={fontFace == 'novela'}
                      >
                        Novela
                      </ToggleButton>
                    </ToggleGroup>
                  </AppearanceToolbarStyled>
                </AppearanceToolbarWrapper>
              </FloatingFocusManager>
            </FloatingOverlay>
          )}
        </FloatingPortal>
      </FloatingNode>
    </FloatingTree>
  )
}

export { AppearanceToolbar }
