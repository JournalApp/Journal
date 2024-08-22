import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { Icon } from '@/components';
import { theme } from '@/themes';
import { useEntriesContext , useUserContext } from '@/context';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { logger, ordinal } from '@/utils';
import { Modal } from './Modal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const showDropdown = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }`;

const DropdownStyled = styled(DropdownMenu.Content)`
  z-index: 9999;
  min-width: 200px;
  padding: 4px;
  border-radius: 12px;
  box-shadow: ${theme('style.shadow')};
  background-color: ${theme('color.popper.surface')};
  animation-name: ${showDropdown};
  animation-duration: ${theme('animation.time.normal')};
  -webkit-app-region: no-drag;
`;

const ItemStyled = styled(DropdownMenu.Item)`
  display: flex;
  border: 0;
  gap: 8px;
  padding: 8px 8px;
  border-radius: 8px;
  cursor: pointer;
  background-color: ${theme('color.popper.surface')};
  align-items: center;
  transition: ${theme('animation.time.normal')};
  &:focus,
  &:hover {
    border: 0;
    outline: none;
    background-color: ${theme('color.popper.hover')};
  }
`;
interface ItemTitleProps {
  textColor?: string
}

const ItemTitle = styled.span<ItemTitleProps>`
  ${(props) => (props.textColor ? `color: ${props.textColor};` : '')}
  flex-grow: 1;
  font-size: 14px;
  line-height: 20px;
  text-align: left;
  padding-right: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  & em {
    opacity: 0.6;
    font-style: normal;
  }
`;

const isToday = (day: any) => {
  return day.toString() == dayjs().format('YYYY-MM-DD');
};

interface MenuButtonProps {
  open: boolean
}

const MenuButtonStyled = styled(DropdownMenu.Trigger)<MenuButtonProps>`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 0;
  outline: none;
  background-color: ${(props) => (props.open ? theme('color.secondary.surface') : 'transparent')};
  ${(props) => (props.open ? 'transform: rotate(180deg);' : '')}
  -webkit-app-region: no-drag;
  border-radius: 100px;
  transition: ${theme('animation.time.normal')};
  &:focus,
  &:hover,
  &:active {
    background-color: ${theme('color.secondary.surface')};
    box-shadow: 0 0 0 2px ${theme('color.secondary.surface')};
    transition: box-shadow
      ${theme('animation.time.veryFast') + ' ' + theme('animation.timingFunction.dynamic')};
  }
`;

const Divider = styled(DropdownMenu.Separator)`
  background-color: ${theme('color.popper.border')};
  height: 1px;
  margin: 4px 12px;
`;

const StatsWrapperStyled = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatsRowStyled = styled.div`
  display: flex;
  font-weight: 400;
  font-size: 12px;
  line-height: 20px;
`;

const StatsTitleStyled = styled.div`
  flex: 1;
  opacity: 0.6;
`;

const StatsValueStyled = styled.div``;

interface EntryMenuProps {
  renderTrigger: any
  date: string
  wordCount: React.MutableRefObject<number | string[]>
}

const EntryMenu = ({ renderTrigger, wordCount, date }: EntryMenuProps) => {
  logger('EntryMenu re-render');
  const [open, setOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [lastModifiedAt, setLastModifiedAt] = useState('');
  const [dayNo, setDayNo] = useState(0);
  const { userEntries, deleteEntry } = useEntriesContext();
  const { session } = useUserContext();

  const returnFocus = useRef<HTMLButtonElement>(null);

  const deleteEntryHandler = (day: string) => {
    deleteEntry(day);
    window.electronAPI.capture({
      distinctId: session.user.id,
      event: 'entry entry-menu item',
      properties: { action: 'delete-entry' },
    });
  };

  useEffect(() => {
    if (open) {
      const lm = userEntries.current.find((entry: { day: string; }) => entry.day == date)?.modified_at;
      if (lm) setLastModifiedAt(dayjs(lm).fromNow());

      const i = userEntries.current.findIndex((e: { day: string; }) => e.day == date);
      if (i) setDayNo(i);

      if (isToday(date)) {
        setDayNo(userEntries.current.length);
      }
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'entry entry-menu open',
      });
    }
  }, [open]);

  return (
    <DropdownMenu.Root onOpenChange={(open) => setOpen(open)}>
      <MenuButtonStyled open={open} ref={returnFocus} data-testid={`menu-day-${date}`}>
        {renderTrigger()}
      </MenuButtonStyled>
      <DropdownStyled
        side='left'
        sideOffset={-24}
        align='start'
        alignOffset={30}
        avoidCollisions={false}
      >
        <StatsWrapperStyled>
          <StatsRowStyled>
            <StatsTitleStyled>Day</StatsTitleStyled>
            <StatsValueStyled>
              {isToday(date) ? ordinal(userEntries.current.length + 1) : ordinal(dayNo + 1)}
            </StatsValueStyled>
          </StatsRowStyled>
          <StatsRowStyled>
            <StatsTitleStyled>Words</StatsTitleStyled>
            <StatsValueStyled>{wordCount.current}</StatsValueStyled>
          </StatsRowStyled>
          {lastModifiedAt && (
            <StatsRowStyled>
              <StatsTitleStyled>Last edited</StatsTitleStyled>
              <StatsValueStyled>{lastModifiedAt}</StatsValueStyled>
            </StatsRowStyled>
          )}
        </StatsWrapperStyled>
        {!isToday(date) && (
          <>
            <Divider />
            <ItemStyled
              data-testid={`menu-day-${date}-remove`}
              onSelect={() => {
                if (wordCount.current == 0) {
                  setTimeout(() => {
                    deleteEntryHandler(date);
                  }, 200);
                } else {
                  setOpenModal(true);
                }
              }}
            >
              <Icon name='Trash' tintColor={theme('color.error.main')} />
              <ItemTitle textColor={theme('color.error.main')}>Remove</ItemTitle>
            </ItemStyled>
          </>
        )}
      </DropdownStyled>
      {openModal && <Modal action={() => deleteEntryHandler(date)} setOpenModal={setOpenModal} />}
    </DropdownMenu.Root>
  );
};

export { EntryMenu };
