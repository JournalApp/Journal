import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme } from 'themes'
import { useAppearanceContext, AppearanceContextInterface } from 'context'
import { CalendarOpen, getCalendarIsOpen } from 'config'
import { createDays } from 'utils'

interface ContainerProps {
  isOpen: CalendarOpen
}

const Container = styled.div<ContainerProps>`
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: 100;
  overflow-y: scroll;
  left: ${(props) =>
    props.isOpen == 'opened' ? '0' : -getCalendarIsOpen('opened').entriesOffset + 'px'};
  transition: left ${theme('animation.time.normal')};
  width: 200px;
  border-right: 1px solid ${theme('color.primary.border')};
  &::-webkit-scrollbar {
    display: none;
  }
`

const DayLabel = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: ${theme('color.primary.main')};
`

const Day = styled.button`
  background-color: transparent;
  padding: 5px 12px;
  width: fit-content;
  border-radius: 100px;
  min-width: 40px;
  text-align: center;
  cursor: pointer;
  border: 0;
  outline: 0;
  transition: ${theme('animation.time.normal')};
  &:hover {
    background-color: ${theme('color.primary.hover')};
  }
`

const Month = styled.div`
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 6px;
`

const MonthLabel = styled.div`
  font-weight: 400;
  font-size: 10px;
  text-transform: uppercase;
  line-height: 20px;
  color: ${theme('color.primary.main')};
  opacity: 0.5;
  padding-right: 12px;
`

const Days = styled.div`
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 32px;
  padding: 48px;
  text-align: end;
`

const Calendar = () => {
  const { isCalendarOpen } = useAppearanceContext()
  return (
    <>
      <Container isOpen={isCalendarOpen}>
        <Days>
          <Month>
            <MonthLabel>March 2022</MonthLabel>
            {createDays(2022, 3).map((day) => (
              <Day key={`202203${day}-calendar`}>
                <DayLabel>{day}</DayLabel>
              </Day>
            ))}
          </Month>
          <Month>
            <MonthLabel>April 2022</MonthLabel>
            {createDays(2022, 4).map((day) => (
              <Day key={`202204${day}-calendar`}>
                <DayLabel>{day}</DayLabel>
              </Day>
            ))}
          </Month>
        </Days>
      </Container>
    </>
  )
}

export { Calendar }
