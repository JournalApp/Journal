import React from 'react'
import { theme } from 'themes'
import { logger } from 'utils'
import {
  StyledItem,
  StyledTagColorDot,
  StyledTagListItemTitle,
  StyledTagListItemIsAdded,
} from './styled'
import { Tag } from './types'

type ListItemTagProps = {
  i: number
  date: string
  tag: Tag
  tags: Tag[]
  listRef: React.MutableRefObject<any[]>
  listIndexToId: React.MutableRefObject<any[]>
  activeIndex: number
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
  activeIndex,
  handleSelect,
  tagsInputRef,
  getItemProps,
}: ListItemTagProps) {
  return (
    <StyledItem
      key={`${date}-${tag.name}-${tag.id}`}
      id={`${date}-${tag.name}-${tag.id}`}
      ref={(node) => {
        listRef.current[i] = node
        listIndexToId.current[i] = tag.id
      }}
      isActive={activeIndex == i}
      isAnyActiveIndex={activeIndex != null}
      {...getItemProps({
        onMouseDown(e: any) {
          handleSelect(e, tag.id)
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
      <StyledTagListItemIsAdded current={!!tags.find((t) => t.id == tag.id)} />
    </StyledItem>
  )
}

export { ListItemTag }
