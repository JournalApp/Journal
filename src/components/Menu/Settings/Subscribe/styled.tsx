import React, { useState, useEffect, useRef } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { Icon } from 'components'
import { CardElement } from '@stripe/react-stripe-js'

const IconCloseStyled = styled((props) => <Icon name='Cross' {...props} />)`
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0.8;
  cursor: pointer;
  &:hover {
    opacity: 1;
    color: ${theme('color.primary.main')};
  }
`

const IconChevronStyled = styled((props) => <Icon name='Chevron' {...props} />)`
  padding-right: 8px;
  opacity: 0.6;
`

const TextStyled = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
`

const ErrorStyled = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  color: ${theme('color.error.main')};
`

const CheckoutModalStyled = styled.div`
  background-color: ${theme('color.popper.surface')};
  display: flex;
  position: relative;
  padding: 0;
  padding: 40px 32px 32px 32px;
  margin: 48px 8px 8px 8px;
  border-radius: 8px;
  -webkit-app-region: no-drag;
`

const InputContainerStyled = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`

const ButtonStyled = styled.button`
  background-color: ${theme('color.popper.main')};
  color: ${theme('color.popper.inverted')};
  outline: 0;
  border: 0;
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  cursor: pointer;
  display: flex;
  margin-top: 16px;
  padding: 8px 12px;
  border-radius: 6px;
  width: fit-content;
  transition: box-shadow ${theme('animation.time.normal')} ease;
  &:hover,
  &:focus {
    box-shadow: 0 0 0 2px ${theme('color.popper.main', 0.15)};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`

interface getCustomStylesProps {
  borderRadius?: string
  hasError: boolean
}

const getCustomStyles = ({ borderRadius, hasError }: getCustomStylesProps) => {
  return {
    option: (provided: any, state: any) => ({
      ...provided,
      fontWeight: state.isSelected ? 'bold' : 'medium',
      fontSize: '14px',
      color: theme('color.popper.main'),
      backgroundColor: state.isFocused ? theme('color.popper.hover') : null,
      cursor: 'pointer',
      borderRadius: 8,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 12,
      paddingRight: 12,
      '&:active': {
        backgroundColor: theme('color.popper.hover'),
      },
    }),
    menuList: (provided: any) => ({ ...provided, padding: 4, boxShadow: theme('style.shadow') }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: theme('color.popper.pure'),
      borderRadius: 12,
      border: 0,
    }),
    control: (provided: any, state: any) => ({
      // none of react-select's styles are passed to <Control />
      ...provided,
      color: hasError ? theme('color.error.main') : theme('color.popper.main'),
      fontSize: '14px',
      display: 'flex',
      backgroundColor: state.isFocused
        ? theme('color.popper.pure', 0.9)
        : theme('color.popper.pure', 0.8),
      border: borderRadius
        ? 0
        : state.menuIsOpen
        ? `1px solid ${theme('color.popper.main')}`
        : `1px solid ${theme('color.popper.border')}`,
      boxShadow: borderRadius
        ? null
        : state.menuIsOpen
        ? `0 0 0 2px ${theme('color.popper.main', 0.1)}`
        : null,
      borderRadius: borderRadius || 8,
      padding: '2px 2px',
      transition: `all ${theme('animation.time.normal')}`,
      '&:hover': {
        cursor: 'pointer',
        boxShadow: borderRadius ? null : `0 0 0 2px ${theme('color.popper.main', 0.1)}`,
        backgroundColor: theme('color.popper.pure', 0.9),
      },
    }),
    placeholder: (provided: any, state: any) => ({
      ...provided,
      color: hasError ? theme('color.error.main') : theme('color.popper.main'),
      opacity: 0.6,
    }),
    input: (provided: any, state: any) => ({
      ...provided,
      color: theme('color.popper.main'),
      padding: 0,
    }),
    singleValue: (provided: any, state: any) => {
      const opacity = state.isDisabled ? 0.5 : 1
      const transition = 'opacity 300ms'
      const padding = 0
      const color = theme('color.popper.main')
      return { ...provided, opacity, transition, padding, color }
    },
  }
}

export {
  IconCloseStyled,
  IconChevronStyled,
  CheckoutModalStyled,
  InputContainerStyled,
  ButtonStyled,
  ErrorStyled,
  TextStyled,
  getCustomStyles,
}
