import React from 'react'
import { useEntriesContext } from 'context'
import { theme } from 'themes'
import styled from 'styled-components'
import dayjs from 'dayjs'
import { ordinal, breakpoints } from 'utils'

const AsideItem = styled.p`
  margin: 0;
  color: ${theme('color.primary.main')};
  opacity: 0.3;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
`
const AsideItemLabel = styled.p`
  padding: 0 0 16px 0;
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

const AsideMeta = styled.div`
  opacity: 0;
  top: 0;
  right: 0;
  position: absolute;
  transition: ${theme('animation.time.normal')};
`

const AsideMain = styled.div`
  transition: ${theme('animation.time.normal')};
`

const AsideStickyContainer = styled.div`
  position: sticky;
  top: 48px;
  text-align: end;
`

const Aside = styled.div`
  width: 200px;
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  & ${AsideMeta} {
    opacity: 0;
    right: 8px;
  }
  & ${AsideMain} {
    opacity: 1;
    right: 0;
  }
  &:hover {
    & ${AsideMeta} {
      opacity: 1;
      right: 0;
    }
    & ${AsideMain} {
      opacity: 0;
      margin-right: 8px;
    }
  }
  @media ${breakpoints.s} {
    display: none;
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

  const dayCountOrdinar = () => {
    let count = daysCache.findIndex((d: any) => d == date) + 1
    return ordinal(count)
  }

  return (
    <Aside>
      <AsideStickyContainer>
        <AsideMain>{showDate(date)}</AsideMain>
        <AsideMeta>
          <AsideItem>{dayCountOrdinar()}</AsideItem>
          <AsideItemLabel>day</AsideItemLabel>
          <AsideItem>{wordCount}</AsideItem>
          <AsideItemLabel>{wordCount == 1 ? 'word' : 'words'}</AsideItemLabel>
        </AsideMeta>
      </AsideStickyContainer>
    </Aside>
  )
}

export { EntryAside }
