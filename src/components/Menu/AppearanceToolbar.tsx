import React, { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Toolbar from '@radix-ui/react-toolbar'
import styled, { keyframes } from 'styled-components'
import { theme, lightTheme, darkTheme } from 'themes'
import { breakpoints, isDev, logger } from 'utils'
import { useAppearanceContext, AppearanceContextInterface } from 'context'

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

const AppearanceToolbarWrapper = styled(Dialog.Content)`
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

const AppearanceToolbarTrigger = styled(Dialog.Trigger)`
  background-color: transparent;
  color: inherit;
  padding: 0;
  outline: none;
  border: 0;
  width: 100%;
  &:focus,
  &:hover {
    outline: none;
  }
`

interface AppearanceToolbarProps {
  setOpenAppearanceToolbar: React.MutableRefObject<any>
}

const AppearanceToolbar = ({ setOpenAppearanceToolbar }: AppearanceToolbarProps) => {
  const [open, setOpen] = useState(false)

  const { fontSize, setFontSize, fontFace, setFontFace, colorTheme, setColorTheme } =
    useAppearanceContext()

  useEffect(() => {
    setOpenAppearanceToolbar.current = setOpen
  }, [])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <AppearanceToolbarWrapper>
          <AppearanceToolbarStyled>
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
              <ToggleButton value='novela' fontName='Novela' disabled={fontFace == 'novela'}>
                Novela
              </ToggleButton>
            </ToggleGroup>
          </AppearanceToolbarStyled>
        </AppearanceToolbarWrapper>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { AppearanceToolbar }
