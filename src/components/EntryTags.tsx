import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { theme } from 'themes'
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

const TagsInputWrapper = styled.div`
  padding: 4px 0 8px 0;
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
`

interface StyledItemProps {
  isActive?: boolean
  isAnyActiveIndex?: boolean
}

const StyledItem = styled.div<StyledItemProps>`
  display: flex;
  border: 0;
  gap: 16px;
  padding: 8px 12px;
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

const TagsInput = styled.input`
  font-size: 14px;
  padding: 3px 3px 3px 20px;
  width: -webkit-fill-available;
  -webkit-app-region: no-drag;
  display: block;
  border-radius: 100px;
  border: 1px solid ${theme('color.secondary.surface')};
  background-color: ${theme('color.secondary.surface')};
  color: ${theme('color.primary.main')};
  outline: 0;
  opacity: 0.5;
  transition: ${theme('animation.time.normal')};
  &:focus,
  &:hover {
    opacity: 1;
  }
`

const Tag = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 2px 6px;
  gap: 4px;
  background-color: ${theme('color.pure')};
  border-radius: 100px;
`

const PlusIcon = styled((props) => <Icon {...props} />)`
  position: absolute;
  opacity: 0.3;
  margin-top: 5px;
  left: 4px;
  z-index: 1;
`

type Tag = {
  id: string
  name: string
  color: string
}

type EntryTagsProps = {
  date: string
}

function EntryTags({ date }: EntryTagsProps) {
  const allTags = [
    { id: '123', name: 'Vacation', color: 'red' },
    { id: '456', name: 'Work', color: 'green' },
    { id: '789', name: 'Workout', color: 'blue' },
  ]
  const [term, setTerm] = useState<string>('')
  const [tags, setTags] = useState<Tag[]>([])
  const results = useRef<Tag[]>([])
  const listRef = useRef([])
  const listIndexToId = useRef([])
  const positioningRef = useRef(null)
  const [open, setOpen] = useState(false)
  const sel = useFloating<HTMLElement>({
    placement: 'bottom-end',
    open,
    onOpenChange: setOpen,
    // whileElementsMounted: autoUpdate,
    middleware: [offset({ crossAxis: 0, mainAxis: 4 })],
  })
  const [controlledScrolling, setControlledScrolling] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, listRef.current.indexOf(term)))
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
      // focusItemOnHover: true,
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    logger('onChange')
    logger(event)
    setTerm(event.target.value)
    results.current = searchTag(event.target.value)
  }

  function searchTag(term: string) {
    let result = term.trim() === '' ? [] : matchSorter(allTags, term, { keys: ['name'] })
    logger(result)
    return result
  }

  const addTag = (tagId: string) => {
    logger(`adding tag ${tagId}`)
    setTags((prev: Tag[]) => {
      if (prev.find((el) => el.id == tagId)) {
        return prev.filter((el) => el.id != tagId)
      } else {
        return [...prev, allTags.find((t) => t.id == tagId)]
      }
    })
  }

  const handleSelect = (e: any, tagId: string) => {
    e.preventDefault()
    if (activeIndex !== null) {
      addTag(tagId)
      setSelectedIndex(activeIndex)
    }
  }

  return (
    <>
      {tags.map((tag) => (
        <Tag key={tag.id}>{tag.name}</Tag>
      ))}
      <TagsInputWrapper ref={positioningRef}>
        <PlusIcon name='Plus' />
        <TagsInput
          tabIndex={-1}
          placeholder='Tag'
          {...getReferenceProps({
            ref: sel.reference,
            onFocus: () => {
              logger(`onFocus ${date}`)
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
      {open && (
        <FloatingFocusManager context={sel.context} preventTabbing>
          <StyledPopover
            // tabIndex={-1}
            {...getFloatingProps({
              ref: sel.floating,
              style: {
                position: sel.strategy,
                top: sel.y ?? 0,
                left: sel.x ?? 0,
              },
            })}
          >
            {allTags.map((tag, i) => (
              <StyledItem
                // tabIndex={-1}
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
                {tag.name}
                {tags.find((t) => t.id == tag.id) ? '✔' : ''}
              </StyledItem>
            ))}
          </StyledPopover>
        </FloatingFocusManager>
      )}
    </>
  )
}

export { EntryTags }
