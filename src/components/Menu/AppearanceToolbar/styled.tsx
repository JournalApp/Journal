import React from 'react';
import * as Toolbar from '@radix-ui/react-toolbar';
import styled, { keyframes } from 'styled-components';
import { theme } from '@/themes';
import { breakpoints } from '@/utils';

const reveal = keyframes`
  0% {
    margin-bottom: -24px;
    opacity: 0;
  }
  100% {
    margin-bottom: 0px;
    opacity: 1;
  }
`;

interface ToggleButtonProps {
  padding?: string
  fontName?: string
}

const ToggleButtonStyled = styled(({ padding, fontName, ...props }) => (
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
  transition: opacity ${theme('animation.time.normal')};
  &:disabled {
    cursor: initial;
  }
  &:focus {
    outline: 0;
  }
  &:hover {
    transition: border ${theme('animation.time.normal')};
    border: 1px solid ${theme('color.popper.disabled')};
  }
  &[data-state='on'] {
    opacity: 1;
    border: 1px solid ${theme('color.popper.main')};
    border: 1px solid ${theme('color.popper.main')};
    color: ${theme('color.popper.main')};
  }
`;

const ToggleButtonSmallStyled = styled(({ ...props }) => (
  <Toolbar.ToggleItem {...props} />
))<ToggleButtonProps>`
  height: 22px;
  font-size: 14px;
  line-height: 14px;
  min-width: 22px;
  display: flex;
  padding: 0;
  align-items: center;
  justify-content: center;
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
`;

const AppearanceToolbarWrapperStyled = styled.div`
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  @media ${breakpoints.s} {
    transform: scale(0.9);
    bottom: 60px;
  }
  @media ${breakpoints.xs} {
    transform: scale(0.7);
    bottom: 40px;
  }
`;

const AppearanceToolbarStyled = styled(Toolbar.Root)`
  padding: 12px;
  border-radius: 100px;
  gap: 8px;
  display: flex;
  box-shadow: ${theme('style.shadow')};
  background-color: ${theme('color.popper.surface')};
  transition: 0;
  animation-name: ${reveal};
  animation-duration: ${theme('animation.time.normal')};
  animation-timing-function: ${theme('animation.timingFunction.dynamic')};
  animation-fill-mode: both;
  -webkit-app-region: no-drag;
`;
const ToggleGroupStyled = styled(Toolbar.ToggleGroup)`
  gap: 8px;
  display: flex;
`;

const ToggleGroupNestedStyled = styled.div`
  width: 22px;
  gap: 4px;
  display: flex;
  flex-direction: column;
`;

const ToggleFontAStyled = styled(ToggleButtonStyled)`
  font-size: 13px;
`;

const ToggleFontAAStyled = styled(ToggleButtonStyled)`
  font-size: 16px;
`;

const ToggleFontAAAStyled = styled(ToggleButtonStyled)`
  font-size: 22px;
`;
interface ColorSwatchProps {
  fillColor: string
}

const ColorSwatchStyled = styled.div<ColorSwatchProps>`
  height: 31px;
  width: 31px;
  border-radius: 100px;
  background-color: ${(props) => props.fillColor};
`;

const ColorSwatchSmallStyled = styled.div<ColorSwatchProps>`
  height: 14px;
  width: 14px;
  border-radius: 100px;
  background-color: ${(props) => props.fillColor};
`;

const HorizontalDividerStyled = styled(Toolbar.Separator)`
  background-color: ${theme('color.popper.border')};
  width: 1px;
  margin: 4px 8px;
`;

export {
  AppearanceToolbarWrapperStyled,
  AppearanceToolbarStyled,
  ToggleButtonStyled,
  ToggleButtonSmallStyled,
  ToggleGroupStyled,
  ToggleGroupNestedStyled,
  ToggleFontAStyled,
  ToggleFontAAStyled,
  ToggleFontAAAStyled,
  ColorSwatchStyled,
  ColorSwatchSmallStyled,
  HorizontalDividerStyled,
};
