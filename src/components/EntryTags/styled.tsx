import React from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { Icon } from 'components'

interface EditModeProps {
  editMode: boolean
}

const StyledWrapper = styled.div<EditModeProps>`
  opacity: ${(props) => (props.editMode ? 1 : 0.8)};
  transition: opacity ${theme('animation.time.normal')};
  cursor: ${(props) => (props.editMode ? 'auto' : 'pointer')};
  &:hover {
    opacity: 1;
  }
`

const StyledTagsInputWrapper = styled.div<EditModeProps>`
  padding: 4px 0 8px 0;
  position: relative;
  width: ${(props) => (props.editMode ? '100%' : '16px')};
  transition: width ${theme('animation.time.veryFast')} ${theme('animation.timingFunction.dynamic')};
`

const showDropdown = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }`

const StyledPopover = styled.div`
  padding: 4px;
  border-radius: 12px;
  border: 0;
  box-shadow: ${theme('style.shadow')};
  background-color: ${theme('color.popper.surface')};
  animation-name: ${showDropdown};
  animation-duration: ${theme('animation.time.normal')};
  -webkit-app-region: no-drag;
  position: absolute;
  overflow-x: hidden;
  max-height: calc(8 * 36px);
  overflow-y: scroll;
  max-width: 400px;
  min-width: 150px;
`

const StyledEditTagColorPickerPopover = styled.div`
  padding: 8px;
  border-radius: 12px;
  border: 0;
  display: flex;
  flex-wrap: wrap;
  width: 50px;
  gap: 2px;
  box-shadow: ${theme('style.shadow')};
  background-color: ${theme('color.popper.surface')};
  animation-name: ${showDropdown};
  animation-duration: ${theme('animation.time.normal')};
  -webkit-app-region: no-drag;
  position: absolute;
`

const hide = keyframes`
  0% {
    opacity: 0.5;
  }
  100% {
    visibility: hidden;
    opacity: 0;
  }
`

const show = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    visibility: visible;
    opacity: 0.5;
  }
`

type ScrollIconProps = {
  isVisible: boolean
}

const StyledScrollDownIcon = styled(({ isVisible, ...rest }) => (
  <Icon name='Chevron' type='down' size={8} {...rest} />
))<ScrollIconProps>`
  cursor: pointer;
  position: sticky;
  margin-block-start: -8px;
  display: block;
  animation-name: ${(props) => (props.isVisible ? show : hide)};
  animation-duration: ${theme('animation.time.long')};
  animation-timing-function: cubic-bezier(0.17, 0.18, 0.41, 0.99);
  animation-fill-mode: both;
  bottom: 2px;
  visibility: hidden;
  opacity: 0;
  right: calc(50% - 4px);
  z-index: 1;
  &:hover {
    opacity: 0.8;
  }
`
const StyledScrollUpIcon = styled(({ isVisible, ...rest }) => (
  <Icon name='Chevron' size={8} type='up' {...rest} />
))<ScrollIconProps>`
  cursor: pointer;
  position: sticky;
  margin-block-end: -8px;
  display: block;
  animation-name: ${(props) => (props.isVisible ? show : hide)};
  animation-duration: ${theme('animation.time.long')};
  animation-timing-function: cubic-bezier(0.17, 0.18, 0.41, 0.99);
  animation-fill-mode: both;
  top: 2px;
  visibility: hidden;
  opacity: 0;
  right: calc(50% - 4px);
  z-index: 1;
  &:hover {
    opacity: 0.8;
  }
`

const StyledDivider = styled.div`
  background-color: ${theme('color.popper.border')};
  height: 1px;
  margin: 4px 12px;
`
type TagIsAddedProps = {
  current: boolean
}

const StyledTagListItemIsAdded = styled(({ current, ...props }) => (
  <Icon name='Check' {...props} />
))<TagIsAddedProps>`
  visibility: ${(props) => (props.current ? 'inherit' : 'hidden')};
`

const StyledEditTag = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  padding: 2px;
  margin: -2px;
  transition: opacity ${theme('animation.time.normal')};
  &:hover {
    opacity: 1 !important;
    background-color: ${theme('color.popper.border')};
  }
`

const StyledEditTagInput = styled.input`
  font-size: 14px;
  height: 26px;
  width: -webkit-fill-available;
  outline: 0;
  padding: 4px 80px 4px 40px;
  border-radius: 8px;
  border: 1px solid ${theme('color.popper.input')};
  background-color: ${theme('color.popper.surface')};
  color: ${theme('color.primary.main')};
  &:focus {
    box-shadow: 0 0 0 3px ${theme('color.popper.border')};
    transition: box-shadow ${theme('animation.time.normal')} ease;
  }
`

const StyledEditTagButtonsContainer = styled.div`
  display: inline-flex;
  position: absolute;
  margin-top: 6px;
  right: 8px;
  z-index: 1;
`

const StyledEditTagColorPickerContainer = styled.div`
  display: inline-flex;
  gap: 2px;
  position: absolute;
  height: 36px;
  left: 16px;
  z-index: 1;
  align-items: center;
`

const StyledColorPickerChevronIcon = styled((props) => (
  <Icon name='Chevron' size={16} {...props} />
))`
  opacity: 0.8;
  cursor: pointer;
  &:hover {
    opacity: 1;
    color: ${theme('color.primary.main')};
  }
`

const StyledOKIcon = styled((props) => <Icon name='Check' {...props} />)`
  opacity: 0.8;
  cursor: pointer;
  &:hover {
    opacity: 1;
    color: ${theme('color.primary.main')};
  }
`

const StyledCancelIcon = styled((props) => <Icon name='Cross' {...props} />)`
  opacity: 0.8;
  cursor: pointer;
  &:hover {
    opacity: 1;
    color: ${theme('color.primary.main')};
  }
`

const StyledTrashIcon = styled((props) => <Icon name='Trash' {...props} />)`
  opacity: 0.5;
  cursor: pointer;
  &:hover {
    opacity: 1;
    * {
      stroke: ${theme('color.error.main')};
    }
  }
`

const StyledTagListItemTitle = styled.span<TagIsAddedProps>`
  font-size: 14px;
  color: ${theme('color.popper.main')};
  font-weight: ${(props) => (props.current ? '700' : 'normal')};
  flex-grow: 1;
  text-align: left;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`

interface StyledItemProps {
  isActive?: boolean
  isAnyActiveIndex?: boolean
  isDisabled?: boolean
  isHidden?: boolean
  padding?: string
  borderRadius?: number
}

const StyledItem = styled.div<StyledItemProps>`
  white-space: nowrap;
  display: flex;
  font-size: 14px;
  border: 0;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 8px;
  cursor: pointer;
  background-color: ${(props) =>
    props.isActive ? theme('color.popper.hover') : theme('color.popper.surface')};
  align-items: center;
  ${(props) => (props.isDisabled ? 'pointer-events: none; opacity: 0.5;' : '')}
  ${(props) => (props.isHidden ? 'visibility: hidden; height: 0; padding: 0 12px;' : '')}
  &:hover {
    border: 0;
    outline: none;
    ${(props) =>
      props.isAnyActiveIndex ? '' : 'background-color:' + theme('color.popper.hover') + ';'};
    & #editButton {
      opacity: 0.5;
    }
  }
`

const StyledNoTags = styled.div`
  font-size: 14px;
  text-align: center;
  padding: 8px;
  font-style: italic;
  opacity: 0.8;
`

const StyledItemColorPicker = styled.div<StyledItemProps>`
  white-space: nowrap;
  border: ${(props) =>
    props.isActive ? `1px solid ${theme('color.popper.main')}` : `1px solid transparent`};
  padding: 3px;
  border-radius: 100px;
  cursor: pointer;
  transition: border ${theme('animation.time.normal')};
  &:hover {
    border: ${(props) =>
      props.isActive
        ? `1px solid ${theme('color.popper.main')}`
        : `1px solid ${theme('color.popper.input')}`};
    outline: none;
  }
`

const StyledTagsInput = styled.input<EditModeProps>`
  font-size: 14px;
  padding: 3px 3px 3px 20px;
  width: 100%;
  box-sizing: border-box;
  cursor: ${(props) => (props.editMode ? 'auto' : 'pointer')};
  -webkit-app-region: no-drag;
  display: block;
  border-radius: 100px;
  border: 0;
  background-color: ${(props) =>
    props.editMode ? theme('color.secondary.surface') : 'transparent'};
  color: ${theme('color.primary.main')};
  outline: 0;
  opacity: 0.5;
  transition: opacity ${theme('animation.time.fast')},
    background-color ${theme('animation.time.fast')};
  &:focus,
  &:hover {
    opacity: 1;
  }
  &::placeholder {
    color: ${theme('color.secondary.main', 0.6)};
  }
`

interface TagProps extends EditModeProps {
  maxWidth?: number
}

const StyledTag = styled.div<TagProps>`
  -webkit-app-region: no-drag;
  max-width: ${(props) => (props.maxWidth ? props.maxWidth + 'px' : '-webkit-fill-available')};
  display: flex;
  width: fit-content;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px 8px;
  gap: 4px;
  background-color: ${(props) => (props.editMode ? theme('color.pure') : theme('color.pure', 0.4))};
  border-radius: 100px;
`

const StyledTagHandle = styled.div`
  -webkit-app-region: no-drag;
  border: 0;
  outline: 0;
  margin-bottom: 2px;
`

const StyledTagTitle = styled.span`
  font-size: 14px;
  line-height: 24px;
  color: ${theme('color.primary.main')};
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`

interface TagColorDotProps {
  fillColor: string
  size?: number
}

const StyledTagColorDot = styled.div<TagColorDotProps>`
  height: ${(props) => (props.size ? `${props.size}px` : '6px')};
  width: ${(props) => (props.size ? `${props.size}px` : '6px')};
  min-width: ${(props) => (props.size ? `${props.size}px` : '6px')};
  border-radius: 100px;
  background-color: ${(props) => props.fillColor};
`

const StyledPlusIcon = styled((props) => <Icon {...props} />)`
  position: absolute;
  opacity: 0.3;
  margin-top: 5px;
  left: 4px;
  z-index: 1;
`

const StyledRemoveTagIcon = styled((props) => <Icon name='Cross' size={12} {...props} />)`
  opacity: 0.5;
  min-width: 12px;
  transition: opacity ${theme('animation.time.normal')};
  cursor: pointer;
  &:hover {
    opacity: 1;
  }
`

export {
  StyledWrapper,
  StyledTagsInputWrapper,
  StyledPopover,
  StyledDivider,
  StyledTagListItemIsAdded,
  StyledItem,
  StyledTagsInput,
  StyledTagListItemTitle,
  StyledTag,
  StyledTagHandle,
  StyledTagTitle,
  StyledTagColorDot,
  StyledPlusIcon,
  StyledRemoveTagIcon,
  StyledScrollDownIcon,
  StyledScrollUpIcon,
  StyledEditTag,
  StyledEditTagInput,
  StyledEditTagButtonsContainer,
  StyledEditTagColorPickerContainer,
  StyledColorPickerChevronIcon,
  StyledOKIcon,
  StyledCancelIcon,
  StyledTrashIcon,
  StyledEditTagColorPickerPopover,
  StyledItemColorPicker,
  StyledNoTags,
}
