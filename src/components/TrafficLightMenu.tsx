import React from 'react';
import styled from 'styled-components';
import { theme } from '@/themes';
import { useAppearanceContext } from '@/context';
import { Icon } from '@/components';

const Container = styled.div`
  position: fixed;
  display: flex;
  gap: 8px;
  top: 16px;
  left: 15px;
  z-index: 9999;
  opacity: 0.3;
  transition: opacity ${theme('animation.time.normal')};
  &:hover {
    opacity: 0.7;
  }
`;

const ToggleButton = styled.button`
  border: 0;
  outline: 0;
  padding: 0;
  background-color: transparent;
`;

const TrafficLightMenu = () => {
  const { isCalendarOpen, toggleIsCalendarOpen } = useAppearanceContext();
  return (
    <Container>
      <Icon name='TrafficLightOutline' />
      <ToggleButton data-testid='calendar-toggle' onClick={() => toggleIsCalendarOpen()}>
        <Icon name='TrafficLightCalendar' type={isCalendarOpen == 'opened' ? 'on' : 'off'} />
      </ToggleButton>
    </Container>
  );
};

export { TrafficLightMenu };
