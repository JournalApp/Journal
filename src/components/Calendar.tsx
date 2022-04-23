import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import dayjs from 'dayjs'
import { theme } from 'themes'
import { useAppearanceContext, useEntriesContext, AppearanceContextInterface } from 'context'
import { CalendarOpen, getCalendarIsOpen } from 'config'
import { createDays, getYearsSince } from 'utils'

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
  font-size: 14px;
  line-height: 20px;
`

interface DayProps {
  isToday: boolean
  hasEntry: boolean
}

const Day = styled.button<DayProps>`
  background-color: ${(props) => (props.isToday ? theme('color.primary.main') : 'transparent')};
  padding: 5px 12px;
  width: fit-content;
  border-radius: 100px;
  min-width: 40px;
  text-align: center;
  cursor: pointer;
  border: 0;
  outline: 0;
  transition: ${theme('animation.time.normal')};
  & > div {
    color: ${(props) =>
      props.isToday ? theme('color.primary.surface') : theme('color.primary.main')};
    font-weight: ${(props) => (props.hasEntry ? '500' : '300')};
    opacity: ${(props) => (props.hasEntry ? '1' : '0.5')};
  }
  &:hover {
    background-color: ${(props) =>
      props.isToday ? theme('color.primary.main') : theme('color.primary.hover')};
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
  padding-bottom: 50vh;
`

const withLeadingZero = (num: number) => {
  return (num < 10 ? '0' : '') + num
}

const scrollToDay = (date: string) => {
  let element = document.getElementById(`${date}-entry`)
  if (element) {
    element.scrollIntoView({ inline: 'center', behavior: 'smooth' })
  } else {
    console.log('no such day')
  }
}

const Calendar = () => {
  const { isCalendarOpen } = useAppearanceContext()
  const { daysCache } = useEntriesContext()
  const today = new Date()

  useEffect(() => {
    let today = dayjs().format('YYYYMMDD')
    let element = document.getElementById(`${today}-calendar`)
    if (element) {
      element.scrollIntoView({ block: 'center' })
    }
  }, [])

  const hasEntry = (date: string) => {
    if (daysCache.current && Array.isArray(daysCache.current)) {
      return daysCache.current.some((el: string) => el == date)
    } else {
      return false
    }
  }

  const isToday = (year: number, month: number, day: number) => {
    return year == today.getFullYear() && month == today.getMonth() && day == today.getDate()
  }

  const isBeforeToday = (year: number, month: number, day?: number) => {
    if (year < today.getFullYear()) {
      return true
    } else if (year == today.getFullYear()) {
      if (month < today.getMonth()) {
        return true
      } else if (month == today.getMonth()) {
        if (!day || day <= today.getDate()) {
          return true
        }
      }
    }
    return false
  }

  // TODO add +ADD action do days without entries
  // TODO Today button, to scroll to today in calendar
  // TODO Today button, to scroll to today in entry list

  return (
    <>
      <Container isOpen={isCalendarOpen}>
        <Days>
          {getYearsSince(2020).map((year) =>
            [...Array(12)].map(
              (i, month) =>
                isBeforeToday(year, month) && (
                  <Month key={`${year}${month}`}>
                    <MonthLabel>
                      {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
                        new Date(year, month)
                      )}{' '}
                      {year}
                    </MonthLabel>
                    {createDays(year, month + 1).map(
                      (day) =>
                        isBeforeToday(year, month, day) && (
                          <Day
                            key={
                              year + withLeadingZero(month + 1) + withLeadingZero(day) + '-calendar'
                            }
                            id={
                              year + withLeadingZero(month + 1) + withLeadingZero(day) + '-calendar'
                            }
                            onClick={() =>
                              scrollToDay(year + withLeadingZero(month + 1) + withLeadingZero(day))
                            }
                            isToday={isToday(year, month, day)}
                            hasEntry={hasEntry(
                              year + withLeadingZero(month + 1) + withLeadingZero(day)
                            )}
                          >
                            <DayLabel>{day}</DayLabel>
                          </Day>
                        )
                    )}
                  </Month>
                )
            )
          )}
        </Days>
      </Container>
    </>
  )
}

export { Calendar }
