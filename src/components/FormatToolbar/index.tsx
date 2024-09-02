import React, { useState, useEffect, useLayoutEffect } from 'react';
import * as Toolbar from '@radix-ui/react-toolbar';
import {
  offset,
  shift,
  useFloating,
  FloatingPortal,
  useDismiss,
  useInteractions,
} from '@floating-ui/react';
import { Icon } from '@/components';
import { BlockTypeSelect } from './BlockTypeSelect';
import { theme } from '@/themes';
import { useUserContext } from '@/context';

import {
  MARK_BOLD,
  MARK_UNDERLINE,
  MARK_ITALIC,
  MARK_STRIKETHROUGH,
  MARK_CODE,
  MARK_HIGHLIGHT,
  usePlateEditorRef,
  getPluginType,
  getSelectionText,
  isSelectionExpanded,
  toggleMark,
  useEventPlateId,
  usePlateEditorState,
  withPlateProvider,
  isMarkActive,
} from '@udecode/plate';
import styled, { keyframes } from 'styled-components';

const MARK_HAND_STRIKETHROUGH = 'hand-strikethrough';

interface WrapperProps {
  posX?: string;
  posY?: string;
  pos?: string;
}

const showToolbar = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const Wrapper = styled.div<WrapperProps>`
  position: ${(props) => (props.pos ? props.pos : 'absolute')};
  top: ${(props) => (props.posY ? props.posY : '')};
  left: ${(props) => (props.posX ? props.posX : '')};
  transition: ${theme('animation.time.fast')};
  animation-name: ${showToolbar};
  animation-duration: ${theme('animation.time.long')};
`;

const StyledToolbar = styled(Toolbar.Root)`
  display: flex;
  padding: 4px;
  gap: 8px;
  box-shadow: ${theme('style.shadow')};
  min-width: max-content;
  border-radius: 12px;
  background-color: ${theme('color.popper.surface')};
`;

interface StyledToggleProps {
  toggleOn: boolean;
}

const ToggleGroup = styled.div`
  display: flex;
  flex-basis: row;
  border-radius: 8px;

  & > :first-child {
    border-radius: 8px 0 0 8px;
  }

  & > :last-child {
    border-radius: 0 8px 8px 0;
  }
`;

const StyledToggle = styled.div<StyledToggleProps>`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: ${(props) =>
    props.toggleOn ? theme('color.popper.main') : theme('color.popper.inverted')};
  &:hover {
    background-color: ${(props) =>
      props.toggleOn ? theme('color.popper.main') : theme('color.popper.hoverInverted')};
  }
  transition: ${theme('animation.time.normal')};
`;

const getSelectionBoundingClientRect = () => {
  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount < 1) return;
  const domRange = domSelection.getRangeAt(0);
  return domRange.getBoundingClientRect();
};

const options = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' },
];

interface FormatToolbarProps {
  setIsEditorFocused: any;
  isContextMenuVisible: any;
}

export const FormatToolbar = ({ setIsEditorFocused, isContextMenuVisible }: FormatToolbarProps) => {
  const editorRef = usePlateEditorRef();
  const editor = usePlateEditorState(useEventPlateId());
  const [open, setOpen] = useState(true);
  const [editorFocused, setEditorFocused] = useState(false);
  const selectionExpanded = editor && isSelectionExpanded(editor);
  const selectionText = editor && getSelectionText(editor);
  const { x, y, refs, strategy, context } = useFloating({
    placement: 'top-start',
    middleware: [shift(), offset({ mainAxis: 8 })],
    open,
    onOpenChange: setOpen,
  });
  const { getFloatingProps } = useInteractions([useDismiss(context)]);
  const { session } = useUserContext();

  // https://github.com/udecode/plate/issues/1352#issuecomment-1056975461
  // useEffect(() => {
  //   if (editor && !editor.selection) {
  //     Transforms.select(editor, SlateEditor.end(editor, []))
  //   }
  // }, [editor])

  useEffect(() => {
    setIsEditorFocused.current = setEditorFocused;
  }, []);

  useLayoutEffect(() => {
    const select = getSelectionBoundingClientRect();
    if (select) {
      refs.setReference({
        getBoundingClientRect() {
          const { top, right, bottom, left, width, height, x, y } = select;
          return { top, right, bottom, left, width, height, x, y };
        },
      });
    }
  }, [refs.setReference, selectionExpanded, selectionText, editor.children]);

  useEffect(() => {
    if (!editorFocused) {
      setOpen(false);
    } else {
      if (!selectionText) {
        setOpen(false);
      } else if (selectionText && selectionExpanded) {
        setOpen(true);
      }
    }
  }, [selectionExpanded, selectionText, editorFocused]);

  const Toggle = withPlateProvider(({ markType, iconName }: any) => {
    const id = useEventPlateId();
    const editor = usePlateEditorState(id);
    const type = getPluginType(editorRef, markType);
    const state = !!editor?.selection && isMarkActive(editor, type!);

    const onMouseDown = (e: any) => {
      if (editor) {
        toggleMark(editor, { key: type, clear: '' });
      }
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'entry toolbar',
        properties: {
          item: markType,
        },
      });
    };

    return (
      <StyledToggle toggleOn={state} onMouseDown={onMouseDown}>
        <Icon
          name={iconName}
          tintColor={state ? theme('color.popper.inverted') : theme('color.popper.main')}
        />
      </StyledToggle>
    );
  });

  return (
    <FloatingPortal>
      {!isContextMenuVisible() && open && (
        <Wrapper
          ref={refs.setFloating}
          posX={`${Math.floor(x)}px`}
          posY={`${Math.floor(y)}px`}
          pos={strategy}
          {...getFloatingProps()}
        >
          <StyledToolbar>
            <BlockTypeSelect />
            <ToggleGroup>
              <Toggle markType={MARK_BOLD} iconName="FormatBold" />
              <Toggle markType={MARK_ITALIC} iconName="FormatItalic" />
              <Toggle markType={MARK_UNDERLINE} iconName="FormatUnderline" />
              <Toggle markType={MARK_STRIKETHROUGH} iconName="FormatStriketrough" />
              <Toggle markType={MARK_HAND_STRIKETHROUGH} iconName="FormatHandStriketrough" />
              <Toggle markType={MARK_CODE} iconName="FormatCode" />
              <Toggle markType={MARK_HIGHLIGHT} iconName="FormatMark" />
            </ToggleGroup>
          </StyledToolbar>
        </Wrapper>
      )}
    </FloatingPortal>
  );
};
