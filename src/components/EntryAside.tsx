import React from 'react'
import { useEntriesContext } from 'context'
import { theme } from 'themes'
import styled from 'styled-components'
import dayjs from 'dayjs'

const Aside = styled.div`
  width: 200px;
  padding-top: 24px;
  display: flex;
  flex-direction: column;
`
const AsideItem = styled.p`
  padding: 16px 0 0 0;
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
`
const AsideItemLabel = styled.p`
  padding: 0;
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 12px;
  font-weight: 300;
  line-height: 16px;
`

const AsideDay = styled.p`
  padding: 0;
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
`

const AsideYear = styled.p`
  padding: 0;
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 12px;
  font-weight: 300;
  line-height: 20px;
`

const AsideVisibleOnHover = styled.div`
  opacity: 0;
  transition: opacity ${theme('animation.time.normal')};
`

const AsideStickyContainer = styled.div`
  position: sticky;
  top: 48px;
  text-align: end;
  &:hover {
    & ${AsideVisibleOnHover} {
      opacity: 1;
    }
  }
`

const isToday = (day: any) => {
  return day.toString() == dayjs().format('YYYYMMDD')
}

const showDate = (day: any) => {
  if (isToday(day)) {
    return (
      <>
        <AsideDay>Today</AsideDay>
        <AsideYear>{dayjs(dayjs(day.toString(), 'YYYYMMDD')).format('D MMMM YYYY')}</AsideYear>
      </>
    )
  } else {
    return (
      <>
        <AsideDay>{dayjs(dayjs(day.toString(), 'YYYYMMDD')).format('D MMMM')}</AsideDay>
        <AsideYear>{dayjs(dayjs(day.toString(), 'YYYYMMDD')).format('YYYY')}</AsideYear>
      </>
    )
  }
}

type EntryAsideProps = {
  date: string
  wordCount: number
}

function EntryAside({ date, wordCount }: EntryAsideProps) {
  const { daysCache } = useEntriesContext()
  // TODO make it return day number
  return (
    <Aside>
      <AsideStickyContainer>
        {showDate(date)}
        <AsideVisibleOnHover>
          <AsideItem>{daysCache.findIndex((d: any) => d == date) + 1}</AsideItem>
          <AsideItemLabel>day</AsideItemLabel>
          <AsideItem>{wordCount}</AsideItem>
          <AsideItemLabel>words</AsideItemLabel>
        </AsideVisibleOnHover>
      </AsideStickyContainer>
    </Aside>
  )
}

export { EntryAside }
