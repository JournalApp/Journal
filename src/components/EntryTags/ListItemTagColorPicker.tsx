import React, { useState } from 'react';
import { theme, lightTheme } from '@/themes';
import { useFloating, offset, FloatingFocusManager, FloatingPortal } from '@floating-ui/react';
import {
  StyledEditTagColorPickerPopover,
  StyledEditTagColorPickerContainer,
  StyledColorPickerChevronIcon,
  StyledTagColorDot,
  StyledItemColorPicker,
} from './styled';
import type { Tag } from '@/types';
import { logger } from 'src/utils';
import { useUserContext } from '@/context';

type ListItemTagColorPickerProps = {
  tag: Tag;
  inputRef: React.MutableRefObject<HTMLInputElement>;
  colorPickerOpen: boolean;
  setColorPickerOpen: any;
  tagEditColorRef: React.MutableRefObject<Tag['color']>;
};

function ListItemTagColorPicker({
  inputRef,
  colorPickerOpen,
  setColorPickerOpen,
  tagEditColorRef,
}: ListItemTagColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState<Tag['color']>(tagEditColorRef.current);
  const { session } = useUserContext();
  const { refs, strategy, x, y, context } = useFloating<HTMLInputElement>({
    placement: 'left-start',
    open: colorPickerOpen,
    onOpenChange: setColorPickerOpen,
    middleware: [offset({ crossAxis: 0, mainAxis: 20 })],
  });

  const handleColorSelect = (e: any, color: Tag['color']) => {
    e.preventDefault();
    e.stopPropagation();
    tagEditColorRef.current = color;
    setSelectedColor(color);
    logger('handleColorSelect');
    toggleOpen(e);
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'tag edit color select',
      properties: { color },
    });
  };

  const toggleOpen = (e: any) => {
    e.stopPropagation();
    if (colorPickerOpen) {
      setColorPickerOpen(false);
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    } else {
      setColorPickerOpen(true);
    }
  };

  return (
    <>
      <StyledEditTagColorPickerContainer ref={refs.setReference}>
        <StyledTagColorDot fillColor={theme(`color.tags.${selectedColor}`)} />
        <StyledColorPickerChevronIcon
          type={colorPickerOpen ? 'up' : 'down'}
          onMouseDown={(e: any) => toggleOpen(e)}
        />
      </StyledEditTagColorPickerContainer>
      <FloatingPortal>
        {colorPickerOpen && (
          <FloatingFocusManager context={context}>
            <StyledEditTagColorPickerPopover
              ref={refs.setFloating}
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
              }}
            >
              {Object.keys(lightTheme.color.tags).map(
                (color: keyof typeof lightTheme.color.tags, i) => (
                  <StyledItemColorPicker
                    key={`${i}-${color}`}
                    onMouseDown={(e) => handleColorSelect(e, color)}
                    isActive={color == selectedColor}
                  >
                    <StyledTagColorDot size={16} fillColor={theme(`color.tags.${color}`)} />
                  </StyledItemColorPicker>
                ),
              )}
            </StyledEditTagColorPickerPopover>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </>
  );
}

export { ListItemTagColorPicker };
