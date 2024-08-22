import React, { useState, useEffect } from 'react';
import { logger } from '@/utils';
import { theme } from '@/themes';
import { offset, shift, flip, useFloating, FloatingPortal } from '@floating-ui/react';
import { getSelectionText, usePlateEditorState, useEventPlateId, insertText } from '@udecode/plate';
import styled, { keyframes } from 'styled-components';
import { useAppearanceContext } from '@/context';

const showDropdown = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;
interface MenuProps {
  posX?: string;
  posY?: string;
  pos?: string;
}

const Dropdown = styled.div<MenuProps>`
  position: ${(props) => (props.pos ? props.pos : 'absolute')};
  top: ${(props) => (props.posY ? props.posY : '')};
  left: ${(props) => (props.posX ? props.posX : '')};
  padding: 4px;
  border-radius: 12px;
  box-shadow: ${theme('style.shadow')};
  background-color: ${theme('color.popper.surface')};
  animation-name: ${showDropdown};
  animation-duration: ${theme('animation.time.normal')};
  -webkit-app-region: no-drag;
`;

const Item = styled.button`
  display: flex;
  border: 0;
  gap: 24px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  background-color: ${theme('color.popper.surface')};
  align-items: center;
  transition: ${theme('animation.time.normal')};
  &:hover {
    background-color: ${theme('color.popper.hover')};
  }
`;

const ItemTitle = styled.span`
  flex-grow: 1;
  color: ${theme('color.popper.main')};
  font-size: 14px;
  line-height: 20px;
  text-align: left;
`;

const ItemShortcut = styled.span`
  font-size: 14px;
  color: ${theme('color.popper.main')};
  line-height: 20px;
  text-align: right;
  opacity: 0.3;
`;

const Divider = styled.div`
  background-color: ${theme('color.popper.border')};
  height: 1px;
  margin: 8px 12px;
`;

interface ContextMenuProps {
  setIsEditorFocused: any;
  setContextMenuVisible: (val: any) => void;
  toggleContextMenu: any;
}

export const ContextMenu = ({
  setIsEditorFocused,
  setContextMenuVisible,
  toggleContextMenu,
}: ContextMenuProps) => {
  const editor = usePlateEditorState(useEventPlateId());
  const [spellSuggections, setSpellSuggections] = useState([]);
  const [editorFocused, setEditorFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const selectionText = editor && getSelectionText(editor);
  const { x, y, strategy, refs } = useFloating({
    placement: 'right-start',
    middleware: [offset({ mainAxis: 5, alignmentAxis: 4 }), flip(), shift()],
  });
  const { setSpellCheck, spellCheckIsEnabled } = useAppearanceContext();

  const setOpen = (e: any) => {
    logger('onContextMenu');
    if (!visible) {
      window.electronAPI.handleSpellCheck((event: any, value: any) => {
        if (value.dictionarySuggestions) {
          setSpellSuggections([...value.dictionarySuggestions]);
        }
      });
    }
    setVisible(!visible);

    refs.setReference({
      getBoundingClientRect() {
        return {
          x: e.clientX,
          y: e.clientY,
          width: 0,
          height: 0,
          top: e.clientY,
          right: e.clientX,
          bottom: e.clientY,
          left: e.clientX,
        };
      },
    });
  };

  const replaceWithSuggestion = (e: any, suggestion: string) => {
    insertText(editor, suggestion);
    setVisible(false);
    e.preventDefault();
  };

  const clipboardCommand = (e: any, command: string) => {
    switch (command) {
      case 'copy':
        document.execCommand('copy');
        break;
      case 'cut':
        document.execCommand('cut');
        break;
      case 'paste':
        navigator.clipboard.read().then((result) => {
          for (let i = 0; i < result.length; i++) {
            if (result[i].types.includes('text/html')) {
              result[i].getType('text/html').then((blob) => {
                blob.text().then((res) => {
                  const dataTransfer = {
                    constructor: {
                      name: 'DataTransfer',
                    },
                    getData: (format: string) => format === 'text/html' && res,
                  } as any;
                  // TODO Fix bullet lists pasting
                  editor.insertData(dataTransfer);
                  logger(res);
                });
              });
            } else if (result[i].types.includes('text/plain')) {
              result[i].getType('text/plain').then((blob) => {
                blob.text().then((res) => {
                  insertText(editor, res);
                });
              });
            }
          }
        });
        break;
      default:
        break;
    }
    setVisible(false);
    e.preventDefault();
  };

  useEffect(() => {
    // Assign function to parent's Ref
    toggleContextMenu.current = setOpen;
    setIsEditorFocused.current = setEditorFocused;
  }, []);

  useEffect(() => {
    setContextMenuVisible(visible);
    if (visible) {
      logger('addEventListener');
      window.addEventListener('click', () => setVisible(false), { once: true });
    }
  }, [visible]);

  useEffect(() => {
    if (!editorFocused) {
      setVisible(false);
    }
  }, [editorFocused]);

  return (
    <FloatingPortal>
      {visible && (
        <Dropdown
          ref={refs.setFloating}
          posX={`${Math.floor(x)}px`}
          posY={`${Math.floor(y)}px`}
          pos={strategy}
        >
          {spellSuggections &&
            spellSuggections.map((suggestion, i) => (
              <Item key={i} onMouseDown={(e) => replaceWithSuggestion(e, suggestion)}>
                <ItemTitle>{suggestion}</ItemTitle>
              </Item>
            ))}
          {spellSuggections.length > 0 ? <Divider /> : ''}
          {spellCheckIsEnabled == 'true' && (
            <>
              <Item
                onMouseDown={() => {
                  setSpellCheck('false');
                  setVisible(false);
                }}
              >
                <ItemTitle>Disable spell check</ItemTitle>
                <ItemShortcut></ItemShortcut>
              </Item>
              <Divider />
            </>
          )}
          {selectionText && (
            <Item onMouseDown={(e) => clipboardCommand(e, 'cut')}>
              <ItemTitle>Cut</ItemTitle>
              <ItemShortcut>⌘X</ItemShortcut>
            </Item>
          )}
          {selectionText && (
            <Item onMouseDown={(e) => clipboardCommand(e, 'copy')}>
              <ItemTitle>Copy</ItemTitle>
              <ItemShortcut>⌘C</ItemShortcut>
            </Item>
          )}
          <Item onMouseDown={(e) => clipboardCommand(e, 'paste')}>
            <ItemTitle>Paste</ItemTitle>
            <ItemShortcut>⌘V</ItemShortcut>
          </Item>
          {spellCheckIsEnabled == 'false' && (
            <>
              <Divider />
              <Item
                onMouseDown={() => {
                  setSpellCheck('true');
                  setVisible(false);
                }}
              >
                <ItemTitle>Enable spell check</ItemTitle>
                <ItemShortcut></ItemShortcut>
              </Item>
            </>
          )}
        </Dropdown>
      )}
    </FloatingPortal>
  );
};
