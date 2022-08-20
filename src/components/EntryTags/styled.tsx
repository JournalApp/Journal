import React from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { Icon } from 'components'

interface EditModeProps {
  editMode: boolean
}

const Wrapper = styled.div<EditModeProps>`
  opacity: ${(props) => (props.editMode ? 1 : 0.85)};
  transition: opacity ${theme('animation.time.normal')};
  cursor: ${(props) => (props.editMode ? 'auto' : 'pointer')};
  &:hover {
    opacity: 1;
  }
`

const TagsInputWrapper = styled.div<EditModeProps>`
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
`

const Divider = styled.div`
  background-color: ${theme('color.popper.border')};
  height: 1px;
  margin: 4px 12px;
`
type TagIsAddedProps = {
  current: boolean
}

const TagListItemIsAdded = styled(({ current, ...props }) => (
  <Icon name='Check' {...props} />
))<TagIsAddedProps>`
  visibility: ${(props) => (props.current ? 'visible' : 'hidden')};
`

const TagListItemTitle = styled.span<TagIsAddedProps>`
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
  transition: ${theme('animation.time.normal')};
  &:hover {
    border: 0;
    outline: none;
    ${(props) =>
      props.isAnyActiveIndex ? '' : 'background-color:' + theme('color.popper.hover') + ';'};
  }
`

const TagsInput = styled.input<EditModeProps>`
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
`

const showTag = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

const hideTag = keyframes`
 0% {

  opacity: 1;
}
  100% {

    opacity: 0;
  }
`

interface TagProps extends EditModeProps {
  maxWidth?: number
}

const Tag = styled.div<TagProps>`
  -webkit-app-region: no-drag;
  max-width: ${(props) => (props.maxWidth ? props.maxWidth + 'px' : '-webkit-fill-available')};
  display: flex;
  width: fit-content;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px 8px;
  margin: 2px 0;
  gap: 4px;
  background-color: ${(props) => (props.editMode ? theme('color.pure') : theme('color.pure40'))};
  border-radius: 100px;
  animation-name: ${showTag};
  animation-duration: ${theme('animation.time.long')};
  animation-fill-mode: both;
`

const TagTitle = styled.span`
  font-size: 14px;
  line-height: 24px;
  color: ${theme('color.primary.main')};
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`

interface TagColorDotProps {
  fillColor: string
}

const TagColorDot = styled.div<TagColorDotProps>`
  height: 6px;
  width: 6px;
  min-width: 6px;
  border-radius: 100px;
  background-color: ${(props) => props.fillColor};
`

const PlusIcon = styled((props) => <Icon {...props} />)`
  position: absolute;
  opacity: 0.3;
  margin-top: 5px;
  left: 4px;
  z-index: 1;
`

const RemoveTagIcon = styled((props) => <Icon name='Cross' size={12} {...props} />)`
  opacity: 0.5;
  min-width: 12px;
  transition: opacity ${theme('animation.time.normal')};
  cursor: pointer;
  &:hover {
    opacity: 1;
  }
`

export {
  Wrapper,
  TagsInputWrapper,
  StyledPopover,
  Divider,
  TagListItemIsAdded,
  StyledItem,
  TagsInput,
  TagListItemTitle,
  Tag,
  TagTitle,
  TagColorDot,
  PlusIcon,
  RemoveTagIcon,
}
