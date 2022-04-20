import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { theme } from 'themes'
import { useAppearanceContext, AppearanceContextInterface } from 'context'

const ToggleButton = styled.button`
  position: fixed;
  top: 12px;
  left: 80px;
  z-index: 9999;
`

const TrafficLightMenu = () => {
  const { isCalendarOpen, toggleIsCalendarOpen } = useAppearanceContext()
  return (
    <>
      <ToggleButton onClick={() => toggleIsCalendarOpen()}>T</ToggleButton>
    </>
  )
}

export { TrafficLightMenu }
