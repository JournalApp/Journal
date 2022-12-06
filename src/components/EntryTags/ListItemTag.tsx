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
import { useEntriesContext, useUserContext } from 'context'
import { ListItemTagColorPicker } from './ListItemTagColorPicker'
import { Tag, EntryTag, EntryTagProperty, ListItemType } from 'types'
import { ConfirmationModal } from 'components'

const StyledWrapper = styled.div``

type ListItemTagProps = {
  i: number
  date: string
  tag: Tag
  entryTags: EntryTag[]
  listRef: React.MutableRefObject<any[]>
  listIndexToItemType: React.MutableRefObject<ListItemType[]>
  tagEditingRef: React.MutableRefObject<HTMLDivElement>
  tagEditingInputRef: React.MutableRefObject<HTMLInputElement>
  activeIndex: number
  tagIndexEditing: number | null
  setTagIndexEditing: any
  colorPickerOpen: boolean
  setColorPickerOpen: any
  handleSelect: (e: any, item: ListItemType) => void
  tagsInputRef: React.MutableRefObject<HTMLInputElement>
  getItemProps: any
}

function ListItemTag({
  i,
  date,
  tag,
  entryTags,
  listRef,
  listIndexToItemType,
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
  const tagEditColorRef = useRef(tag.color)
  const { userTags, cacheAddOrUpdateTag, cacheUpdateTagProperty, rerenderEntriesWithTag } =
    useEntriesContext()
  const { serverTimeNow } = useUserContext()
  // const inputRef = useRef<HTMLInputElement>(null)

  // logger('ListItemTag rerender')

  const exitTagEditing = () => {
    tagEditColorRef.current = tag.color
    tagsInputRef.current.focus()
    setTagIndexEditing(null)
  }

  const updateTag = () => {
    const name = tagEditingInputRef.current.value
    if (!name) return
    const modified_at = serverTimeNow()
    const sync_status = 'pending_update'
    const color = tagEditColorRef.current
    exitTagEditing()
    cacheUpdateTagProperty({ name, modified_at, sync_status, color }, tag.id)
    const i = userTags.current.findIndex((t) => t.id == tag.id)
    userTags.current[i].name = name
    userTags.current[i].color = color
    rerenderEntriesWithTag(tag.id)
  }

  const deleteTag = () => {
    exitTagEditing()
    const modified_at = serverTimeNow()
    const sync_status = 'pending_delete'
    tag.sync_status = sync_status
    tag.modified_at = modified_at
    cacheUpdateTagProperty({ modified_at, sync_status }, tag.id)
    userTags.current = userTags.current.filter((t) => {
      return t.id != tag.id
    })
    rerenderEntriesWithTag(tag.id)
  }

  let isEditingOtherTag = tagIndexEditing != null && tagIndexEditing != i
  let isInTags = !!entryTags.find((t) => t.tag_id == tag.id)
  return (
    <>
      {tagIndexEditing == i && (
        <StyledWrapper ref={tagEditingRef} id={`${date}-${tag.name}-${tag.id}-editing`}>
          <StyledEditTagInput
            ref={tagEditingInputRef}
            defaultValue={tag.name}
            size={10}
            maxLength={80}
            onKeyDown={(e) => {
              if (e.key === 'Enter') updateTag()
            }}
          ></StyledEditTagInput>
          <ListItemTagColorPicker
            inputRef={tagEditingInputRef}
            colorPickerOpen={colorPickerOpen}
            setColorPickerOpen={setColorPickerOpen}
            tag={tag}
            tagEditColorRef={tagEditColorRef}
          />
          <StyledEditTagButtonsContainer>
            <ConfirmationModal
              action={deleteTag}
              titleText='Remove this tag permanently?'
              descriptionText='This tag will be removed from all entries.'
              confirmActionText='Remove'
              cancelActionText='Close'
            >
              <StyledTrashIcon />
            </ConfirmationModal>
            <StyledCancelIcon onClick={() => exitTagEditing()} />
            <StyledOKIcon onClick={() => updateTag()} />
          </StyledEditTagButtonsContainer>
        </StyledWrapper>
      )}
      <StyledItem
        id={`${date}-${tag.name}-${tag.id}`}
        ref={(node) => {
          listRef.current[i] = node
          listIndexToItemType.current[i] = { type: 'tag', value: tag }
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
              handleSelect(e, { type: 'tag', value: tag })
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
