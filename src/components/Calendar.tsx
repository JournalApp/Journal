import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import dayjs from 'dayjs'
import { theme } from 'themes'
import { select, focusEditor } from '@udecode/plate'
import { useAppearanceContext, useEntriesContext, useUserContext } from 'context'
import { CalendarOpen, getCalendarIsOpen } from 'config'
import { createDays, getYearsSince, logger, entryHasNoContent } from 'utils'
import { Icon } from 'components'
import type { Day } from '../components/Entry/types'
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

const Day = styled.div`
  height: 30px;
  -webkit-app-region: no-drag;
`

const DayButton = styled.button<DayProps>`
  display: block;
  background-color: ${(props) => (props.isToday ? theme('color.primary.main') : 'transparent')};
  padding: 5px 12px;
  width: fit-content;
  border-radius: 100px;
  width: 42px;
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
    & > div {
      color: ${(props) =>
        props.hasEntry
          ? props.isToday
            ? theme('color.primary.surface')
            : theme('color.primary.main')
          : 'transparent'};
      &:before {
        color: ${theme('color.primary.main')};
        ${(props) => (props.hasEntry ? '' : "content: '+'; ")};
        position: relative;
        top: 1px;
        left: 1px;
        font-size: 24px;
        font-weight: 300;
        line-height: 0px;
      }
    }
  }
`

const Month = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 6px;
`

const MonthLabel = styled.div`
  top: 48px;
  text-align: left;
  position: sticky;
  height: fit-content;
  padding: 4px 0;
`

const MonthLabelMonth = styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: ${theme('color.primary.main')};
  opacity: 0.7;
`

const MonthLabelYear = styled.div`
  font-weight: 400;
  font-size: 10px;
  line-height: 16px;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
`

const Days = styled.div`
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 6px;
  text-align: end;
  flex-grow: 1;
`

const Years = styled.div`
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 12px;
  padding: 0 48px 0 16px;
  text-align: end;
  padding-bottom: 50vh;
`

const FadeTop = styled.div<ContainerProps>`
  position: fixed;
  pointer-events: none;
  top: 0;
  left: ${(props) =>
    props.isOpen == 'opened' ? '0' : -getCalendarIsOpen('opened').entriesOffset + 'px'};
  width: 200px;
  height: 64px;
  z-index: 10;
  transition: left ${theme('animation.time.normal')};
  background: linear-gradient(
    180deg,
    ${theme('color.primary.surface')} 0%,
    ${theme('color.primary.surface')} 35%,
    ${theme('color.primary.surface', 0)} 100%
  );
`

const FadeDown = styled.div<ContainerProps>`
  position: fixed;
  pointer-events: none;
  bottom: 0;
  left: ${(props) =>
    props.isOpen == 'opened' ? '0' : -getCalendarIsOpen('opened').entriesOffset + 'px'};
  width: 200px;
  height: 48px;
  z-index: 10;
  transition: left ${theme('animation.time.normal')};
  background: linear-gradient(
    0deg,
    ${theme('color.primary.surface')} 0%,
    ${theme('color.primary.surface')} 20%,
    ${theme('color.primary.surface', 0)} 100%
  );
`

const RangeVisible = styled.div`
  position: absolute;
  border-radius: 18px;
  pointer-events: none;
  height: 50px;
  width: 47px;
  left: 108px;
  transition: ${theme('animation.time.normal')};
  background-color: ${theme('color.popper.surface')};
  z-index: -1;
  opacity: 0.3;
`

const Remove = styled((props) => <Icon {...props} />)`
  position: relative;
  top: -27px;
  -webkit-app-region: no-drag;
  cursor: pointer;
  right: -24px;
  opacity: 0.5;
  transition: opacity ${theme('animation.time.normal')};
  &:hover {
    opacity: 0.8;
  }
`

const withLeadingZero = (num: number) => {
  return (num < 10 ? '0' : '') + num
}

const Calendar = () => {
  const { isCalendarOpen } = useAppearanceContext()
  const {
    cacheCreateNewEntry,
    deleteEntry,
    editorsRef,
    invokeForceSaveEntry,
    invokeRerenderCalendar,
    userEntries,
  } = useEntriesContext()
  const [days, setDaysInternal] = useState([])
  const [daysWithNoContent, setDaysWithNoContent] = useState<string[]>([])
  const { session } = useUserContext()
  const today = new Date()

  logger('Calendar render')

  const setDays = () => {
    let today = dayjs().format('YYYY-MM-DD') as Day
    let daysWithNoContent: Day[] = []
    let daysInCache = userEntries.current.map((entry) => {
      if (Array.isArray(entry.content) && entryHasNoContent(entry.content)) {
        daysWithNoContent.push(entry.day)
      }
      return entry.day
    }) as Day[]
    setDaysInternal([...new Set([...daysInCache, today])].sort())
    setDaysWithNoContent([...daysWithNoContent])
  }

  useEffect(() => {
    invokeRerenderCalendar.current = setDays
    let today = dayjs().format('YYYY-MM-DD')
    let element = document.getElementById(`${today}-calendar`)
    if (element) {
      element.scrollIntoView({ block: 'center' })
    }
  }, [])

  useEffect(() => {
    logger('daysWithNoContent updated:')
    logger(daysWithNoContent)
  }, [daysWithNoContent])

  const hasEntry = (date: string) => {
    if (days && Array.isArray(days)) {
      return days.some((el: string) => el == date)
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

  const scrollToDayAndAdd = async (day: string) => {
    let element = document.getElementById(`${day}-entry`)
    if (element) {
      element.scrollIntoView()
      const editor = editorsRef.current[day]
      if (editor) {
        focusEditor(editor)
        select(editor, {
          path: [0, 0],
          offset: 0,
        })
      }
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'calendar scroll-to-day',
      })
    } else {
      logger('no such day, adding...')
      await cacheCreateNewEntry(day)

      const focusInterval = setInterval(() => {
        const editor = editorsRef.current[day]
        if (editor) {
          logger('Found editor for added day')
          clearInterval(focusInterval)

          // Scroll to new entry
          const editorRef = document.getElementById(`${day}-entry`)
          editorRef.scrollIntoView()

          // Force save to supabase
          invokeForceSaveEntry.current[day]()

          // Set focus
          focusEditor(editor)
          select(editor, {
            path: [0, 0],
            offset: 0,
          })
        } else {
          logger('No editor for added day yet')
        }
      }, 100)
      window.electronAPI.capture({
        distinctId: session.user.id,
        event: 'calendar add-day',
      })
    }
  }

  return (
    <>
      <Container isOpen={isCalendarOpen} id='CalendarContainer'>
        <FadeTop isOpen={isCalendarOpen} />
        <FadeDown isOpen={isCalendarOpen} />
        <Years>
          {getYearsSince(2020).map((year) =>
            [...Array(12)].map(
              (i, month) =>
                isBeforeToday(year, month) && (
                  <Month key={`${year}-${month}`}>
                    <MonthLabel>
                      <MonthLabelMonth>
                        {new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
                          new Date(year, month)
                        )}
                      </MonthLabelMonth>
                      <MonthLabelYear>{year}</MonthLabelYear>
                    </MonthLabel>
                    <Days>
                      {createDays(year, month + 1).map((day) => {
                        const today = `${year}-${withLeadingZero(month + 1)}-${withLeadingZero(
                          day
                        )}`
                        return (
                          isBeforeToday(year, month, day) && (
                            <Day key={`${today}-wrapper`}>
                              <DayButton
                                key={`${today}-calendar`}
                                id={`${today}-calendar`}
                                onClick={() => scrollToDayAndAdd(today)}
                                isToday={isToday(year, month, day)}
                                hasEntry={hasEntry(today)}
                              >
                                <DayLabel>{day}</DayLabel>
                              </DayButton>
                              {daysWithNoContent.some((el) => el == today) &&
                                !isToday(year, month, day) &&
                                hasEntry(today) && (
                                  <Remove
                                    name='Cross'
                                    size={16}
                                    onClick={() => deleteEntry(today)}
                                  />
                                )}
                            </Day>
                          )
                        )
                      })}
                    </Days>
                  </Month>
                )
            )
          )}
        </Years>
        <RangeVisible id='RangeVisible' />
      </Container>
    </>
  )
}

export { Calendar }
