import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { lightTheme, theme } from 'themes'
import { ordinal, breakpoints, logger, arrayEquals } from 'utils'
import { matchSorter } from 'match-sorter'
import {
  useFloating,
  offset,
  useListNavigation,
  useInteractions,
  useDismiss,
  FloatingFocusManager,
  useFocus,
} from '@floating-ui/react-dom-interactions'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import {
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
} from './styled'

type Tag = {
  id: string
  name: string
  color: keyof typeof lightTheme.color.tags
}

type EntryTagsProps = {
  date: string
}

function EntryTags({ date }: EntryTagsProps) {
  const allTags = useRef<Tag[]>([
    { id: '123', name: 'Vacation', color: 'pink' },
    { id: '456', name: 'Work', color: 'green' },
    { id: '789', name: '100daysofcodetoday', color: 'yellow' },
  ])
  const [editMode, setEditMode] = useState(false)
  const [term, setTerm] = useState<string>('')
  const [tags, setTags] = useState<Tag[]>([...allTags.current])
  const results = useRef<Tag[]>([])
  const listRef = useRef([])
  const listIndexToId = useRef([])
  const positioningRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, listRef.current.indexOf(term)))
  const tagWrapper = useFloating({
    open: editMode,
    onOpenChange: setEditMode,
  })
  const sel = useFloating<HTMLInputElement>({
    placement: 'bottom-end',
    open,
    onOpenChange: setOpen,
    middleware: [offset({ crossAxis: 0, mainAxis: 4 })],
  })
  const { getReferenceProps: getReferencePropsTagWrapper } = useInteractions([
    useDismiss(tagWrapper.context),
  ])
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    useFocus(sel.context, { keyboardOnly: false }),
    useDismiss(sel.context),
    useListNavigation(sel.context, {
      listRef,
      activeIndex,
      selectedIndex,
      onNavigate: setActiveIndex,
      loop: true,
      allowEscape: true,
      virtual: true,
      focusItemOnOpen: true,
    }),
  ])

  // logger('Rerender EntryTags')

  useEffect(() => {
    logger(`activeIndex: ${activeIndex}`)
  }, [activeIndex])

  useLayoutEffect(() => {
    if (open) {
      sel.update()
    }
  }, [tags, term])

  const clearInput = () => {
    sel.refs.reference.current.value = ''
    setTerm('')
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    logger('onChange')
    setTerm(event.target.value)
    setActiveIndex(0)
    results.current = searchTag(event.target.value)
  }

  function searchTag(term: string) {
    let result = term.trim() === '' ? [] : matchSorter(allTags.current, term, { keys: ['name'] })
    logger(result)
    return result
  }

  const addTag = (tagId: string) => {
    logger(`adding tag ${tagId}`)
    setTags((prev: Tag[]) => {
      if (prev.find((el) => el.id == tagId)) {
        return prev.filter((el) => el.id != tagId)
      } else {
        return [...prev, allTags.current.find((t) => t.id == tagId)]
      }
    })
  }

  const handleRemoveTag = (e: any, tagId: string) => {
    addTag(tagId)
  }

  const handleCreateTag = (e: any, name: string) => {
    // TODO create tag, generate color etc.
    e.preventDefault()
    let uuid = self.crypto.randomUUID()
    logger(`Create tag: ${name}`)
    logger(`uuid: ${uuid}`)
    allTags.current = [...allTags.current, { id: uuid, name, color: 'red' }]
    addTag(uuid)
    clearInput()
  }

  const handleSelect = (e: any, tagId: string) => {
    e.preventDefault()
    if (activeIndex !== null) {
      if (tagId == 'CREATE') {
        handleCreateTag(e, sel.refs.reference.current.value)
      } else {
        addTag(tagId)
      }
      setSelectedIndex(activeIndex)
    }
  }

  const handleEnableEditMode = () => {
    if (!tags.length) {
      setTimeout(() => sel.refs.reference.current.focus(), 100)
    }
    setEditMode(true)
  }

  const reorder = (list: Tag[], startIndex: any, endIndex: any) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
  }

  const onDragEnd = (result: any) => {
    // dropped outside the list
    if (!result.destination) {
      return
    }
    if (result.destination.index === result.source.index) {
      return
    }
    const reordered = reorder(tags, result.source.index, result.destination.index)
    setTags([...reordered])
  }

  const getItemStyle = (isDragging: any, draggableStyle: any) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',

    // change background colour if dragging
    // background: isDragging ? 'lightgreen' : 'grey',

    // styles we need to apply on draggables
    ...draggableStyle,
  })

  return (
    <Wrapper
      editMode={editMode}
      onClick={handleEnableEditMode}
      {...getReferencePropsTagWrapper({
        ref: tagWrapper.reference,
      })}
    >
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={`${date}-droppable`}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {tags.map((tag: Tag, i) => (
                <Draggable key={`${date}-${tag.id}`} draggableId={`${date}-${tag.id}`} index={i}>
                  {(provided) => (
                    <Tag
                      key={tag.id}
                      editMode={editMode}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      // style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                    >
                      <TagColorDot fillColor={theme(`color.tags.${tag.color}`)} />
                      <TagTitle>{tag.name}</TagTitle>
                      {editMode && (
                        <RemoveTagIcon onClick={(e: any) => handleRemoveTag(e, tag.id)} />
                      )}
                    </Tag>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <TagsInputWrapper ref={positioningRef} editMode={editMode}>
        <PlusIcon name='Plus' />
        <TagsInput
          editMode={editMode}
          onChange={handleChange}
          tabIndex={-1}
          maxLength={50}
          placeholder='Tag'
          {...getReferenceProps({
            ref: sel.reference,
            onFocus: () => {
              logger(`onFocus ${date}`)
            },
            onBlur() {
              clearInput()
            },
            onKeyDown(e) {
              logger('onKeyDown')
              if (e.key === 'Enter') {
                logger('Enter')
                let id = listIndexToId.current[activeIndex]
                handleSelect(e, id)
              }
            },
          })}
        ></TagsInput>
      </TagsInputWrapper>
      {open && !term && (
        <FloatingFocusManager context={sel.context} preventTabbing>
          <StyledPopover
            {...getFloatingProps({
              ref: sel.floating,
              style: {
                position: sel.strategy,
                top: sel.y ?? 0,
                left: sel.x ?? 0,
              },
            })}
          >
            {allTags.current.map((tag, i) => (
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
                  onMouseDown(e) {
                    handleSelect(e, tag.id)
                  },
                  onFocus() {
                    logger('StyledItem sel.refs.reference.current.focus()')
                    sel.refs.reference.current.focus()
                  },
                  onKeyDown(e) {
                    logger('onKeyDown StyledItem')
                  },
                })}
              >
                <TagColorDot fillColor={theme(`color.tags.${tag.color}`)} />
                <TagListItemTitle current={!!tags.find((t) => t.id == tag.id)}>
                  {tag.name}
                </TagListItemTitle>
                <TagListItemIsAdded current={!!tags.find((t) => t.id == tag.id)} />
              </StyledItem>
            ))}
          </StyledPopover>
        </FloatingFocusManager>
      )}
      {open && term && (
        <FloatingFocusManager context={sel.context} preventTabbing>
          <StyledPopover
            {...getFloatingProps({
              ref: sel.floating,
              style: {
                position: sel.strategy,
                top: sel.y ?? 0,
                left: sel.x ?? 0,
              },
            })}
          >
            {results.current.map((tag, i) => (
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
                  onMouseDown(e) {
                    handleSelect(e, tag.id)
                  },
                  onFocus() {
                    logger('StyledItem sel.refs.reference.current.focus()')
                    sel.refs.reference.current.focus()
                  },
                  onKeyDown(e) {
                    logger('onKeyDown StyledItem')
                  },
                })}
              >
                <TagColorDot fillColor={theme(`color.tags.${tag.color}`)} />
                <TagListItemTitle current={!!tags.find((t) => t.id == tag.id)}>
                  {tag.name}
                </TagListItemTitle>
                <TagListItemIsAdded current={!!tags.find((t) => t.id == tag.id)} />
              </StyledItem>
            ))}
            {!!results.current.length &&
              !results.current.some((t) => t.name == sel.refs.reference.current.value) && (
                <Divider />
              )}
            {!results.current.some((t) => t.name == sel.refs.reference.current.value) && (
              <StyledItem
                ref={(node) => {
                  listRef.current[results.current.length] = node
                  listIndexToId.current[results.current.length] = 'CREATE'
                }}
                isActive={activeIndex == results.current.length}
                isAnyActiveIndex={activeIndex != null}
                {...getItemProps({
                  onMouseDown(e) {
                    handleCreateTag(e, sel.refs.reference.current.value)
                  },
                  onFocus() {
                    logger('StyledItem sel.refs.reference.current.focus()')
                    sel.refs.reference.current.focus()
                  },
                  onKeyDown(e) {
                    logger('onKeyDown Create tag')
                  },
                })}
              >
                Create{' '}
                <Tag editMode={false} maxWidth={200}>
                  <TagColorDot fillColor={theme(`color.tags.red`)} />
                  <TagTitle>{sel.refs.reference.current.value}</TagTitle>
                </Tag>
              </StyledItem>
            )}
          </StyledPopover>
        </FloatingFocusManager>
      )}
    </Wrapper>
  )
}

export { EntryTags }
