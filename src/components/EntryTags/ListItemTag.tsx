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
  activeIndex: number
  tagIndexEditing: number | null
  setTagIndexEditing: any
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
  activeIndex,
  tagIndexEditing,
  setTagIndexEditing,
  handleSelect,
  tagsInputRef,
  getItemProps,
}: ListItemTagProps) {
  const editButtonRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // logger('ListItemTag rerender')

  let isDisabled = tagIndexEditing != null && tagIndexEditing != i
  return (
    <>
      {tagIndexEditing == i && (
        <StyledWrapper ref={tagEditingRef}>
          <input ref={inputRef} defaultValue={tag.name}></input>
        </StyledWrapper>
      )}
      <StyledItem
        id={`${date}-${tag.name}-${tag.id}`}
        ref={(node) => {
          listRef.current[i] = node
          listIndexToId.current[i] = tag.id
        }}
        isActive={activeIndex == i}
        isDisabled={isDisabled}
        isHidden={tagIndexEditing == i}
        isAnyActiveIndex={activeIndex != null}
        {...getItemProps({
          onMouseDown(e: any) {
            if (editButtonRef.current.contains(e.target)) {
              e.stopPropagation()
              e.preventDefault()
              setTagIndexEditing(i)
              setTimeout(() => {
                if (!!inputRef.current) {
                  inputRef.current.select()
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
        <StyledTagListItemTitle current={!!tags.find((t) => t.id == tag.id)}>
          {tag.name}
        </StyledTagListItemTitle>
        <StyledEditTag id='editButton' ref={editButtonRef}>
          <Icon name='Edit' />
        </StyledEditTag>
        {!isDisabled && <StyledTagListItemIsAdded current={!!tags.find((t) => t.id == tag.id)} />}
      </StyledItem>
    </>
  )
}

// function areEqual(prevProps: any, nextProps: any) {
//   logger(`Comparing memo`)
//   return true
// }

// export const ListItemTag = React.memo(ListItemTagInternal)
export { ListItemTag }
