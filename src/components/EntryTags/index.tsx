import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { lightTheme, theme } from 'themes'
import { useEntriesContext, useUserContext } from 'context'
import { supabase, ordinal, breakpoints, logger, arrayEquals } from 'utils'
import { matchSorter } from 'match-sorter'
import {
  useFloating,
  offset,
  FloatingTree,
  useListNavigation,
  useInteractions,
  useDismiss,
  FloatingFocusManager,
  useFocus,
  useFloatingNodeId,
  FloatingNode,
  FloatingPortal,
} from '@floating-ui/react-dom-interactions'
import { DragDropContext, Droppable, Draggable, resetServerContext } from 'react-beautiful-dnd'
import {
  StyledWrapper,
  StyledTagsInputWrapper,
  StyledPopover,
  StyledDivider,
  StyledItem,
  StyledTagsInput,
  StyledTag,
  StyledTagHandle,
  StyledTagTitle,
  StyledTagColorDot,
  StyledPlusIcon,
  StyledRemoveTagIcon,
  StyledScrollDownIcon,
  StyledScrollUpIcon,
} from './styled'
import { ListItemTag } from './ListItemTag'
import { Tag, EntryTag } from './types'

type EntryTagsProps = {
  date: string
  invokeEntriesTagsInitialFetch: React.MutableRefObject<any>
}

function EntryTags({ date, invokeEntriesTagsInitialFetch }: EntryTagsProps) {
  // const allTags = useRef<Tag[]>([
  //   { id: '123', name: 'Vacation', color: 'pink' },
  //   { id: '456', name: 'Work', color: 'green' },
  //   { id: '789', name: '100daysofcodetoday', color: 'yellow' },
  //   { id: 'qwe', name: 'Health', color: 'pink' },
  //   { id: 'rty', name: 'School', color: 'lime' },
  //   { id: 'uio', name: 'Summer', color: 'brown' },
  //   { id: 'asd', name: 'Electronics', color: 'pink' },
  //   { id: 'fgh', name: 'Books', color: 'yellow' },
  //   { id: 'ghj', name: 'Family time', color: 'violet' },
  //   { id: 'fgh1', name: 'Books1', color: 'yellow' },
  //   { id: 'fgh2', name: 'Books2', color: 'green' },
  //   { id: 'fgh3', name: 'Books3', color: 'yellow' },
  //   { id: 'fgh4', name: 'Books4', color: 'navy' },
  //   { id: 'fgh5', name: 'Books5', color: 'navy' },
  // ])
  const { userTags, cacheAddOrUpdateTag, cacheAddOrUpdateEntryTag } = useEntriesContext()
  const [editMode, setEditMode] = useState(false) // 1. edit mode
  const [tagIndexEditing, setTagIndexEditing] = useState<number | null>(null) // 3. Tag editing
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [term, setTerm] = useState<string>('')
  const [tags, setTags] = useState<Tag[]>([
    // userTags.current[0],
    // userTags.current[1],
    // userTags.current[2],
  ])
  const [results, setResults] = useState<Tag[]>([])
  const listRef = useRef([])
  const listIndexToId = useRef([])
  const positioningRef = useRef(null)
  const tagWrapperRef = useRef<HTMLDivElement>(null)
  const tagEditingRef = useRef<HTMLDivElement>(null)
  const tagEditingInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false) // 2. popver
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, listRef.current.indexOf(term)))
  const [popoverScrollDownArrow, setPopoverScrollDownArrow] = useState(false)
  const [popoverScrollUpArrow, setPopoverScrollUpArrow] = useState(false)
  const { session, signOut, getSecretKey, serverTimeNow } = useUserContext()

  const initialFetchEntryTags = async (entryModifiedAt: string) => {
    logger(`initialFetchEntryTags ${entryModifiedAt}`)
    // TODO
    // compare witch cached Tags
    // ferch from supabase if needed + update cache
  }

  const sel = useFloating<HTMLInputElement>({
    placement: 'bottom-end',
    open,
    onOpenChange: setOpen,
    middleware: [offset({ crossAxis: 0, mainAxis: 4 })],
  })

  useEffect(() => {
    invokeEntriesTagsInitialFetch.current[date] = initialFetchEntryTags
  }, [])

  useEffect(() => {
    logger(`activeIndex: ${activeIndex}`)
  }, [activeIndex])

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    // useFocus(sel.context, { keyboardOnly: false }),
    // useDismiss(sel.context, { escapeKey: false }),
    useListNavigation(sel.context, {
      listRef,
      activeIndex,
      selectedIndex,
      onNavigate: setActiveIndex,
      loop: true,
      allowEscape: false,
      openOnArrowKeyDown: true,
      virtual: true,
      focusItemOnOpen: true,
    }),
  ])

  // logger('Rerender EntryTags')

  useLayoutEffect(() => {
    if (open) {
      sel.update()
    }
  }, [tags, term, tagIndexEditing])

  useEffect(() => {
    if (open) {
      const { clientHeight, scrollHeight } = sel.refs.floating.current
      if (scrollHeight > clientHeight) {
        setPopoverScrollDownArrow(true)
      }
    }
  }, [open])

  useEffect(() => {
    logger(`${editMode ? '✔' : '-'} Edit mode`)
    logger(`${open ? '✔' : '-'} Popover`)
    logger(`${tagIndexEditing != null ? '✔' : '-'} Tag edit`)
  }, [open, editMode, tagIndexEditing])

  // useEffect(() => {
  //   if(tagIndexEditing == null)
  // }, [tagIndexEditing])

  const clearInput = () => {
    sel.refs.reference.current.value = ''
    setTerm('')
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    logger('onChange')
    setTerm(event.target.value)
    setActiveIndex(0)
    setResults([...searchTag(event.target.value)])
  }

  function searchTag(term: string) {
    let result = term.trim() === '' ? [] : matchSorter(userTags.current, term, { keys: ['name'] })
    logger(result)
    return result
  }

  const addTag = (tagId: string) => {
    setTags((prev: Tag[]) => {
      if (prev.find((el) => el.id == tagId)) {
        logger(`- removing tag ${tagId}`)
        return prev.filter((el) => el.id != tagId)
      } else {
        logger(`+ adding tag ${tagId}`)
        return [...prev, userTags.current.find((t) => t.id == tagId)]
      }
    })
  }

  const handleRemoveTag = (e: any, tagId: string) => {
    addTag(tagId)
  }

  const handleCreateTag = async (e: any, name: string) => {
    // TODO generate color etc.
    e.preventDefault()

    // 1. Create tag
    let uuid = self.crypto.randomUUID()
    logger(`Create tag: ${name} (${uuid})`)
    const timeNow = serverTimeNow()
    const tagToCreate: Tag = {
      user_id: session.user.id,
      id: uuid,
      name,
      color: 'red',
      created_at: timeNow,
      modified_at: timeNow,
      revision: 0,
    }

    const entryTagToCreate: EntryTag = {
      user_id: session.user.id,
      day: date,
      tag_id: uuid,
      order_no: tags.length,
      created_at: timeNow,
      modified_at: timeNow,
      revision: 0,
    }
    // Cache: save
    await cacheAddOrUpdateTag(tagToCreate)

    // Local state: fetch all tags
    userTags.current = [...userTags.current, { id: uuid, name, color: 'red' }]

    // Supabase: save
    // TODO check what is returned
    const { error } = await supabase.from<Tag>('tags').upsert(tagToCreate).single()

    // // TODO Make separate function for 2.
    // 2. Add tag to this entry
    // Cache: save
    await cacheAddOrUpdateEntryTag(entryTagToCreate)

    // Save in local state
    addTag(uuid)

    // Supabase: save
    // TODO check what is returned
    const { error: err2 } = await supabase
      .from<EntryTag>('entries_tags')
      .upsert(entryTagToCreate)
      .single()

    // Add to search results
    setResults([...searchTag(name)])
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
    logger('onClick StyledWrapper')
    if (!editMode) {
      if (!tags.length) {
        setTimeout(() => sel.refs.reference.current.focus(), 100)
      }
      setEditMode(true)
    }
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

  const handleOnScroll = (event: any) => {
    const { scrollTop, clientHeight, scrollHeight } = event.target
    if (scrollHeight > clientHeight) {
      if (scrollTop + clientHeight < scrollHeight) {
        setPopoverScrollDownArrow(true)
      } else {
        setPopoverScrollDownArrow(false)
      }
      if (scrollTop > 0) {
        setPopoverScrollUpArrow(true)
      } else {
        setPopoverScrollUpArrow(false)
      }
    }
  }

  const handleScroll = (e: any, dir: string) => {
    e.preventDefault()
    sel.refs.floating.current.scrollBy({
      top: dir == 'up' ? -36 : 36,
      left: 0,
      behavior: 'smooth',
    })
  }

  const EditMode = ({ children }: any) => {
    // logger('EditMode rerender')
    const handleCloseEsc = (e: any) => {
      logger('🚪 ESC')
      logger(`${editMode ? '✔' : '-'} Edit mode`)
      logger(`${open ? '✔' : '-'} Popover`)
      logger(`${tagIndexEditing != null ? '✔' : '-'} Tag edit`)
      if (e.key == 'Escape') {
        if (colorPickerOpen) {
          if (!!tagEditingInputRef.current) {
            tagEditingInputRef.current.focus()
          }
          setColorPickerOpen(false)
          return
        }
        if (tagIndexEditing != null) {
          logger('close Tag editing')
          sel.refs.reference.current.focus()
          setTagIndexEditing(null)
          return
        }
        if (open) {
          logger('close popover')
          setOpen(false)
          return
        }
        if (editMode) {
          logger('close editMode')
          setEditMode(false)
          clearInput()
          return
        }
      }
    }

    const handleCloseMouse = (e: any) => {
      logger('🖱 Mouse')
      logger(`${editMode ? '✔' : '-'} Edit mode`)
      logger(`${open ? '✔' : '-'} Popover`)
      logger(`${tagIndexEditing != null ? '✔' : '-'} Tag edit`)

      if (!tagWrapperRef.current.contains(e.target)) {
        logger('🖱 click outside tagWrapper')
        logger(e.target)
        setColorPickerOpen(false)
        setTagIndexEditing(null)
        setOpen(false)
        setEditMode(false)
        clearInput()
        return
      }

      if (!!sel.refs.floating.current && !sel.refs.floating.current.contains(e.target)) {
        logger('🖱 click outside popover')
        setColorPickerOpen(false)
        setTagIndexEditing(null)
        setOpen(false)
        return
      }

      if (
        !!tagEditingRef.current &&
        !tagEditingRef.current.contains(e.target) &&
        tagIndexEditing != null
      ) {
        logger('🖱 click outside tagEditingRef')
        setColorPickerOpen(false)
        setTagIndexEditing(null)
        setTimeout(() => {
          sel.refs.reference.current.focus()
        }, 100)
        return
      }

      if (
        !!tagEditingRef.current &&
        tagEditingRef.current.contains(e.target) &&
        tagIndexEditing != null &&
        colorPickerOpen
      ) {
        logger('🖱 click inside tagEditingRef while colorPickerOpen')
        if (!!tagEditingInputRef.current) {
          tagEditingInputRef.current.focus()
        }
        setColorPickerOpen(false)
        return
      }
    }

    useEffect(() => {
      // logger('✅ addEventListener')
      document.addEventListener('keydown', handleCloseEsc)
      document.addEventListener('mousedown', handleCloseMouse)

      return () => {
        // logger('❌ removeEventListener')
        document.removeEventListener('keydown', handleCloseEsc)
        document.removeEventListener('mousedown', handleCloseMouse)
      }
    }, [])

    return <>{children}</>
  }

  return (
    <StyledWrapper editMode={editMode} onClick={handleEnableEditMode} ref={tagWrapperRef}>
      {editMode && (
        <EditMode>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={`${date}-droppable`}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {tags.map((tag: Tag, i) => (
                    <Draggable
                      key={`${date}-${tag.id}`}
                      draggableId={`${date}-${tag.id}`}
                      index={i}
                    >
                      {(provided) => (
                        <StyledTagHandle
                          key={tag.id}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <StyledTag editMode={editMode}>
                            <StyledTagColorDot fillColor={theme(`color.tags.${tag.color}`)} />
                            <StyledTagTitle>{tag.name}</StyledTagTitle>
                            {editMode && (
                              <StyledRemoveTagIcon
                                onMouseUp={(e: any) => handleRemoveTag(e, tag.id)}
                              />
                            )}
                          </StyledTag>
                        </StyledTagHandle>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </EditMode>
      )}
      {!editMode &&
        tags.map((tag: Tag) => (
          <StyledTagHandle key={`${date}-${tag.id}`}>
            <StyledTag editMode={editMode}>
              <StyledTagColorDot fillColor={theme(`color.tags.${tag.color}`)} />
              <StyledTagTitle>{tag.name}</StyledTagTitle>
            </StyledTag>
          </StyledTagHandle>
        ))}
      <StyledTagsInputWrapper ref={positioningRef} editMode={editMode}>
        <StyledPlusIcon name='Plus' />
        <StyledTagsInput
          editMode={editMode}
          onChange={handleChange}
          tabIndex={-1}
          maxLength={50}
          placeholder='Tag'
          {...getReferenceProps({
            ref: sel.reference,
            onFocus: () => {
              if (editMode) {
                setOpen(true)
              }
              logger(`onFocus StyledTagsInput`)
              logger(`editMode = ${editMode}`)
            },
            onBlur() {
              logger(`onBlur StyledTagsInput`)
            },
            onClick() {
              if (editMode) {
                setOpen(true)
              }
            },
            // onBlur() {
            //   clearInput()
            // },
            onKeyDown(e) {
              logger('onKeyDown')
              if (e.key === 'Enter') {
                logger('Enter')
                let id = listIndexToId.current[activeIndex]
                handleSelect(e, id)
              }
            },
          })}
        ></StyledTagsInput>
      </StyledTagsInputWrapper>
      {open && !term && (
        <FloatingFocusManager context={sel.context} preventTabbing>
          <StyledPopover
            onScroll={handleOnScroll}
            // onFocus={() => sel.refs.reference.current.focus()}
            {...getFloatingProps({
              ref: sel.floating,
              style: {
                position: sel.strategy,
                top: sel.y ?? 0,
                left: sel.x ?? 0,
              },
            })}
          >
            <StyledScrollUpIcon
              isVisible={popoverScrollUpArrow}
              onMouseDown={(e: any) => handleScroll(e, 'up')}
            />
            {userTags.current.map((tag, i) => (
              <ListItemTag
                key={`${date}-${tag.name}-${tag.id}`}
                i={i}
                date={date}
                tag={tag}
                tags={tags}
                listRef={listRef}
                listIndexToId={listIndexToId}
                tagEditingRef={tagEditingRef}
                tagEditingInputRef={tagEditingInputRef}
                activeIndex={activeIndex}
                tagIndexEditing={tagIndexEditing}
                setTagIndexEditing={setTagIndexEditing}
                colorPickerOpen={colorPickerOpen}
                setColorPickerOpen={setColorPickerOpen}
                handleSelect={handleSelect}
                tagsInputRef={sel.refs.reference}
                getItemProps={getItemProps}
              />
            ))}
            <StyledScrollDownIcon
              isVisible={popoverScrollDownArrow}
              onMouseDown={(e: any) => handleScroll(e, 'down')}
            />
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
            {results.slice(0, 5).map((tag, i) => (
              <ListItemTag
                key={`${date}-${tag.name}-${tag.id}`}
                i={i}
                date={date}
                tag={tag}
                tags={tags}
                listRef={listRef}
                listIndexToId={listIndexToId}
                tagEditingRef={tagEditingRef}
                tagEditingInputRef={tagEditingInputRef}
                activeIndex={activeIndex}
                tagIndexEditing={tagIndexEditing}
                setTagIndexEditing={setTagIndexEditing}
                colorPickerOpen={colorPickerOpen}
                setColorPickerOpen={setColorPickerOpen}
                handleSelect={handleSelect}
                tagsInputRef={sel.refs.reference}
                getItemProps={getItemProps}
              />
            ))}
            {!!results.length &&
              !results.some((t) => t.name == sel.refs.reference.current.value) && <StyledDivider />}
            {!results.some((t) => t.name == sel.refs.reference.current.value) && (
              <StyledItem
                ref={(node) => {
                  listRef.current[results.length] = node
                  listIndexToId.current[results.length] = 'CREATE'
                }}
                id={`${date}-CREATE`}
                isActive={activeIndex == results.length}
                isAnyActiveIndex={activeIndex != null}
                {...getItemProps({
                  onMouseDown(e) {
                    e.stopPropagation()
                    sel.refs.reference.current.focus()
                    setTagIndexEditing(null)
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
                <StyledTag editMode={false} maxWidth={200}>
                  <StyledTagColorDot fillColor={theme(`color.tags.red`)} />
                  <StyledTagTitle>{sel.refs.reference.current.value}</StyledTagTitle>
                </StyledTag>
              </StyledItem>
            )}
          </StyledPopover>
        </FloatingFocusManager>
      )}
    </StyledWrapper>
  )
}

export { EntryTags }
