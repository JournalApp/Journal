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

const Days = styled.div`
  padding: 48px;
  text-align: end;
`

const Calendar = () => {
  const { isCalendarOpen } = useAppearanceContext()
  return (
    <>
      <Container isOpen={isCalendarOpen}>
        <Days>
          March
          {createDays(2022, 3).map((day) => (
            <div key={`202203${day}-calendar`}>{day}</div>
          ))}
          April
          {createDays(2022, 4).map((day) => (
            <div key={`202204${day}-calendar`}>{day}</div>
          ))}
        </Days>
      </Container>
    </>
  )
}

export { Calendar }
