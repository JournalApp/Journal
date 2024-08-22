import React, { MouseEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { lightTheme, theme } from '@/themes';
import { useEntriesContext, useUserContext } from '@/context';
import { logger, randomInt } from '@/utils';
import { matchSorter } from 'match-sorter';
import {
  useFloating,
  offset,
  useListNavigation,
  useInteractions,
  FloatingFocusManager,
} from '@floating-ui/react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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
  StyledNoTags,
} from './styled';
import { ListItemTag } from './ListItemTag';
import { Tag, EntryTag, ListItemType } from '@/types';

type EntryTagsProps = {
  date: string;
};

function EntryTags({ date }: EntryTagsProps) {
  const {
    userTags,
    userEntryTags,
    cacheAddOrUpdateTag,
    cacheAddOrUpdateEntryTag,
    cacheUpdateEntryTagProperty,
    cacheAddEntryIfNotExists,
    invokeRerenderEntryTags,
  } = useEntriesContext();
  const [editMode, setEditMode] = useState(false); // 1. edit mode
  const [tagIndexEditing, setTagIndexEditing] = useState<number | null>(null); // 3. Tag editing
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [term, setTerm] = useState<string>('');
  const [entryTags, setEntryTags] = useState<EntryTag[]>(
    userEntryTags.current.filter((t) => t.day == date).sort((a, b) => a.order_no - b.order_no),
  );
  const [results, setResults] = useState<Tag[]>([]);
  const listRef = useRef([]);
  const listIndexToItemType = useRef<ListItemType[]>([]);
  const positioningRef = useRef(null);
  const tagWrapperRef = useRef<HTMLDivElement>(null);
  const tagEditingRef = useRef<HTMLDivElement>(null);
  const tagEditingInputRef = useRef<HTMLInputElement>(null);
  const newTagColor = useRef<keyof (typeof lightTheme)['color']['tags']>('red');
  const [open, setOpen] = useState(false); // 2. popver
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, listRef.current.indexOf(term)));
  const [popoverScrollDownArrow, setPopoverScrollDownArrow] = useState(false);
  const [popoverScrollUpArrow, setPopoverScrollUpArrow] = useState(false);
  const { session, serverTimeNow } = useUserContext();

  const rerenderTags = async () => {
    logger(`rerenderTags`);
    setEntryTags(
      userEntryTags.current
        .filter((t) => t.day == date && userTags.current.some((ut) => ut.id == t.tag_id))
        .sort((a, b) => a.order_no - b.order_no),
    );
    if (open && term) {
      setResults([...searchTag(term)]);
    }
  };

  const sel = useFloating<HTMLInputElement>({
    placement: 'bottom-end',
    open,
    onOpenChange: setOpen,
    middleware: [offset({ crossAxis: 0, mainAxis: 4 })],
  });

  const inputElement = sel.refs.reference.current as HTMLInputElement;

  const generateRandomTagColor = () => {
    const keys = Object.keys(lightTheme.color.tags);
    newTagColor.current = keys[
      randomInt(keys.length)
    ] as keyof (typeof lightTheme)['color']['tags'];
    logger(`New random color ${newTagColor.current}`);
  };

  useEffect(() => {
    invokeRerenderEntryTags.current[date] = rerenderTags;
  }, []);

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
  ]);

  // logger('Rerender EntryTags')

  useLayoutEffect(() => {
    if (open) {
      sel.update();
    }
  }, [entryTags, term, tagIndexEditing]);

  useEffect(() => {
    if (open) {
      const { clientHeight, scrollHeight } = sel.refs.floating.current;
      if (scrollHeight > clientHeight) {
        setPopoverScrollDownArrow(true);
      }
      generateRandomTagColor();
    }
  }, [open]);

  useEffect(() => {
    // logger(`${editMode ? '✔' : '-'} Edit mode`)
    // logger(`${open ? '✔' : '-'} Popover`)
    // logger(`${tagIndexEditing != null ? '✔' : '-'} Tag edit`)
  }, [open, editMode, tagIndexEditing]);

  // useEffect(() => {
  //   if(tagIndexEditing == null)
  // }, [tagIndexEditing])

  const clearInput = () => {
    inputElement.value = '';
    setTerm('');
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    logger('onChange');
    setTerm(event.target.value);
    setActiveIndex(0);
    setResults([...searchTag(event.target.value)]);
  };

  function searchTag(term: string) {
    const result =
      term.trim() === '' ? [] : matchSorter(userTags.current, term, { keys: ['name'] });
    logger(result);
    return result;
  }

  const addEntryTag = (entryTag: EntryTag) => {
    setEntryTags((prev: EntryTag[]) => {
      if (!prev.find((el) => el.tag_id == entryTag.tag_id)) {
        logger(`+ adding tag ${entryTag.tag_id}`);
        // Add to userEntryTags.current
        userEntryTags.current.push(entryTag);
        // Add to SQLite
        cacheAddOrUpdateEntryTag(entryTag);
        return [...prev, entryTag];
      }
    });
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'tag add',
    });
  };

  const removeEntryTag = (entryTagTagId: string) => {
    setEntryTags((prev: EntryTag[]) => {
      if (prev.find((el) => el.tag_id == entryTagTagId)) {
        logger(`- removing tag ${entryTagTagId}`);
        // Remove from userEntryTags.current
        const i = userEntryTags.current.findIndex(
          (t) => t.tag_id == entryTagTagId && t.day == date && t.user_id == session.user.id,
        );
        userEntryTags.current.splice(i, 1);
        // Remove SQLite
        cacheUpdateEntryTagProperty(
          { sync_status: 'pending_delete' },
          session.user.id,
          date,
          entryTagTagId,
        );
        return prev.filter((el) => el.tag_id != entryTagTagId);
      }
    });
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'tag remove',
    });
  };

  const handleCreateAndAddTag = async (e: any, name: string) => {
    e.preventDefault();

    // 1. Create tag
    const uuid = self.crypto.randomUUID();
    logger(`Create tag: ${name} (${uuid})`);
    const timeNow = serverTimeNow();
    const tagToInsert: Tag = {
      user_id: session.user.id,
      id: uuid,
      name,
      color: newTagColor.current,
      created_at: timeNow,
      modified_at: timeNow,
      revision: 0,
      sync_status: 'pending_insert',
    };

    const entryTagToInsert: EntryTag = {
      user_id: session.user.id,
      day: date,
      tag_id: uuid,
      order_no: entryTags.length,
      created_at: timeNow,
      modified_at: timeNow,
      revision: 0,
      sync_status: 'pending_insert',
    };
    // Cache: save
    await cacheAddOrUpdateTag(tagToInsert);

    // Local state: add tag
    userTags.current = [{ id: uuid, name, color: newTagColor.current }, ...userTags.current];

    // 2. Add tag to this entry
    // Cache: save
    await cacheAddOrUpdateEntryTag(entryTagToInsert);

    // Local state: add entry tag
    addEntryTag(entryTagToInsert);

    // Add to search results
    setResults([...searchTag(name)]);

    generateRandomTagColor();

    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'tag create',
    });
  };

  const handleSelect = async (e: any, item: ListItemType) => {
    e.preventDefault();
    if (activeIndex !== null) {
      if (item.type == 'action' && item.value == 'CREATE') {
        await cacheAddEntryIfNotExists(date);
        handleCreateAndAddTag(e, inputElement.value);
      } else {
        const selectedTag = { ...item.value };
        if (entryTags.some((t) => t.tag_id == selectedTag.id)) {
          logger(`- Removing ${selectedTag.name}`);
          removeEntryTag(selectedTag.id);
        } else {
          await cacheAddEntryIfNotExists(date);
          logger(`+ Adding ${selectedTag.name}`);
          const timeNow = serverTimeNow();
          const entryTagToInsert: EntryTag = {
            user_id: session.user.id,
            day: date,
            tag_id: selectedTag.id,
            order_no: entryTags.length,
            created_at: timeNow,
            modified_at: timeNow,
            revision: 0,
            sync_status: 'pending_insert',
          };
          addEntryTag(entryTagToInsert);
        }
      }
      setSelectedIndex(activeIndex);
    }
  };

  const handleEnableEditMode = () => {
    logger('onClick StyledWrapper');
    if (!editMode) {
      if (!entryTags.length) {
        setTimeout(() => inputElement.focus(), 100);
      }
      setEditMode(true);
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'tag edit-mode',
      });
    }
  };

  const reorder = (list: EntryTag[], startIndex: any, endIndex: any) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'tag reorder',
    });

    return result;
  };

  const onDragEnd = (result: any) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    if (result.destination.index === result.source.index) {
      return;
    }
    const reordered = reorder(entryTags, result.source.index, result.destination.index);
    logger(reordered);
    setEntryTags([...reordered]);
    const timeNow = serverTimeNow();
    reordered.map((entryTag, order_no) => {
      const sync_status = 'pending_update';
      const modified_at = timeNow;
      const { user_id, day, tag_id } = entryTag;
      cacheUpdateEntryTagProperty({ order_no, sync_status, modified_at }, user_id, day, tag_id);
      const i = userEntryTags.current.findIndex(
        (t) => t.tag_id == entryTag.tag_id && t.day == date && t.user_id == session.user.id,
      );
      userEntryTags.current[i].order_no = order_no;
    });
  };

  const handleOnScroll = (event: any) => {
    const { scrollTop, clientHeight, scrollHeight } = event.target;
    if (scrollHeight > clientHeight) {
      if (scrollTop + clientHeight < scrollHeight) {
        setPopoverScrollDownArrow(true);
      } else {
        setPopoverScrollDownArrow(false);
      }
      if (scrollTop > 0) {
        setPopoverScrollUpArrow(true);
      } else {
        setPopoverScrollUpArrow(false);
      }
    }
  };

  const handleScroll = (e: any, dir: string) => {
    e.preventDefault();
    sel.refs.floating.current.scrollBy({
      top: dir == 'up' ? -36 : 36,
      left: 0,
      behavior: 'smooth',
    });
  };

  const EditMode = ({ children }: any) => {
    // logger('EditMode rerender')
    const handleCloseEsc = (e: any) => {
      logger('🚪 ESC');
      // logger(`${editMode ? '✔' : '-'} Edit mode`)
      // logger(`${open ? '✔' : '-'} Popover`)
      // logger(`${tagIndexEditing != null ? '✔' : '-'} Tag edit`)
      if (e.key == 'Escape') {
        if (colorPickerOpen) {
          if (tagEditingInputRef.current) {
            tagEditingInputRef.current.focus();
          }
          setColorPickerOpen(false);
          return;
        }
        if (tagIndexEditing != null) {
          logger('close Tag editing');
          inputElement.focus();
          setTagIndexEditing(null);
          return;
        }
        if (open) {
          logger('close popover');
          setOpen(false);
          return;
        }
        if (editMode) {
          logger('close editMode');
          setEditMode(false);
          clearInput();
          return;
        }
      }
    };

    const handleCloseMouse = (e: any) => {
      logger('🖱 Mouse');
      // logger(`${editMode ? '✔' : '-'} Edit mode`)
      // logger(`${open ? '✔' : '-'} Popover`)
      // logger(`${tagIndexEditing != null ? '✔' : '-'} Tag edit`)

      if (!tagWrapperRef.current.contains(e.target)) {
        logger('🖱 click outside tagWrapper');
        setColorPickerOpen(false);
        setTagIndexEditing(null);
        setOpen(false);
        setEditMode(false);
        clearInput();
        return;
      }

      if (!!sel.refs.floating.current && !sel.refs.floating.current.contains(e.target)) {
        logger('🖱 click outside popover');
        setColorPickerOpen(false);
        setTagIndexEditing(null);
        setOpen(false);
        return;
      }

      if (
        !!tagEditingRef.current &&
        !tagEditingRef.current.contains(e.target) &&
        tagIndexEditing != null
      ) {
        logger('🖱 click outside tagEditingRef');
        setColorPickerOpen(false);
        setTagIndexEditing(null);
        setTimeout(() => {
          inputElement.focus();
        }, 100);
        return;
      }

      if (
        !!tagEditingRef.current &&
        tagEditingRef.current.contains(e.target) &&
        tagIndexEditing != null &&
        colorPickerOpen
      ) {
        logger('🖱 click inside tagEditingRef while colorPickerOpen');
        if (tagEditingInputRef.current) {
          tagEditingInputRef.current.focus();
        }
        setColorPickerOpen(false);
        return;
      }
    };

    useEffect(() => {
      // logger('✅ addEventListener')
      document.addEventListener('keydown', handleCloseEsc);
      document.addEventListener('mousedown', handleCloseMouse);

      return () => {
        // logger('❌ removeEventListener')
        document.removeEventListener('keydown', handleCloseEsc);
        document.removeEventListener('mousedown', handleCloseMouse);
      };
    }, []);

    return <>{children}</>;
  };

  return (
    <StyledWrapper editMode={editMode} onClick={handleEnableEditMode} ref={tagWrapperRef}>
      {editMode && (
        <EditMode>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={`${date}-droppable`}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {entryTags.map((entryTag: EntryTag, i) => {
                    const tag = userTags.current.find((t) => t.id == entryTag.tag_id);
                    return (
                      tag && (
                        <Draggable
                          key={`${date}-${entryTag.tag_id}`}
                          draggableId={`${date}-${entryTag.tag_id}`}
                          index={i}
                        >
                          {(provided) => (
                            <StyledTagHandle
                              key={entryTag.tag_id}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <StyledTag editMode={editMode}>
                                <StyledTagColorDot fillColor={theme(`color.tags.${tag.color}`)} />
                                <StyledTagTitle>{tag.name}</StyledTagTitle>
                                {editMode && (
                                  <StyledRemoveTagIcon
                                    onMouseUp={() => removeEntryTag(entryTag.tag_id)}
                                  />
                                )}
                              </StyledTag>
                            </StyledTagHandle>
                          )}
                        </Draggable>
                      )
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </EditMode>
      )}
      {!editMode &&
        entryTags.map((entryTag: EntryTag) => {
          const tag = userTags.current.find((t) => t.id == entryTag.tag_id);
          return (
            tag && (
              <StyledTagHandle key={`${date}-${entryTag.tag_id}`}>
                <StyledTag editMode={editMode}>
                  <StyledTagColorDot fillColor={theme(`color.tags.${tag.color}`)} />
                  <StyledTagTitle>{tag.name}</StyledTagTitle>
                </StyledTag>
              </StyledTagHandle>
            )
          );
        })}
      <StyledTagsInputWrapper ref={positioningRef} editMode={editMode}>
        <StyledPlusIcon name="Plus" />
        <StyledTagsInput
          editMode={editMode}
          onChange={handleChange}
          tabIndex={-1}
          maxLength={80}
          placeholder="Tag"
          {...getReferenceProps({
            // @ts-expect-error will fix types
            ref: sel.reference,
            onFocus: () => {
              if (editMode) {
                setOpen(true);
              }
              logger(`onFocus StyledTagsInput`);
              logger(`editMode = ${editMode}`);
            },
            onBlur() {
              logger(`onBlur StyledTagsInput`);
            },
            onClick() {
              if (editMode) {
                setOpen(true);
              }
            },
            // onBlur() {
            //   clearInput()
            // },
            onKeyDown(e: React.KeyboardEvent) {
              logger('onKeyDown');
              if (e.key === 'Enter') {
                logger('Enter');
                const item = listIndexToItemType.current[activeIndex];
                handleSelect(e, item);
              }
            },
          })}
        ></StyledTagsInput>
      </StyledTagsInputWrapper>
      {open && !term && (
        <FloatingFocusManager context={sel.context}>
          <StyledPopover
            onScroll={handleOnScroll}
            // onFocus={() => sel.refs.reference.current.focus()}
            {...getFloatingProps({
              // @ts-expect-error will fix types
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
            {userTags.current.length == 0 ? (
              <StyledNoTags>Type to create tag</StyledNoTags>
            ) : (
              userTags.current.map((tag, i) => (
                <ListItemTag
                  key={`${date}-${tag.name}-${tag.id}`}
                  i={i}
                  date={date}
                  tag={tag}
                  entryTags={entryTags}
                  listRef={listRef}
                  listIndexToItemType={listIndexToItemType}
                  tagEditingRef={tagEditingRef}
                  tagEditingInputRef={tagEditingInputRef}
                  activeIndex={activeIndex}
                  tagIndexEditing={tagIndexEditing}
                  setTagIndexEditing={setTagIndexEditing}
                  colorPickerOpen={colorPickerOpen}
                  setColorPickerOpen={setColorPickerOpen}
                  handleSelect={handleSelect}
                  // @ts-expect-error will fix types
                  tagsInputRef={sel.refs.reference}
                  getItemProps={getItemProps}
                />
              ))
            )}
            <StyledScrollDownIcon
              isVisible={popoverScrollDownArrow}
              onMouseDown={(e: any) => handleScroll(e, 'down')}
            />
          </StyledPopover>
        </FloatingFocusManager>
      )}
      {open && term && (
        <FloatingFocusManager context={sel.context}>
          <StyledPopover
            {...getFloatingProps({
              // @ts-expect-error will fix types
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
                entryTags={entryTags}
                listRef={listRef}
                listIndexToItemType={listIndexToItemType}
                tagEditingRef={tagEditingRef}
                tagEditingInputRef={tagEditingInputRef}
                activeIndex={activeIndex}
                tagIndexEditing={tagIndexEditing}
                setTagIndexEditing={setTagIndexEditing}
                colorPickerOpen={colorPickerOpen}
                setColorPickerOpen={setColorPickerOpen}
                handleSelect={handleSelect}
                // @ts-expect-error will fix types
                tagsInputRef={sel.refs.reference}
                getItemProps={getItemProps}
              />
            ))}
            {!!results.length && !results.some((t) => t.name == inputElement.value) && (
              <StyledDivider />
            )}
            {!results.some((t) => t.name == inputElement.value) && (
              <StyledItem
                ref={(node) => {
                  listRef.current[results.length] = node;
                  listIndexToItemType.current[results.length] = { type: 'action', value: 'CREATE' };
                }}
                id={`${date}-CREATE`}
                isActive={activeIndex == results.length}
                isAnyActiveIndex={activeIndex != null}
                {...getItemProps({
                  onMouseDown(e: MouseEvent) {
                    e.stopPropagation();
                    inputElement.focus();
                    setTagIndexEditing(null);
                    handleCreateAndAddTag(e, inputElement.value);
                  },
                  onFocus() {
                    logger('StyledItem sel.refs.reference.current.focus()');
                    inputElement.focus();
                  },
                  onKeyDown() {
                    logger('onKeyDown Create tag');
                  },
                })}
              >
                Create{' '}
                <StyledTag editMode={false} maxWidth={200}>
                  <StyledTagColorDot fillColor={theme(`color.tags.${newTagColor.current}`)} />
                  <StyledTagTitle>{inputElement.value}</StyledTagTitle>
                </StyledTag>
              </StyledItem>
            )}
          </StyledPopover>
        </FloatingFocusManager>
      )}
    </StyledWrapper>
  );
}

export { EntryTags };
