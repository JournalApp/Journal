import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { theme } from 'themes'
import { logger } from 'utils'
import { Icon } from '../Icon'
import {
  StyledItem,
  StyledTagColorDot,
  StyledTagListItemTitle,
  StyledTagListItemIsAdded,
  StyledEditTag,
  StyledEditTagInput,
  StyledOKIcon,
  StyledEditTagButtonsContainer,
  StyledEditTagColorPickerContainer,
  StyledColorPickerChevronIcon,
  StyledCancelIcon,
  StyledTrashIcon,
} from './styled'
import {
  useFloating,
  offset,
  useListNavigation,
  useInteractions,
  useDismiss,
  FloatingFocusManager,
  useFocus,
  useFloatingNodeId,
  FloatingNode,
  FloatingPortal,
} from '@floating-ui/react-dom-interactions'
import { ListItemTagColorPicker } from './ListItemTagColorPicker'
import { Tag } from './types'

const StyledWrapper = styled.div``

type ListItemTagProps = {
  i: number
  date: string
  tag: Tag
  tags: Tag[]
  listRef: React.MutableRefObject<any[]>
  listIndexToId: React.MutableRefObject<any[]>
  tagEditingRef: React.MutableRefObject<HTMLDivElement>
  tagEditingInputRef: React.MutableRefObject<HTMLInputElement>
  activeIndex: number
  tagIndexEditing: number | null
  setTagIndexEditing: any
  colorPickerOpen: boolean
  setColorPickerOpen: any
  handleSelect: (e: any, tagId: string) => void
  tagsInputRef: React.MutableRefObject<HTMLInputElement>
  getItemProps: any
}

function ListItemTag({
  i,
  date,
  tag,
  tags,
  listRef,
  listIndexToId,
  tagEditingRef,
  tagEditingInputRef,
  activeIndex,
  tagIndexEditing,
  setTagIndexEditing,
  colorPickerOpen,
  setColorPickerOpen,
  handleSelect,
  tagsInputRef,
  getItemProps,
}: ListItemTagProps) {
  const editButtonRef = useRef<HTMLInputElement>(null)
  // const inputRef = useRef<HTMLInputElement>(null)

  // logger('ListItemTag rerender')

  const exitTagEditing = () => {
    tagsInputRef.current.focus()
    setTagIndexEditing(null)
  }

  const updateTag = () => {
    setTagIndexEditing(null)
  }

  const deleteTag = () => {
    setTagIndexEditing(null)
  }

  let isEditingOtherTag = tagIndexEditing != null && tagIndexEditing != i
  let isInTags = !!tags.find((t) => t.id == tag.id)
  return (
    <>
      {tagIndexEditing == i && (
        <StyledWrapper ref={tagEditingRef} id={`${date}-${tag.name}-${tag.id}-editing`}>
          <StyledEditTagInput
            ref={tagEditingInputRef}
            defaultValue={tag.name}
            size={10}
          ></StyledEditTagInput>
          <ListItemTagColorPicker
            inputRef={tagEditingInputRef}
            colorPickerOpen={colorPickerOpen}
            setColorPickerOpen={setColorPickerOpen}
            tag={tag}
          />
          <StyledEditTagButtonsContainer>
            <StyledTrashIcon />
            <StyledCancelIcon onClick={() => exitTagEditing()} />
            <StyledOKIcon onClick={() => updateTag()} />
          </StyledEditTagButtonsContainer>
        </StyledWrapper>
      )}
      <StyledItem
        id={`${date}-${tag.name}-${tag.id}`}
        ref={(node) => {
          listRef.current[i] = node
          listIndexToId.current[i] = tag.id
        }}
        isActive={activeIndex == i}
        isDisabled={isEditingOtherTag}
        isHidden={tagIndexEditing == i}
        isAnyActiveIndex={activeIndex != null}
        {...getItemProps({
          onMouseDown(e: any) {
            if (editButtonRef.current.contains(e.target)) {
              e.stopPropagation()
              e.preventDefault()
              setTagIndexEditing(i)
              setTimeout(() => {
                if (!!tagEditingInputRef.current) {
                  tagEditingInputRef.current.select()
                }
              }, 100)
              logger('onMouseDown StyledEditTag')
            } else {
              handleSelect(e, tag.id)
            }
          },
          onFocus() {
            logger('StyledItem sel.refs.reference.current.focus()')
            tagsInputRef.current.focus()
          },
          onKeyDown(e: any) {
            logger('onKeyDown StyledItem')
          },
        })}
      >
        <StyledTagColorDot fillColor={theme(`color.tags.${tag.color}`)} />
        <StyledTagListItemTitle current={isInTags}>{tag.name}</StyledTagListItemTitle>
        {activeIndex == i && !isEditingOtherTag && (
          <StyledEditTag id='editButton' ref={editButtonRef}>
            <Icon name='Edit' />
          </StyledEditTag>
        )}
        {(activeIndex != i || isEditingOtherTag) && (
          <StyledTagListItemIsAdded current={!isEditingOtherTag && isInTags} />
        )}
      </StyledItem>
    </>
  )
}

export { ListItemTag }
