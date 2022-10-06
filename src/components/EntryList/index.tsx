import React, { useState, useEffect, useRef } from 'react'
import { EntryItem } from 'components'
import { useEventEditorSelectors } from '@udecode/plate'
import { supabase, arrayEquals, isUnauthorized, logger } from 'utils'
import { useEntriesContext, useUserContext } from 'context'
import dayjs from 'dayjs'
import { BeforeEntries, PostEntries, Wrapper } from './styled'
import type { Tag } from '../EntryTags/types'
import type { Day } from '../../components/Entry/types'

var visibleSections: String[] = []
var rangeMarker: any
var calendarContainer: any
var scrollToToday: any
var rangeMarkerTop: number

const renderScrollToToday = () => {
  if (!scrollToToday) {
    scrollToToday = document.getElementById('ScrollToToday')
  }
  let today = dayjs().format('YYYY-MM-DD')
  if (visibleSections.some((day) => day == today)) {
    scrollToToday.style.marginBottom = '-32px'
  } else {
    scrollToToday.style.marginBottom = 0
  }
}

const renderMarker = () => {
  visibleSections.sort()

  if (!rangeMarker) {
    rangeMarker = document.getElementById('RangeVisible')
  }

  visibleSections.forEach((date: string, i) => {
    let elem = document.getElementById(`${date}-calendar`)
    if (elem) {
      const top = elem.offsetTop

      if (i == 0) {
        rangeMarkerTop = top
        rangeMarker.style.top = rangeMarkerTop - 2 + 'px'
      }

      if (i == visibleSections.length - 1) {
        let height = top - rangeMarkerTop + elem.offsetHeight + 4 + 'px'
        rangeMarker.style.height = height
      }
    }
  })
}

const onIntersection = (entries: any) => {
  entries.forEach((entry: any) => {
    let date = entry.target.id.slice(0, 10)
    if (entry.isIntersecting) {
      // Add to array
      visibleSections.push(date)
    } else {
      // Remove from array
      visibleSections = visibleSections.filter((v) => {
        return v != date
      })
    }
    renderMarker()
    renderScrollToToday()
  })

  if (!calendarContainer) {
    calendarContainer = document.getElementById('CalendarContainer')
  }

  calendarContainer.scrollTo({
    top: rangeMarkerTop - 48,
    behavior: 'smooth',
  })
}

const entriesObserver = new IntersectionObserver(onIntersection, {
  rootMargin: '-100px',
})

const EntryMemo = React.memo(EntryItem, (prevProps, nextProps) => {
  console.info('New memo compare')
  if (prevProps.entryDay === nextProps.entryDay) {
    return true
  }
  return false
})

function EntryList() {
  const [days, setDaysInternal] = useState<Day[]>([])
  const { userEntries, invokeRerenderEntryList } = useEntriesContext()

  const setDays = () => {
    let today = dayjs().format('YYYY-MM-DD') as Day
    let daysInCache = userEntries.current.map((entry) => entry.day) as Day[]
    setDaysInternal([...new Set([...daysInCache, today])].sort())
  }

  useEffect(() => {
    invokeRerenderEntryList.current = setDays
  }, [])

  return (
    <Wrapper>
      <PostEntries></PostEntries>
      {days
        .slice(0)
        .reverse()
        .map((day, i) => (
          <EntryMemo
            key={day}
            entryDay={day}
            entriesObserver={entriesObserver}
            cachedEntry={userEntries.current.find((item: any) => item.day == day)}
          />
        ))}
      <BeforeEntries></BeforeEntries>
    </Wrapper>
  )
}

export { EntryList }
