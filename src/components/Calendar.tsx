import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme } from 'themes'
import { useAppearanceContext, AppearanceContextInterface } from 'context'
import { CalendarOpen, getCalendarIsOpen } from 'config'

interface ContainerProps {
  isOpen: CalendarOpen
}

const Container = styled.div<ContainerProps>`
  position: fixed;
  top: 0;
  left: ${(props) =>
    props.isOpen == 'opened' ? '0' : -getCalendarIsOpen('opened').entriesOffset + 'px'};
  transition: left ${theme('animation.time.normal')};
  height: 100vh;
  width: 200px;
  border: 2px solid blue;
`

const Calendar = () => {
  const { isCalendarOpen } = useAppearanceContext()
  return (
    <>
      <Container isOpen={isCalendarOpen}>Calendar</Container>
    </>
  )
}

export { Calendar }
