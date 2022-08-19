import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { lightTheme, theme } from 'themes'
import styled, { keyframes } from 'styled-components'
import { ordinal, breakpoints, logger, arrayEquals } from 'utils'
import { Icon } from 'components'
import { matchSorter } from 'match-sorter'
import {
  useFloating,
  offset,
  flip,
  useListNavigation,
  useTypeahead,
  useInteractions,
  useRole,
  useClick,
  useDismiss,
  FloatingFocusManager,
  autoUpdate,
  size,
  FloatingOverlay,
  ContextData,
  useFocus,
} from '@floating-ui/react-dom-interactions'

interface EditModeProps {
  editMode: boolean
}

const Wrapper = styled.div<EditModeProps>`
  opacity: ${(props) => (props.editMode ? 1 : 0.8)};
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
  width: -webkit-fill-available;
  overflow-x: hidden;
  max-height: calc(8 * 36px);
  overflow-y: scroll;
`

const Divider = styled.div`
  background-color: ${theme('color.popper.border')};
  height: 1px;
  margin: 4px 12px;
`
type TagIsAddedProps = {
  current: boolean
}

const TagIsAdded = styled(({ current, ...props }) => (
  <Icon name='Check' {...props} />
))<TagIsAddedProps>`
  visibility: ${(props) => (props.current ? 'visible' : 'hidden')};
`

const TagTitle = styled.span<TagIsAddedProps>`
  font-size: 14px;
  color: ${theme('color.popper.main')};
  font-weight: ${(props) => (props.current ? '700' : 'normal')};
  flex-grow: 1;
  text-align: left;
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

const Tag = styled.div<EditModeProps>`
  white-space: nowrap;
  font-size: 14px;
  line-height: 24px;
  -webkit-app-region: no-drag;
  display: flex;
  width: fit-content;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px 8px;
  margin: 2px 0;
  gap: 4px;
  background-color: ${(props) =>
    props.editMode ? theme('color.pure') : theme('color.popper.inverted')};
  border-radius: 100px;
  animation-name: ${showTag};
  animation-duration: ${theme('animation.time.long')};
  animation-fill-mode: both;
`

interface TagColorDotProps {
  fillColor: string
}

const TagColorDot = styled.div<TagColorDotProps>`
  height: 6px;
  width: 6px;
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
  transition: opacity ${theme('animation.time.normal')};
  cursor: pointer;
  &:hover {
    opacity: 1;
  }
`

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
    { id: '789', name: 'Workout', color: 'yellow' },
  ])
  const [editMode, setEditMode] = useState(false)
  const [term, setTerm] = useState<string>('')
  const [tags, setTags] = useState<Tag[]>([])
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
  }, [tags])

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

  return (
    <Wrapper
      editMode={editMode}
      onClick={handleEnableEditMode}
      {...getReferencePropsTagWrapper({
        ref: tagWrapper.reference,
      })}
    >
      {tags.map((tag) => (
        <Tag key={tag.id} editMode={editMode}>
          <TagColorDot fillColor={theme(`color.tags.${tag.color}`)} />
          {tag.name}
          {editMode && <RemoveTagIcon onClick={(e: any) => handleRemoveTag(e, tag.id)} />}
        </Tag>
      ))}
      <TagsInputWrapper ref={positioningRef} editMode={editMode}>
        <PlusIcon name='Plus' />
        <TagsInput
          editMode={editMode}
          onChange={handleChange}
          tabIndex={-1}
          placeholder='Tag'
          {...getReferenceProps({
            ref: sel.reference,
            onFocus: () => {
              logger(`onFocus ${date}`)
            },
            onBlur() {
              clearInput()
              // setEditMode(false)
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
                <TagTitle current={!!tags.find((t) => t.id == tag.id)}>{tag.name}</TagTitle>
                <TagIsAdded current={!!tags.find((t) => t.id == tag.id)} />
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
                <TagTitle current={!!tags.find((t) => t.id == tag.id)}>{tag.name}</TagTitle>
                <TagIsAdded current={!!tags.find((t) => t.id == tag.id)} />
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
                <Tag editMode={false}>
                  <TagColorDot fillColor={theme(`color.tags.red`)} />
                  {sel.refs.reference.current.value}
                </Tag>
              </StyledItem>
              // >{`Create "${sel.refs.reference.current.value}"`}</StyledItem>
            )}
          </StyledPopover>
        </FloatingFocusManager>
      )}
    </Wrapper>
  )
}

export { EntryTags }
